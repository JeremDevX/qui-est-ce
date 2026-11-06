import assert from 'node:assert/strict';
import test from 'node:test';
import { once } from 'node:events';
import { WebSocketServer } from 'ws';
import type { TestContext } from 'node:test';
import type { ClientMessage, ClientState, GameClient } from '../../src/contracts/protocol.ts';
import fixtureData from '../../fixtures/game-views.json' with { type: 'json' };
import { parseMockScenarios } from '../../src/ui/client/mock-fixtures.ts';
import { createWebSocketClient, parseServerMessage } from '../../src/ui/client/websocket.ts';
import { ActionController } from '../../src/ui/actions.ts';

const lobby = { protocolVersion: 2, type: 'snapshot', session: { roomCode: 'ABC123', playerId: 'p1', readyPlayers: [], status: 'lobby', game: null } };
const game = parseMockScenarios(fixtureData)[0]?.view;
assert.ok(game);
const playing = { protocolVersion: 2, type: 'snapshot', session: { roomCode: 'ABC123', playerId: game.viewerId, readyPlayers: [game.viewerId], status: game.status, game } };
function waitFor(client: GameClient, predicate: (state: ClientState) => boolean): Promise<ClientState> {
  const current = client.getState();
  if (predicate(current)) return Promise.resolve(current);
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => { unsubscribe(); reject(new Error('État client attendu non reçu.')); }, 3000);
    const unsubscribe = client.subscribe(state => { if (predicate(state)) { clearTimeout(timer); unsubscribe(); resolve(state); } });
  });
}
async function setup(t: TestContext) {
  const server = new WebSocketServer({ port: 0, host: '127.0.0.1' });
  t.after(() => new Promise<void>(resolve => { for (const socket of server.clients) socket.terminate(); server.close(() => resolve()); }));
  await once(server, 'listening');
  const address = server.address(); assert.ok(address && typeof address !== 'string');
  const connection = once(server, 'connection');
  const client = createWebSocketClient('ws://127.0.0.1:'+address.port+'/ws');
  t.after(() => client.close());
  assert.equal(client.getState().connection, 'connecting');
  assert.throws(() => client.send({ protocolVersion: 2, type: 'ready' }), /connecté/);
  const [socket] = await connection;
  await waitFor(client, state => state.connection === 'connected');
  return { server, socket, client };
}

test('I3 : WebSocket natif et cinq commandes v2, sans succès optimiste', async t => {
  const { socket, client } = await setup(t);
  const commands: ClientMessage[] = [
    { protocolVersion: 2, type: 'create-room', mode: 'duo', penalty: 'lose_turn' },
    { protocolVersion: 2, type: 'join-room', roomCode: 'ABC123' },
    { protocolVersion: 2, type: 'ready' },
    { protocolVersion: 2, type: 'action', command: { type: 'question', attribute: 'glasses', value: false } },
    { protocolVersion: 2, type: 'leave' },
  ];
  for (const message of commands) {
    const received = once(socket, 'message'); const before = client.getState();
    client.send(message);
    assert.deepEqual(client.getState(), before);
    assert.throws(() => client.send(message), /attend/);
    const [data] = await received;
    assert.deepEqual(JSON.parse(String(data)), message);
    assert.equal(String(data).includes('playerId'), false);
    const updated = waitFor(client, state => state.error?.code === 'INVALID_ACTION');
    socket.send(JSON.stringify({ protocolVersion: 2, type: 'error', code: 'INVALID_ACTION', message: 'Refus de test' }));
    await updated;
    // Efface l’erreur par snapshot pour attendre une nouvelle réponse à l’itération suivante.
    const snapshot = waitFor(client, state => state.session !== null && state.error === null);
    socket.send(JSON.stringify(lobby)); await snapshot;
  }
});

