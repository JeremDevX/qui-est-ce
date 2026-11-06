import assert from 'node:assert/strict';
import test from 'node:test';
import type { ClientState, GameClient } from '../../src/contracts/protocol.ts';
import { startServer } from '../../src/server/server.ts';
import { createWebSocketClient } from '../../src/ui/client/websocket.ts';
import { ActionController } from '../../src/ui/actions.ts';
import { initialSelection, renderScreen } from '../../src/ui/screens.ts';

function waitFor(client: GameClient, predicate: (state: ClientState) => boolean): Promise<ClientState> {
  const current = client.getState();
  if (predicate(current)) return Promise.resolve(current);
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => { unsubscribe(); reject(new Error('État client attendu non reçu')); }, 5000);
    const unsubscribe = client.subscribe(state => {
      if (predicate(state)) { clearTimeout(timer); unsubscribe(); resolve(state); }
    });
  });
}

test('I4 : client et serveur réels, partie solo et question', async t => {
  const server = await startServer(0);
  t.after(() => server.close());
  const client = createWebSocketClient('ws://127.0.0.1:' + server.port + '/ws');
  t.after(() => client.close());
  await waitFor(client, state => state.connection === 'connected');
  const controller = new ActionController(client);
  t.after(client.subscribe(state => controller.receive(state)));
  controller.sendMessage({ protocolVersion: 2, type: 'create-room', mode: 'solo', penalty: 'lose_turn' });
  assert.equal(client.getState().session, null);
  await waitFor(client, state => state.session?.status === 'lobby');
  controller.sendMessage({ protocolVersion: 2, type: 'ready' });
  const playing = await waitFor(client, state => state.session?.status === 'playing');
  const game = playing.session?.game;
  assert.ok(game);
  assert.equal(game.mode, 'solo');
  assert.equal(game.characters.length, 24);
  assert.ok(game.characters.some(character => character.portrait));
  assert.ok(renderScreen(playing, false, initialSelection()).length > 0);
  const attribute = game.forbiddenAttribute === 'glasses' ? 'earrings' : 'glasses';
  assert.equal(controller.send({ type: 'question', attribute, value: true }), true);
  assert.equal(controller.pending, true);
  assert.equal(client.getState().session?.game?.selfPlayer.history.length, 0);
  const answered = await waitFor(client, state => (state.session?.game?.selfPlayer.history.length ?? 0) === 1);
  assert.equal(answered.session?.game?.selfPlayer.history[0]?.type, 'question');
  assert.equal(controller.pending, false);
});

test('I4 : deux clients rejoignent un salon et jouent chacun leur tour', async t => {
  const server = await startServer(0);
  t.after(() => server.close());
  const first = createWebSocketClient('ws://127.0.0.1:' + server.port + '/ws');
  const second = createWebSocketClient('ws://127.0.0.1:' + server.port + '/ws');
  t.after(() => { first.close(); second.close(); });
  await Promise.all([waitFor(first, s => s.connection === 'connected'), waitFor(second, s => s.connection === 'connected')]);
  first.send({ protocolVersion: 2, type: 'create-room', mode: 'duo', penalty: 'lose_turn' });
  const lobby = await waitFor(first, s => s.session?.status === 'lobby');
  assert.ok(lobby.session);
  second.send({ protocolVersion: 2, type: 'join-room', roomCode: lobby.session.roomCode });
  const joined = await waitFor(second, s => s.session?.status === 'lobby');
  assert.equal(joined.session?.playerId, 'p2');
  first.send({ protocolVersion: 2, type: 'ready' });
  await waitFor(first, s => s.session?.readyPlayers.includes('p1') === true);
  second.send({ protocolVersion: 2, type: 'ready' });
  const [one, two] = await Promise.all([
    waitFor(first, s => s.session?.status === 'playing'),
    waitFor(second, s => s.session?.status === 'playing'),
  ]);
  assert.equal(one.session?.game?.viewerId, 'p1');
  assert.equal(two.session?.game?.viewerId, 'p2');
  const game = one.session?.game;
  assert.ok(game);
  const attribute = game.forbiddenAttribute === 'glasses' ? 'earrings' : 'glasses';
  first.send({ protocolVersion: 2, type: 'action', command: { type: 'question', attribute, value: true } });
  await Promise.all([
    waitFor(first, s => (s.session?.game?.selfPlayer.history.length ?? 0) === 1),
    waitFor(second, s => s.session?.game?.activePlayerId === 'p2'),
  ]);
  const secondGame = second.getState().session?.game;
  assert.ok(secondGame);
  const secondAttribute = secondGame.forbiddenAttribute === 'glasses' ? 'earrings' : 'glasses';
  second.send({ protocolVersion: 2, type: 'action', command: { type: 'question', attribute: secondAttribute, value: true } });
  await waitFor(second, s => (s.session?.game?.selfPlayer.history.length ?? 0) === 1);
});

test('I4 : coupure du serveur puis nouvelle connexion après redémarrage', async t => {
  const server = await startServer(0);
  const client = createWebSocketClient('ws://127.0.0.1:' + server.port + '/ws');
  t.after(() => client.close());
  await waitFor(client, s => s.connection === 'connected');
  const closed = waitFor(client, s => s.connection === 'closed');
  await server.close();
  const state = await closed;
  assert.equal(state.session, null);
  const restarted = await startServer(server.port);
  t.after(() => restarted.close());
  const replacement = createWebSocketClient('ws://127.0.0.1:' + restarted.port + '/ws');
  t.after(() => replacement.close());
  await waitFor(replacement, s => s.connection === 'connected');
  replacement.send({ protocolVersion: 2, type: 'create-room', mode: 'solo', penalty: 'lose_turn' });
  await waitFor(replacement, s => s.session?.status === 'lobby');
});
