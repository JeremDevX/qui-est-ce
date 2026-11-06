import test from 'node:test';
import assert from 'node:assert/strict';
import { ATTRIBUTE_IDS } from '../../src/engine/catalog.ts';
import { startServer } from '../../src/server/server.ts';
import {
  assertError, connect, createRoom, expectMessage, ready, registerCleanup,
  sendMessage, session, type TestClient,
} from './helpers.ts';

test('duo : création, code inconnu, jonction, prêt, erreurs hors tour et salon plein', async (context) => {
  const server = await startServer(0);
  const clients: TestClient[] = [];
  registerCleanup(context, server, clients);
  const [p1, p2, third] = await Promise.all([
    connect(server.port, clients), connect(server.port, clients), connect(server.port, clients),
  ]);

  const created = session(await createRoom(p1, 'duo'));
  assert.equal(created.status, 'lobby');
  assert.equal(created.mode, 'duo');
  assert.equal(created.characters.length, 24);
  const code = created.roomCode;
  const hostChoice = created.characters[0]!.id;
  const guestChoice = created.characters[1]!.id;
  let responseIndex = p1.messages.length;
  let response = expectMessage(p1, 'error', responseIndex);
  sendMessage(p1, { protocolVersion: 2, type: 'create-room', mode: 'solo', penalty: 'immediate_loss' });
  assertError(await response, 'INVALID_MESSAGE');

  const missingCode = `${code.slice(0, 5)}${code[5] === 'A' ? 'B' : 'A'}`;
  responseIndex = third.messages.length;
  response = expectMessage(third, 'error', responseIndex);
  sendMessage(third, { protocolVersion: 2, type: 'join-room', roomCode: missingCode });
  assertError(await response, 'ROOM_NOT_FOUND');

  const p1BeforeJoin = p1.messages.length;
  const p1Joined = expectMessage(p1, 'snapshot', p1BeforeJoin);
  const p2Joined = expectMessage(p2, 'snapshot');
  sendMessage(p2, { protocolVersion: 2, type: 'join-room', roomCode: code });
  assert.equal(session(await p1Joined).playerId, 'p1');
  assert.equal(session(await p2Joined).playerId, 'p2');

  responseIndex = p2.messages.length;
  response = expectMessage(p2, 'error', responseIndex);
  sendMessage(p2, { protocolVersion: 2, type: 'join-room', roomCode: missingCode });
  assertError(await response, 'INVALID_MESSAGE');
  assert.equal(p1.messages.length, p1BeforeJoin + 1);

  for (const [fields, code] of [
    [{}, 'INVALID_MESSAGE'],
    [{ characterId: 1 }, 'INVALID_MESSAGE'],
    [{ characterId: hostChoice, playerId: 'p2' }, 'INVALID_MESSAGE'],
    [{ characterId: 'unknown' }, 'UNKNOWN_CHARACTER'],
  ] as const) {
    const rejected = expectMessage(p1, 'error');
    sendMessage(p1, { protocolVersion: 2, type: 'ready', ...fields });
    assertError(await rejected, code);
  }

  const p2Lobby = expectMessage(p2, 'snapshot');
  assert.deepEqual(session(await ready(p1, hostChoice)), { ...created, readyPlayers: ['p1'] });
  assert.deepEqual(session(await p2Lobby), { ...created, playerId: 'p2', readyPlayers: ['p1'] });

  const hostMessageCount = p1.messages.length;
  const guestMessageCount = p2.messages.length;
  const refusedChange = expectMessage(p1, 'error');
  sendMessage(p1, { protocolVersion: 2, type: 'ready', characterId: hostChoice });
  sendMessage(p1, { protocolVersion: 2, type: 'ready', characterId: guestChoice });
  assertError(await refusedChange, 'INVALID_MESSAGE');
  assert.equal(p1.messages.length, hostMessageCount + 1);
  assert.equal(p2.messages.length, guestMessageCount);

  const p1Playing = expectMessage(p1, 'snapshot', p1.messages.length);
  const p2Playing = expectMessage(p2, 'snapshot', p2.messages.length);
  sendMessage(p2, { protocolVersion: 2, type: 'ready', characterId: guestChoice });
  const p1Game = session(await p1Playing).game;
  const p2Game = session(await p2Playing).game;
  assert.ok(p1Game && p2Game);
  assert.equal(p1Game.activePlayerId, 'p1');
  assert.equal(p1Game.forbiddenAttribute, p2Game.forbiddenAttribute);
  assert.equal(p1Game.selfPlayer.id, 'p1');
  assert.equal(p2Game.selfPlayer.id, 'p2');
  assert.equal(p1Game.selfPlayer.remainingTurns, 6);
  assert.equal(p2Game.selfPlayer.remainingTurns, 6);
  assert.equal(p1Game.ownSecretId, hostChoice);
  assert.equal(p2Game.ownSecretId, guestChoice);
  assert.equal(p1Game.revealedTargets, null);
  assert.equal(p2Game.revealedTargets, null);

  responseIndex = third.messages.length;
  response = expectMessage(third, 'error', responseIndex);
  sendMessage(third, { protocolVersion: 2, type: 'join-room', roomCode: code });
  assertError(await response, 'ROOM_FULL');

  responseIndex = p2.messages.length;
  response = expectMessage(p2, 'error', responseIndex);
  const p1MessageCount = p1.messages.length;
  sendMessage(p2, {
    protocolVersion: 2, type: 'action',
    command: { type: 'question', attribute: 'glasses', value: false },
  });
  assertError(await response, 'WRONG_PLAYER');
  assert.equal(p1.messages.length, p1MessageCount);

  const finished = expectMessage(p1, 'snapshot');
  sendMessage(p1, { protocolVersion: 2, type: 'action', command: { type: 'guess', characterId: guestChoice } });
  const game = session(await finished).game;
  assert.equal(game?.winnerId, 'p1');
  assert.deepEqual(game?.revealedTargets, { p1: guestChoice, p2: hostChoice });
});

