import test from 'node:test';
import assert from 'node:assert/strict';
import { startServer } from '../../src/server/server.ts';
import {
  assertError, connect, createRoom, expectMessage, ready, registerCleanup, sendMessage,
  session, type TestClient,
} from './helpers.ts';

test('le serveur valide strictement le protocole et réserve les erreurs à leur auteur', async (context) => {
  const server = await startServer(0);
  const clients: TestClient[] = [];
  registerCleanup(context, server, clients);
  const [player, outsider] = await Promise.all([
    connect(server.port, clients), connect(server.port, clients),
  ]);

  let from = player.messages.length;
  let error = expectMessage(player, 'error', from);
  player.socket.send('{broken json');
  assertError(await error, 'INVALID_MESSAGE');

  from = player.messages.length;
  error = expectMessage(player, 'error', from);
  sendMessage(player, { protocolVersion: 1, type: 'ready' });
  assertError(await error, 'UNSUPPORTED_VERSION');

  const created = await createRoom(player, 'solo');
  const code = session(created).roomCode;
  from = player.messages.length;
  error = expectMessage(player, 'error', from);
  sendMessage(player, {
    protocolVersion: 2, type: 'action',
    command: { type: 'question', attribute: 'glasses', value: false },
  });
  assertError(await error, 'NOT_STARTED');

  from = player.messages.length;
  error = expectMessage(player, 'error', from);
  sendMessage(player, {
    protocolVersion: 2, type: 'create-room', mode: 'duo', penalty: 'immediate_loss', target: 'c01',
  });
  assertError(await error, 'INVALID_MESSAGE');

  const notJoined = expectMessage(outsider, 'error');
  sendMessage(outsider, {
    protocolVersion: 2, type: 'action', command: { type: 'guess', characterId: 'c01' },
  });
  assertError(await notJoined, 'NOT_JOINED');

  const started = await ready(player);
  const gameView = session(started).game;
  assert.ok(gameView);
  const original = player.messages.length;
  from = player.messages.length;
  error = expectMessage(player, 'error', from);
  sendMessage(player, {
    protocolVersion: 2, type: 'action',
    command: { type: 'question', attribute: 'glasses', value: 'violet' },
  });
  assertError(await error, 'INVALID_MESSAGE');
  assert.equal(player.messages.length, original + 1);
  assert.equal(session(player.messages.at(-2)!).game?.selfPlayer.remainingTurns, 6);

  from = player.messages.length;
  error = expectMessage(player, 'error', from);
  sendMessage(player, {
    protocolVersion: 2, type: 'action',
    command: { type: 'guess', characterId: 'c01', playerId: 'p2' },
  });
  assertError(await error, 'INVALID_MESSAGE');

  from = player.messages.length;
  error = expectMessage(player, 'error', from);
  const snapshotsBeforeUnknownGuess = player.messages.filter((message) => message.type === 'snapshot').length;
  sendMessage(player, {
    protocolVersion: 2, type: 'action', command: { type: 'guess', characterId: 'c99' },
  });
  assertError(await error, 'UNKNOWN_CHARACTER');
  assert.equal(player.messages.filter((message) => message.type === 'snapshot').length, snapshotsBeforeUnknownGuess);
  assert.equal(session(started).roomCode, code);
  assert.equal(gameView.selfPlayer.remainingTurns, 6);

  from = player.messages.length;
  error = expectMessage(player, 'error', from);
  sendMessage(player, { protocolVersion: 2, type: 'ready' });
  assertError(await error, 'INVALID_MESSAGE');
});

test('les trames binaires sont rejetées', async (context) => {
  const server = await startServer(0);
  const clients: TestClient[] = [];
  registerCleanup(context, server, clients);
  const [client] = await Promise.all([connect(server.port, clients)]);
  const response = expectMessage(client, 'error');
  client.socket.send(Buffer.from('{"protocolVersion":2,"type":"ready"}'));
  assertError(await response, 'INVALID_MESSAGE');
});

test('une trame texte invalide ferme sa connexion sans arrêter le serveur', async (context) => {
  const server = await startServer(0);
  const clients: TestClient[] = [];
  registerCleanup(context, server, clients);
  const [invalid] = await Promise.all([connect(server.port, clients)]);
  const disconnected = new Promise<void>((resolve) => invalid.socket.once('close', () => resolve()));
  invalid.socket.send(Buffer.from([0xc3, 0x28]), { binary: false });
  await disconnected;

  const healthy = await connect(server.port, clients);
  const created = await createRoom(healthy, 'solo');
  assert.equal(session(created).status, 'lobby');
});