test('I3 : snapshot de jeu, erreur métier, historique autoritaire et verrou UI', async t => {
  const { socket, client } = await setup(t);
  socket.send(JSON.stringify(playing)); await waitFor(client, state => state.session?.game !== null && state.session !== null);
  const controller = new ActionController(client);
  const unsubscribe = client.subscribe(state => controller.receive(state)); t.after(unsubscribe);
  const before = client.getState();
  assert.equal(controller.send({ type: 'guess', characterId: 'c01' }), true);
  assert.equal(controller.pending, true);
  assert.equal(controller.send({ type: 'guess', characterId: 'c01' }), false);
  assert.deepEqual(client.getState(), before);
  const rejected = waitFor(client, state => state.error?.code === 'WRONG_PLAYER');
  socket.send(JSON.stringify({ protocolVersion: 2, type: 'error', code: 'WRONG_PLAYER', message: 'Attendez votre tour.' }));
  await rejected; assert.equal(controller.pending, false);
  assert.deepEqual(client.getState().session, before.session);
  const changed = structuredClone(playing); changed.session.game.selfPlayer.remainingTurns = 4;
  const confirmed = waitFor(client, state => state.session?.game?.selfPlayer.remainingTurns === 4);
  socket.send(JSON.stringify(changed)); await confirmed;
  assert.equal(client.getState().error, null);
});

test('I3 : états détachés, abonnements isolés et désabonnement', async t => {
  const { socket, client } = await setup(t);
  let calls = 0;
  const stop = client.subscribe(() => calls++); stop();
  client.subscribe(state => { if (state.session) state.session.readyPlayers.push('p2'); });
  socket.send(JSON.stringify(lobby)); await waitFor(client, state => state.session !== null);
  assert.deepEqual(client.getState().session?.readyPlayers, []);
  client.getState().session?.readyPlayers.push('p2');
  assert.deepEqual(client.getState().session?.readyPlayers, []);
  assert.equal(calls, 0);
});

test('I3 : left retire le salon uniquement après réception ; fermeture distante', async t => {
  const { socket, client } = await setup(t);
  socket.send(JSON.stringify(lobby)); await waitFor(client, state => state.session !== null);
  const received = once(socket, 'message'); client.send({ protocolVersion: 2, type: 'leave' }); await received;
  assert.ok(client.getState().session);
  const left = waitFor(client, state => state.session === null);
  socket.send(JSON.stringify({ protocolVersion: 2, type: 'left' })); await left;
  socket.close(); await waitFor(client, state => state.connection === 'closed');
  assert.throws(() => client.send({ protocolVersion: 2, type: 'ready' }), /connecté/);
});

test('I3 : JSON, version, champs et vues invalides ferment le transport', async t => {
  const badFrames = ['{', 'null', JSON.stringify({ protocolVersion: 1, type: 'left' }), JSON.stringify({ protocolVersion: 2, type: 'unknown' }), JSON.stringify({ ...lobby, session: { ...lobby.session, playerId: 'p9' } }), JSON.stringify({ ...playing, session: { ...playing.session, game: {} } }), JSON.stringify({ protocolVersion: 2, type: 'error', code: 'INVENTED', message: 'x' })];
  for (const frame of badFrames) await t.test(frame.slice(0,60), async sub => {
    const { socket, client } = await setup(sub);
    const failed = waitFor(client, state => state.connection === 'closed'); socket.send(frame);
    const state = await failed;
    assert.equal(state.session, null); assert.equal(state.error?.code, 'INVALID_MESSAGE');
  });
});

test('I3 : trame binaire rejetée, fermeture locale idempotente et pas de reconnexion', async t => {
  const { socket, client } = await setup(t);
  const closed = waitFor(client, state => state.connection === 'closed');
  socket.send(Buffer.from('binary')); await closed;
  client.close(); client.close(); assert.equal(client.getState().connection, 'closed');
  const other = await setup(t); other.client.close(); other.client.close();
  assert.equal(other.client.getState().connection, 'closed');
});

test('I3 : commandes avec identité/cible, mauvaise valeur et URL incorrecte rejetées', async t => {
  const { client } = await setup(t);
  for (const command of [
    { protocolVersion: 2, type: 'ready', playerId: 'p1' },
    { protocolVersion: 2, type: 'action', command: { type: 'guess', characterId: 'c01', playerId: 'p1' } },
    { protocolVersion: 2, type: 'action', command: { type: 'question', attribute: 'glasses', value: 'true' } },
  ]) assert.throws(() => Reflect.apply(client.send, client, [command]), /invalide|interdits/);
  assert.throws(() => createWebSocketClient('https://example.com'), /URL/);
  assert.throws(() => parseServerMessage({ ...lobby, target: 'c01' }));
});