test('solo démarre seul et deux salons ne partagent pas leur état', async (context) => {
  const server = await startServer(0);
  const clients: TestClient[] = [];
  registerCleanup(context, server, clients);
  const [a, b] = await Promise.all([
    connect(server.port, clients), connect(server.port, clients),
  ]);

  const aCreated = session(await createRoom(a, 'solo'));
  assert.equal(aCreated.status, 'lobby');
  assert.equal(aCreated.mode, 'solo');
  assert.deepEqual(aCreated.characters, []);
  const aLobby = await ready(a);
  const bCreated = await createRoom(b, 'solo', 'lose_turn');
  const bLobby = await ready(b);
  assert.notEqual(aCreated.roomCode, session(bCreated).roomCode);
  assert.equal(session(aLobby).status, 'playing');
  assert.equal(session(bLobby).status, 'playing');
  assert.equal((await fetch(`http://127.0.0.1:${server.port}/ws`)).status, 404);

  const aGame = session(aLobby).game;
  const bMessagesBefore = b.messages.length;
  assert.ok(aGame);
  assert.equal(aGame.ownSecretId, null);
  const attribute = ATTRIBUTE_IDS.find((value) => value !== aGame.forbiddenAttribute)!;
  const actionResult = expectMessage(a, 'snapshot', a.messages.length);
  sendMessage(a, {
    protocolVersion: 2,
    type: 'action',
    command: { type: 'question', attribute, value: aGame.characters[0]!.attributes[attribute] },
  });
  const nextA = session(await actionResult).game;
  assert.ok(nextA);
  assert.equal(nextA.selfPlayer.remainingTurns, 5);
  assert.equal(b.messages.length, bMessagesBefore);
  assert.equal(session(b.messages.at(-1)!).game?.selfPlayer.remainingTurns, 6);
});

