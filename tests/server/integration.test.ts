import assert from 'node:assert/strict';
import test, { type TestContext } from 'node:test';
import { ATTRIBUTE_IDS } from '../../src/engine/catalog.ts';
import type { ClientState, GameClient } from '../../src/contracts/protocol.ts';
import { startServer } from '../../src/server/server.ts';
import { createWebSocketClient } from '../../src/ui/client/websocket.ts';
import { findQuestion } from '../../src/ui/actions.ts';

function waitFor(client: GameClient, predicate: (state: ClientState) => boolean): Promise<ClientState> {
  const current = client.getState();
  if (predicate(current)) return Promise.resolve(current);

  return new Promise((resolve, reject) => {
    let unsubscribe = (): void => {};
    const timer = setTimeout(() => {
      unsubscribe();
      reject(new Error('État du client attendu non reçu.'));
    }, 5000);
    unsubscribe = client.subscribe((state) => {
      if (!predicate(state)) return;
      clearTimeout(timer);
      unsubscribe();
      resolve(state);
    });
  });
}

function waitForUpdate(client: GameClient): Promise<ClientState> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      unsubscribe();
      reject(new Error('Mise à jour du client attendue non reçue.'));
    }, 5000);
    const unsubscribe = client.subscribe((state) => {
      clearTimeout(timer);
      unsubscribe();
      resolve(state);
    });
  });
}

async function connect(port: number, clients: GameClient[]): Promise<GameClient> {
  const client = createWebSocketClient(`ws://127.0.0.1:${port}/ws`);
  clients.push(client);
  await waitFor(client, (state) => state.connection === 'connected');
  return client;
}

function registerCleanup(
  context: TestContext,
  server: Awaited<ReturnType<typeof startServer>>,
  clients: GameClient[],
): void {
  context.after(async () => {
    for (const client of clients) client.close();
    await server.close();
  });
}

test('M4 : le client réel voit code inconnu, départ lobby et abandon explicite', async (context) => {
  const server = await startServer(0);
  const clients: GameClient[] = [];
  registerCleanup(context, server, clients);
  const [host, guest, outsider] = await Promise.all([
    connect(server.port, clients), connect(server.port, clients), connect(server.port, clients),
  ]);

  host.send({ protocolVersion: 2, type: 'create-room', mode: 'duo', penalty: 'immediate_loss' });
  const hostLobby = await waitFor(host, (state) => state.session?.status === 'lobby');
  const roomCode = hostLobby.session?.roomCode;
  assert.ok(roomCode);

  const invalidCode = `${roomCode.slice(0, 5)}${roomCode[5] === 'A' ? 'B' : 'A'}`;
  const missingRoom = waitFor(outsider, (state) => state.error?.code === 'ROOM_NOT_FOUND');
  outsider.send({ protocolVersion: 2, type: 'join-room', roomCode: invalidCode });
  assert.equal((await missingRoom).session, null);

  const hostSeesJoin = waitForUpdate(host);
  guest.send({ protocolVersion: 2, type: 'join-room', roomCode });
  await waitFor(guest, (state) => state.session?.status === 'lobby');
  await hostSeesJoin;

  const guestReady = (state: ClientState): boolean => state.session?.readyPlayers.includes('p2') === true;
  const hostSeesReadyGuest = waitFor(host, guestReady);
  const guestSeesReady = waitFor(guest, guestReady);
  guest.send({ protocolVersion: 2, type: 'ready' });
  await Promise.all([hostSeesReadyGuest, guestSeesReady]);

  const hostSeesEmptyLobby = waitFor(
    host,
    (state) => state.session?.status === 'lobby' && state.session.readyPlayers.length === 0,
  );
  const guestLeft = waitFor(guest, (state) => state.session === null);
  guest.send({ protocolVersion: 2, type: 'leave' });
  await Promise.all([hostSeesEmptyLobby, guestLeft]);

  const hostReady = waitFor(host, (state) => state.session?.readyPlayers.includes('p1') === true);
  host.send({ protocolVersion: 2, type: 'ready' });
  await hostReady;
  const guestRejoined = waitFor(
    guest,
    (state) => state.session?.status === 'lobby' && state.session.readyPlayers.includes('p1'),
  );
  guest.send({ protocolVersion: 2, type: 'join-room', roomCode });
  await guestRejoined;

  const hostPlaying = waitFor(host, (state) => state.session?.status === 'playing');
  const guestPlaying = waitFor(guest, (state) => state.session?.status === 'playing');
  guest.send({ protocolVersion: 2, type: 'ready' });
  await Promise.all([hostPlaying, guestPlaying]);

  const game = host.getState().session?.game;
  assert.ok(game);
  const attribute = ATTRIBUTE_IDS.find((id) => id !== game.forbiddenAttribute);
  assert.ok(attribute);
  const character = game.characters[0];
  assert.ok(character);
  const question = findQuestion(attribute, String(character.attributes[attribute]));
  assert.ok(question);
  const hostBeforeRejectedAction = host.getState().session?.game;
  const wrongTurn = waitFor(guest, (state) => state.error?.code === 'WRONG_PLAYER');
  guest.send({
    protocolVersion: 2,
    type: 'action',
    command: question,
  });
  await wrongTurn;
  assert.deepEqual(host.getState().session?.game, hostBeforeRejectedAction);

  const hostSeesForfeit = waitFor(
    host,
    (state) => state.session?.game?.players.some((player) => player.id === 'p2' && player.status === 'lost') === true,
  );
  const guestLeftGame = waitFor(guest, (state) => state.session === null);
  guest.send({ protocolVersion: 2, type: 'leave' });
  await Promise.all([hostSeesForfeit, guestLeftGame]);
  assert.equal(host.getState().session?.game?.activePlayerId, 'p1');
  assert.equal(host.getState().session?.game?.selfPlayer.remainingTurns, 6);
});

