import { createServer as createHttpServer, type Server } from 'node:http';
import { readFile } from 'node:fs/promises';
import { WebSocketServer, WebSocket, type RawData } from 'ws';
import { createGame } from '../engine/index.ts';
import type { Character, GameEngine, GameErrorCode, PlayerId } from '../contracts/game.ts';
import type { ProtocolErrorCode } from '../contracts/protocol.ts';
import { PROTOCOL_VERSION, type ClientMessage, type ServerMessage, type SessionView } from '../contracts/protocol.ts';

const loadCharacters = async (): Promise<Character[]> => {
  const candidates = ['data/characters.json', 'fixtures/characters.json'];
  for (const path of candidates) { try { return JSON.parse(await readFile(path, 'utf8')) as Character[]; } catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error; } }
  throw new Error('No catalogue found');
};
const send = (socket: WebSocket, message: ServerMessage): void => { if (socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify(message)); };
const error = (socket: WebSocket, code: ProtocolErrorCode | GameErrorCode, message: string): void => send(socket, { protocolVersion: 2, type: 'error', code, message });
const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;
const parseMessage = (value: unknown): ClientMessage | null => {
  if (!isRecord(value) || value.protocolVersion !== PROTOCOL_VERSION || typeof value.type !== 'string') return null;
  if (value.type === 'create-room' && (value.mode === 'solo' || value.mode === 'duo') && (value.penalty === 'immediate_loss' || value.penalty === 'lose_turn')) return value as ClientMessage;
  if (value.type === 'join-room' && typeof value.roomCode === 'string' && /^[A-Z0-9]{6}$/.test(value.roomCode)) return value as ClientMessage;
  if (value.type === 'ready' || value.type === 'leave') return value as ClientMessage;
  if (value.type === 'action' && isRecord(value.command) && (value.command.type === 'guess' || value.command.type === 'question')) return value as ClientMessage;
  return null;
};

export async function startServer(port = 3001): Promise<{ port: number; close: () => Promise<void> }> {
  const characters = await loadCharacters();
  const http: Server = createHttpServer((req, res) => { if (req.url !== '/ws') { res.statusCode = 404; res.end(); } });
  const wss = new WebSocketServer({ noServer: true });
  type Connection = { socket: WebSocket; room?: Room; player?: PlayerId };
  type Room = { code: string; mode: 'solo' | 'duo'; penalty: 'immediate_loss' | 'lose_turn'; connections: Map<WebSocket, Connection>; ready: Set<PlayerId>; engine?: GameEngine; started: boolean };
  const rooms = new Map<string, Room>(); const connections = new Map<WebSocket, Connection>();
  const roomCode = (): string => { let code = ''; do { code = Array.from({ length: 6 }, () => 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'[Math.floor(Math.random() * 36)]!).join(''); } while (rooms.has(code)); return code; };
  const snapshot = (connection: Connection): SessionView | null => { const room = connection.room; if (!room || !connection.player) return null; const base = { roomCode: room.code, playerId: connection.player, readyPlayers: [...room.ready] as PlayerId[] }; return room.engine ? { ...base, status: room.engine.getView(connection.player).status, game: room.engine.getView(connection.player) } : { ...base, status: 'lobby', game: null }; };
  const broadcast = (room: Room): void => { for (const c of room.connections.values()) { const session = snapshot(c); if (session) send(c.socket, { protocolVersion: 2, type: 'snapshot', session }); } };
  const remove = (connection: Connection, notify: boolean): void => { const room = connection.room; if (!room) return; if (room.engine && connection.player) { room.engine.forfeit(connection.player); broadcast(room); } room.connections.delete(connection.socket); connections.delete(connection.socket); if (notify) send(connection.socket, { protocolVersion: 2, type: 'left' }); if (connection.player === 'p1' && !room.engine) { for (const c of room.connections.values()) c.socket.close(); rooms.delete(room.code); } else if (room.connections.size === 0) rooms.delete(room.code); };
  const handle = (connection: Connection, raw: RawData): void => {
    let parsed: unknown; try { parsed = JSON.parse(raw.toString()); } catch { error(connection.socket, 'INVALID_MESSAGE', 'JSON invalide.'); return; }
    if (isRecord(parsed) && parsed.protocolVersion !== PROTOCOL_VERSION) { error(connection.socket, 'UNSUPPORTED_VERSION', 'Version de protocole non prise en charge.'); return; }
    const message = parseMessage(parsed); if (!message) { error(connection.socket, 'INVALID_MESSAGE', 'Message invalide.'); return; }
    if (message.type === 'leave') { remove(connection, true); return; }
    if (message.type === 'create-room') {
      if (connection.room) { error(connection.socket, 'INVALID_MESSAGE', 'Connexion déjà rattachée.'); return; }
      const room: Room = { code: roomCode(), mode: message.mode, penalty: message.penalty, connections: new Map(), ready: new Set(), started: false }; connection.room = room; connection.player = 'p1'; room.connections.set(connection.socket, connection); rooms.set(room.code, room); broadcast(room); return;
    }
    if (message.type === 'join-room') {
      const room = rooms.get(message.roomCode); if (!room) { error(connection.socket, 'ROOM_NOT_FOUND', 'Salon inconnu.'); return; }
      if (connection.room || room.started || room.mode !== 'duo' || room.connections.size >= 2) { error(connection.socket, 'ROOM_FULL', 'Salon complet.'); return; }
      connection.room = room; connection.player = 'p2'; room.connections.set(connection.socket, connection); broadcast(room); return;
    }
    const room = connection.room; if (!room || !connection.player) { error(connection.socket, 'NOT_JOINED', 'Aucun salon.'); return; }
    if (message.type === 'ready') { if (room.started) { error(connection.socket, 'INVALID_MESSAGE', 'Partie déjà démarrée.'); return; } room.ready.add(connection.player); if ((room.mode === 'solo' && room.ready.has('p1')) || (room.mode === 'duo' && room.ready.has('p1') && room.ready.has('p2'))) { room.engine = createGame({ characters, mode: room.mode, penalty: room.penalty }); room.started = true; } broadcast(room); return; }
    if (message.type === 'action') { if (!room.engine) { error(connection.socket, 'NOT_STARTED', 'Partie non démarrée.'); return; } const result = room.engine.dispatch({ ...message.command, playerId: connection.player }); if (!result.ok) error(connection.socket, result.error.code, result.error.message); else broadcast(room); }
  };
  wss.on('connection', (socket) => { const connection: Connection = { socket }; connections.set(socket, connection); socket.on('message', (raw) => handle(connection, raw)); socket.on('close', () => remove(connection, false)); });
  http.on('upgrade', (request, socket, head) => { if (request.url !== '/ws') { socket.destroy(); return; } wss.handleUpgrade(request, socket, head, (ws) => wss.emit('connection', ws, request)); });
  await new Promise<void>((resolve) => http.listen(port, resolve));
  const address = http.address(); const actualPort = typeof address === 'object' && address ? address.port : port;
  return { port: actualPort, close: async () => { for (const socket of connections.keys()) socket.close(); wss.close(); await new Promise<void>((resolve, reject) => http.close((err) => err ? reject(err) : resolve())); } };
}