test('leave et fermeture appliquent l’abandon; un joueur de lobby peut repartir', async (context) => {
  const server = await startServer(0);
  const clients: TestClient[] = [];
  registerCleanup(context, server, clients);
  const [p1, p2, replacement, lobbyHost, lobbyPlayer, observer] = await Promise.all([
    connect(server.port, clients), connect(server.port, clients), connect(server.port, clients),
    connect(server.port, clients), connect(server.port, clients), connect(server.port, clients),
  ]);

  const created = await createRoom(p1, 'duo');
  const code = session(created).roomCode;
  const joined = expectMessage(p2, 'snapshot');
  sendMessage(p2, { protocolVersion: 2, type: 'join-room', roomCode: code });
  await joined;
  const startP1 = expectMessage(p1, 'snapshot', p1.messages.length);
  const startP2 = expectMessage(p2, 'snapshot', p2.messages.length);
  sendMessage(p1, { protocolVersion: 2, type: 'ready', characterId: 'c01' });
  await Promise.all([startP1, startP2]);
  const playP1 = expectMessage(p1, 'snapshot', p1.messages.length);
  const playP2 = expectMessage(p2, 'snapshot', p2.messages.length);
  sendMessage(p2, { protocolVersion: 2, type: 'ready', characterId: 'c02' });
  await Promise.all([playP1, playP2]);

  const left = expectMessage(p1, 'left');
  const continuing = expectMessage(p2, 'snapshot', p2.messages.length);
  sendMessage(p1, { protocolVersion: 2, type: 'leave' });
  assert.equal((await left).type, 'left');
  const afterLeave = session(await continuing).game;
  assert.ok(afterLeave);
  assert.equal(afterLeave.players.find((player) => player.id === 'p1')?.status, 'lost');
  assert.equal(afterLeave.activePlayerId, 'p2');
  assert.equal(afterLeave.selfPlayer.remainingTurns, 6);

  const p1NewRoom = await createRoom(p1, 'solo');
  assert.equal(session(p1NewRoom).playerId, 'p1');

  const lobby = await createRoom(lobbyHost, 'duo');
  const lobbyCode = session(lobby).roomCode;
  const lobbyJoined = expectMessage(lobbyPlayer, 'snapshot');
  sendMessage(lobbyPlayer, { protocolVersion: 2, type: 'join-room', roomCode: lobbyCode });
  await lobbyJoined;

  const lobbyHostReady = expectMessage(lobbyHost, 'snapshot', lobbyHost.messages.length);
  const lobbyPlayerReady = expectMessage(lobbyPlayer, 'snapshot', lobbyPlayer.messages.length);
  sendMessage(lobbyPlayer, { protocolVersion: 2, type: 'ready', characterId: 'c02' });
  assert.equal(session(await lobbyHostReady).status, 'lobby');
  assert.equal(session(await lobbyPlayerReady).readyPlayers.join(','), 'p2');

  const lobbyHostAfterLeave = expectMessage(lobbyHost, 'snapshot', lobbyHost.messages.length);
  const lobbyLeft = expectMessage(lobbyPlayer, 'left');
  sendMessage(lobbyPlayer, { protocolVersion: 2, type: 'leave' });
  await lobbyLeft;
  const lobbyAfterLeave = session(await lobbyHostAfterLeave);
  assert.equal(lobbyAfterLeave.status, 'lobby');
  assert.deepEqual(lobbyAfterLeave.readyPlayers, []);
  const replacementJoined = expectMessage(replacement, 'snapshot');
  sendMessage(replacement, { protocolVersion: 2, type: 'join-room', roomCode: lobbyCode });
  assert.equal(session(await replacementJoined).playerId, 'p2');

  const hostLobby = expectMessage(lobbyHost, 'snapshot', lobbyHost.messages.length);
  const replacementLobby = expectMessage(replacement, 'snapshot', replacement.messages.length);
  sendMessage(lobbyHost, { protocolVersion: 2, type: 'ready', characterId: 'c01' });
  const [hostWaiting, replacementWaiting] = await Promise.all([hostLobby, replacementLobby]);
  assert.equal(session(hostWaiting).status, 'lobby');
  assert.deepEqual(session(hostWaiting).readyPlayers, ['p1']);
  assert.equal(session(replacementWaiting).status, 'lobby');
  const hostPlaying = expectMessage(lobbyHost, 'snapshot', lobbyHost.messages.length);
  const replacementPlaying = expectMessage(replacement, 'snapshot', replacement.messages.length);
  sendMessage(replacement, { protocolVersion: 2, type: 'ready', characterId: 'c03' });
  const [hostStarted, replacementStarted] = await Promise.all([hostPlaying, replacementPlaying]);
  assert.equal(session(hostStarted).game?.ownSecretId, 'c01');
  assert.equal(session(replacementStarted).game?.ownSecretId, 'c03');
  const afterClose = expectMessage(lobbyHost, 'snapshot', lobbyHost.messages.length);
  replacement.socket.close();
  const closedView = session(await afterClose).game;
  assert.ok(closedView);
  assert.equal(closedView.players.find((player) => player.id === 'p2')?.status, 'lost');
  assert.equal(closedView.activePlayerId, 'p1');
  assert.equal(closedView.selfPlayer.remainingTurns, 6);

  const abandonedLobby = await createRoom(observer, 'duo');
  const abandonedCode = session(abandonedLobby).roomCode;
  const observerJoined = expectMessage(lobbyPlayer, 'snapshot', lobbyPlayer.messages.length);
  sendMessage(lobbyPlayer, { protocolVersion: 2, type: 'join-room', roomCode: abandonedCode });
  await observerJoined;
  const observerLeft = expectMessage(observer, 'left');
  const closedLobbySocket = new Promise<void>((resolve) => lobbyPlayer.socket.once('close', () => resolve()));
  sendMessage(observer, { protocolVersion: 2, type: 'leave' });
  await observerLeft;
  await closedLobbySocket;
  const missing = expectMessage(observer, 'error');
  sendMessage(observer, { protocolVersion: 2, type: 'join-room', roomCode: abandonedCode });
  assertError(await missing, 'ROOM_NOT_FOUND');
});

