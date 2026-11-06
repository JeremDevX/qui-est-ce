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

test('M4 : pénalités et bonne proposition à la sixième action avec le client réel', async (context) => {
  const server = await startServer(0);
  const clients: GameClient[] = [];
  registerCleanup(context, server, clients);
  const [player, immediate] = await Promise.all([
    connect(server.port, clients), connect(server.port, clients),
  ]);

  for (const [client, penalty] of [[player, 'lose_turn'], [immediate, 'immediate_loss']] as const) {
    client.send({ protocolVersion: 2, type: 'create-room', mode: 'solo', penalty });
    await waitFor(client, (state) => state.session?.status === 'lobby');
    const originalRandom = Math.random;
    try {
      Math.random = () => 0;
      const started = waitFor(client, (state) => state.session?.status === 'playing');
      client.send({ protocolVersion: 2, type: 'ready' });
      await started;
    } finally {
      Math.random = originalRandom;
    }
  }

  const immediateGame = immediate.getState().session?.game;
  assert.ok(immediateGame);
  const wrongId = immediateGame.characters[1]!.id;
  const immediateFinished = waitFor(immediate, (state) => state.session?.status === 'finished');
  immediate.send({ protocolVersion: 2, type: 'action', command: { type: 'guess', characterId: wrongId } });
  const lost = (await immediateFinished).session?.game;
  assert.equal(lost?.players[0]?.status, 'lost');
  assert.equal(lost?.selfPlayer.remainingTurns, 5);

  const initial = player.getState().session?.game;
  assert.ok(initial);
  const wrong = waitFor(player, (state) => state.session?.game?.selfPlayer.remainingTurns === 5);
  player.send({ protocolVersion: 2, type: 'action', command: { type: 'guess', characterId: initial.characters[1]!.id } });
  const afterWrong = (await wrong).session?.game;
  assert.ok(afterWrong);
  assert.equal(afterWrong.status, 'playing');
  assert.equal(afterWrong.selfPlayer.candidateIds.includes(initial.characters[1]!.id), false);
  for (let index = 0; index < 4; index++) {
    const game = player.getState().session?.game;
    assert.ok(game);
    const attribute = ATTRIBUTE_IDS.find((id) => id !== game.forbiddenAttribute && !game.selfPlayer.usedAttributes.includes(id));
    assert.ok(attribute);
    const question = findQuestion(attribute, String(game.characters[0]!.attributes[attribute]));
    assert.ok(question);
    const updated = waitFor(player, (state) => state.session?.game?.selfPlayer.remainingTurns === 4 - index);
    player.send({ protocolVersion: 2, type: 'action', command: question });
    await updated;
  }
  const finished = waitFor(player, (state) => state.session?.status === 'finished');
  player.send({ protocolVersion: 2, type: 'action', command: { type: 'guess', characterId: initial.characters[0]!.id } });
  const won = (await finished).session?.game;
  assert.equal(won?.winnerId, 'p1');
  assert.equal(won?.selfPlayer.remainingTurns, 0);
  assert.equal(won?.revealedTargets?.p1, initial.characters[0]!.id);
});

test('M4 : commande invalide et isolation entre salons avec le client réel', async (context) => {
  const server = await startServer(0);
  const clients: GameClient[] = [];
  registerCleanup(context, server, clients);
  const [host, other] = await Promise.all([connect(server.port, clients), connect(server.port, clients)]);
  host.send({ protocolVersion: 2, type: 'create-room', mode: 'duo', penalty: 'lose_turn' });
  const lobby = await waitFor(host, (state) => state.session?.status === 'lobby');
  const code = lobby.session?.roomCode;
  assert.ok(code);
  other.send({ protocolVersion: 2, type: 'create-room', mode: 'solo', penalty: 'lose_turn' });
  await waitFor(other, (state) => state.session?.status === 'lobby');
  const otherStarted = waitFor(other, (state) => state.session?.status === 'playing');
  other.send({ protocolVersion: 2, type: 'ready' });
  await otherStarted;

  const { WebSocket } = await import('ws');
  const socket = new WebSocket(`ws://127.0.0.1:${server.port}/ws`);
  context.after(() => socket.terminate());
  await new Promise<void>((resolve, reject) => {
    const onOpen = (): void => { socket.off('error', onError); resolve(); };
    const onError = (error: Error): void => { socket.off('open', onOpen); reject(error); };
    socket.once('open', onOpen);
    socket.once('error', onError);
  });
  const response = (): Promise<unknown> => new Promise((resolve, reject) => {
    const cleanup = (): void => {
      clearTimeout(timer);
      socket.off('message', onMessage);
      socket.off('close', onClose);
      socket.off('error', onError);
    };
    const onMessage = (data: { toString(): string }): void => {
      cleanup();
      try { resolve(JSON.parse(data.toString())); } catch (error) { reject(error); }
    };
    const onClose = (): void => { cleanup(); reject(new Error('Socket fermée avant réponse.')); };
    const onError = (error: Error): void => { cleanup(); reject(error); };
    const timer = setTimeout(() => { cleanup(); reject(new Error('Réponse serveur attendue non reçue.')); }, 5000);
    socket.once('message', onMessage);
    socket.once('close', onClose);
    socket.once('error', onError);
  });
  let received = response();
  socket.send(JSON.stringify({ protocolVersion: 2, type: 'join-room', roomCode: code }));
  await received;
  const hostReady = waitFor(host, (state) => state.session?.readyPlayers.includes('p1') === true);
  received = response();
  host.send({ protocolVersion: 2, type: 'ready' });
  await Promise.all([hostReady, received]);
  const playing = waitFor(host, (state) => state.session?.status === 'playing');
  received = response();
  socket.send(JSON.stringify({ protocolVersion: 2, type: 'ready' }));
  await Promise.all([playing, received]);
  const beforeHost = host.getState().session?.game;
  const beforeOther = other.getState().session?.game;
  const otherUpdates: ClientState[] = [];
  const unsubscribeOther = other.subscribe((state) => otherUpdates.push(state));
  context.after(unsubscribeOther);
  received = response();
  socket.send(JSON.stringify({ protocolVersion: 2, type: 'action', playerId: 'p1', command: { type: 'guess', characterId: 'c01' } }));
  assert.equal((await received as { code: string }).code, 'INVALID_MESSAGE');
  const hostBarrier = waitFor(host, (state) => state.error?.code === 'UNKNOWN_CHARACTER');
  host.send({ protocolVersion: 2, type: 'action', command: { type: 'guess', characterId: 'unknown' } });
  await hostBarrier;
  assert.deepEqual(host.getState().session?.game, beforeHost);

  assert.ok(beforeHost);
  const attribute = ATTRIBUTE_IDS.find((id) => id !== beforeHost.forbiddenAttribute);
  assert.ok(attribute);
  const question = findQuestion(attribute, String(beforeHost.characters[0]!.attributes[attribute]));
  assert.ok(question);
  const updated = waitFor(host, (state) => state.session?.game?.selfPlayer.remainingTurns === 5);
  host.send({ protocolVersion: 2, type: 'action', command: question });
  await updated;
  const otherBarrier = waitFor(other, (state) => state.error?.code === 'UNKNOWN_CHARACTER');
  other.send({ protocolVersion: 2, type: 'action', command: { type: 'guess', characterId: 'unknown' } });
  await otherBarrier;
  unsubscribeOther();
  assert.ok(otherUpdates.length > 0);
  for (const state of otherUpdates) assert.deepEqual(state.session?.game, beforeOther);
});
