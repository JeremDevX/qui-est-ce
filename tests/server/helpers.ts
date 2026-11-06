import assert from 'node:assert/strict';
import type { TestContext } from 'node:test';
import { WebSocket } from 'ws';
import type { ServerMessage } from '../../src/contracts/protocol.ts';
import type { startServer } from '../../src/server/server.ts';

export interface TestClient {
  socket: WebSocket;
  messages: ServerMessage[];
  listeners: Set<(message: ServerMessage, index: number) => void>;
}

export async function connect(port: number, clients: TestClient[]): Promise<TestClient> {
  const socket = new WebSocket(`ws://127.0.0.1:${port}/ws`);
  const client: TestClient = { socket, messages: [], listeners: new Set() };
  socket.on('message', (data) => {
    const message = JSON.parse(data.toString()) as ServerMessage;
    const index = client.messages.push(message) - 1;
    for (const listener of client.listeners) listener(message, index);
  });
  socket.on('error', () => {});
  await new Promise<void>((resolve, reject) => {
    socket.once('open', resolve);
    socket.once('error', reject);
  });
  clients.push(client);
  return client;
}

export function expectMessage(
  client: TestClient,
  type: ServerMessage['type'],
  afterIndex = client.messages.length,
): Promise<ServerMessage> {
  const existingIndex = client.messages.findIndex((message, index) => index >= afterIndex && message.type === type);
  if (existingIndex >= 0) return Promise.resolve(client.messages[existingIndex]!);

  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      client.listeners.delete(listener);
      reject(new Error(`Timed out waiting for ${type}`));
    }, 3000);
    const listener = (message: ServerMessage, index: number): void => {
      if (index < afterIndex || message.type !== type) return;
      clearTimeout(timer);
      client.listeners.delete(listener);
      resolve(message);
    };
    client.listeners.add(listener);
  });
}

export function sendMessage(client: TestClient, message: unknown): void {
  client.socket.send(JSON.stringify(message));
}

export function session(message: ServerMessage) {
  assertSnapshot(message);
  return message.session;
}

export async function createRoom(
  client: TestClient,
  mode: 'solo' | 'duo',
  penalty: 'immediate_loss' | 'lose_turn' = 'immediate_loss',
): Promise<ServerMessage> {
  const response = expectMessage(client, 'snapshot');
  sendMessage(client, { protocolVersion: 2, type: 'create-room', mode, penalty });
  return response;
}

export async function ready(client: TestClient, characterId?: string): Promise<ServerMessage> {
  const response = expectMessage(client, 'snapshot');
  sendMessage(client, { protocolVersion: 2, type: 'ready', characterId });
  return response;
}

export function assertSnapshot(message: ServerMessage): asserts message is Extract<ServerMessage, { type: 'snapshot' }> {
  assert.equal(message.type, 'snapshot');
}

export function assertError(message: ServerMessage, code: string): asserts message is Extract<ServerMessage, { type: 'error' }> {
  assert.equal(message.type, 'error');
  if (message.type === 'error') assert.equal(message.code, code);
}

export function registerCleanup(
  context: TestContext,
  server: Awaited<ReturnType<typeof startServer>>,
  clients: TestClient[],
): void {
  context.after(async () => {
    for (const client of clients) client.socket.terminate();
    await server.close();
  });
}