test('une déconnexion de p2 avant le démarrage préserve le choix de p1', async (context) => {
  const server = await startServer(0);
  const clients: TestClient[] = [];
  registerCleanup(context, server, clients);
  const [p1, p2, replacement] = await Promise.all([
    connect(server.port, clients), connect(server.port, clients), connect(server.port, clients),
  ]);

  const created = await createRoom(p1, 'duo');
  const hostCode = session(created).roomCode;
  const joined = expectMessage(p1, 'snapshot', p1.messages.length);
  sendMessage(p2, { protocolVersion: 2, type: 'join-room', roomCode: hostCode });
  await joined;
  assert.deepEqual(session(await ready(p1, 'c01')).readyPlayers, ['p1']);

  const hostAfterDisconnect = expectMessage(p1, 'snapshot', p1.messages.length);
  const disconnected = new Promise<void>((resolve) => p2.socket.once('close', () => resolve()));
  p2.socket.close();
  await disconnected;

  const lobby = session(await hostAfterDisconnect);
  assert.equal(lobby.status, 'lobby');
  assert.deepEqual(lobby.readyPlayers, ['p1']);

  const hostSeesReplacement = expectMessage(p1, 'snapshot');
  const replacementJoined = expectMessage(replacement, 'snapshot');
  sendMessage(replacement, { protocolVersion: 2, type: 'join-room', roomCode: hostCode });
  await Promise.all([hostSeesReplacement, replacementJoined]);
  const hostStarted = expectMessage(p1, 'snapshot');
  const game = session(await ready(replacement, 'c02')).game;
  assert.equal(game?.status, 'playing');
  assert.equal(game?.ownSecretId, 'c02');
  const hostGame = session(await hostStarted).game;
  assert.equal(hostGame?.ownSecretId, 'c01');
});

