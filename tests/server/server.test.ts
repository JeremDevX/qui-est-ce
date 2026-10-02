import test from 'node:test';
import assert from 'node:assert/strict';
import { WebSocket } from 'ws';
import { startServer } from '../../src/server/server.ts';
import type { ServerMessage } from '../../src/contracts/protocol.ts';

type Client = WebSocket & { messages: ServerMessage[] };
const connect = async (port: number): Promise<Client> => {
  const socket = new WebSocket(`ws://127.0.0.1:${port}/ws`) as Client;
  socket.messages = [];
  socket.on('message', (data) => socket.messages.push(JSON.parse(data.toString()) as ServerMessage));
  await new Promise<void>((resolve, reject) => { socket.once('open', () => resolve()); socket.once('error', reject); });
  return socket;
};
const wait = (ms = 30) => new Promise((resolve) => setTimeout(resolve, ms));
const last = (socket: Client, type: ServerMessage['type']): ServerMessage | undefined => [...socket.messages].reverse().find((message) => message.type === type);
const send = (socket: Client, message: unknown): void => socket.send(JSON.stringify(message));

test('salon duo : création, jonction, prêt, troisième joueur et JSON invalide', async () => {
  const server = await startServer(0); const a = await connect(server.port); const b = await connect(server.port); const c = await connect(server.port);
  try {
    send(a, { protocolVersion: 2, type: 'create-room', mode: 'duo', penalty: 'immediate_loss' }); await wait();
    const created = last(a, 'snapshot'); assert.ok(created && created.type === 'snapshot');
    const code = created.session.roomCode;
    send(b, { protocolVersion: 2, type: 'join-room', roomCode: code }); await wait();
    send(c, { protocolVersion: 2, type: 'join-room', roomCode: code }); await wait();
    const full = last(c, 'error'); assert.equal(full?.type, 'error'); if (full?.type === 'error') assert.equal(full.code, 'ROOM_FULL');
    send(a, { protocolVersion: 2, type: 'ready' }); send(b, { protocolVersion: 2, type: 'ready' }); await wait();
    const playing = last(a, 'snapshot'); assert.ok(playing && playing.type === 'snapshot' && playing.session.status === 'playing');
    a.send('{bad json'); await wait(); const invalid = last(a, 'error'); assert.equal(invalid?.type, 'error'); if (invalid?.type === 'error') assert.equal(invalid.code, 'INVALID_MESSAGE');
  } finally { a.close(); b.close(); c.close(); await server.close(); }
});

test('fermeture pendant une partie applique l’abandon', async () => {
  const server = await startServer(0); const a = await connect(server.port); const b = await connect(server.port);
  try {
    send(a, { protocolVersion: 2, type: 'create-room', mode: 'duo', penalty: 'immediate_loss' }); await wait();
    const created = last(a, 'snapshot'); assert.ok(created && created.type === 'snapshot');
    send(b, { protocolVersion: 2, type: 'join-room', roomCode: created.session.roomCode }); await wait();
    send(a, { protocolVersion: 2, type: 'ready' }); send(b, { protocolVersion: 2, type: 'ready' }); await wait();
    a.close(); await wait(80);
    const snapshot = last(b, 'snapshot'); assert.ok(snapshot && snapshot.type === 'snapshot');
    if (snapshot.type === 'snapshot') { assert.equal(snapshot.session.game?.players.find((p) => p.id === 'p1')?.status, 'lost'); assert.equal(snapshot.session.status, 'playing'); }
  } finally { b.close(); await server.close(); }
});