test('M4 : six questions terminent une partie solo dans le client réel', async (context) => {
  const server = await startServer(0);
  const clients: GameClient[] = [];
  registerCleanup(context, server, clients);
  const player = await connect(server.port, clients);

  player.send({ protocolVersion: 2, type: 'create-room', mode: 'solo', penalty: 'lose_turn' });
  await waitFor(player, (state) => state.session?.status === 'lobby');
  const started = waitFor(player, (state) => state.session?.status === 'playing');
  player.send({ protocolVersion: 2, type: 'ready' });
  await started;

  for (let index = 0; index < 6; index++) {
    const game = player.getState().session?.game;
    assert.ok(game);
    const attribute = ATTRIBUTE_IDS.find(
      (id) => id !== game.forbiddenAttribute && !game.selfPlayer.usedAttributes.includes(id),
    );
    assert.ok(attribute);
    const character = game.characters[0];
    assert.ok(character);
    const question = findQuestion(attribute, String(character.attributes[attribute]));
    assert.ok(question);
    const historyLength = game.selfPlayer.history.length;
    const updated = waitFor(
      player,
      (state) => (state.session?.game?.selfPlayer.history.length ?? 0) === historyLength + 1,
    );
    player.send({
      protocolVersion: 2,
      type: 'action',
      command: question,
    });
    await updated;
  }

  const final = player.getState().session?.game;
  assert.ok(final);
  assert.equal(player.getState().session?.status, 'finished');
  assert.equal(final.status, 'finished');
  assert.equal(final.selfPlayer.remainingTurns, 0);
  assert.equal(final.selfPlayer.history.length, 6);
  assert.equal(final.activePlayerId, null);
  assert.equal(final.players.find((player) => player.id === 'p1')?.status, 'lost');
  assert.equal(final.winnerId, null);
  assert.notEqual(final.revealedTargets, null);
});

test('M4 : fermer la socket réelle en partie laisse l’autre joueur continuer', async (context) => {
  const server = await startServer(0);
  const clients: GameClient[] = [];
  registerCleanup(context, server, clients);
  const [host, guest] = await Promise.all([
    connect(server.port, clients), connect(server.port, clients),
  ]);

  host.send({ protocolVersion: 2, type: 'create-room', mode: 'duo', penalty: 'lose_turn' });
  const lobby = await waitFor(host, (state) => state.session?.status === 'lobby');
  const roomCode = lobby.session?.roomCode;
  assert.ok(roomCode);
  guest.send({ protocolVersion: 2, type: 'join-room', roomCode });
  await waitFor(guest, (state) => state.session?.status === 'lobby');
  host.send({ protocolVersion: 2, type: 'ready' });
  await waitFor(host, (state) => state.session?.readyPlayers.includes('p1') === true);
  const playing = waitFor(host, (state) => state.session?.status === 'playing');
  guest.send({ protocolVersion: 2, type: 'ready' });
  await playing;

  const hostSeesForfeit = waitFor(
    host,
    (state) => state.session?.game?.players.some((player) => player.id === 'p2' && player.status === 'lost') === true,
  );
  guest.close();
  const [hostState, guestState] = await Promise.all([
    hostSeesForfeit,
    waitFor(guest, (state) => state.connection === 'closed'),
  ]);
  assert.equal(guestState.session, null);
  assert.equal(hostState.session?.game?.activePlayerId, 'p1');
  assert.equal(hostState.session?.game?.selfPlayer.remainingTurns, 6);
});
