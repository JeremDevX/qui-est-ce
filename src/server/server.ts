import { createServer as createHttpServer, type Server } from 'node:http';
import { WebSocket, WebSocketServer, type RawData } from 'ws';
import { createGame } from '../engine/index.ts';
import type { GameEngine, PlayerId } from '../contracts/game.ts';
import { PROTOCOL_VERSION, type ProtocolErrorCode, type ServerMessage, type SessionView } from '../contracts/protocol.ts';
import { loadCharacters } from './catalog.ts';
import { parseClientMessage } from './messages.ts';

interface Connection {
  socket: WebSocket;
  room: Room | null;
  playerId: PlayerId | null;
}

interface Room {
  code: string;
  mode: 'solo' | 'duo';
  penalty: 'immediate_loss' | 'lose_turn';
  connections: Map<PlayerId, Connection>;
  ready: Set<PlayerId>;
  engine: GameEngine | null;
}

const roomAlphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

function send(socket: WebSocket, message: ServerMessage): void {
  if (socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify(message));
}

function sendError(socket: WebSocket, code: ProtocolErrorCode, message: string): void {
  send(socket, { protocolVersion: PROTOCOL_VERSION, type: 'error', code, message });
}

function roomCode(rooms: Map<string, Room>): string {
  let code: string;
  do {
    code = Array.from({ length: 6 }, () =>
      roomAlphabet[Math.floor(Math.random() * roomAlphabet.length)]!,
    ).join('');
  } while (rooms.has(code));
  return code;
}

export async function startServer(port = 3001): Promise<{ port: number; close: () => Promise<void> }> {
  const characters = await loadCharacters();
  const http: Server = createHttpServer((_request, response) => {
    response.statusCode = 404;
    response.end();
  });
  const webSocketServer = new WebSocketServer({ noServer: true });
  const rooms = new Map<string, Room>();
  const connections = new Map<WebSocket, Connection>();

  const sessionFor = (connection: Connection): SessionView | null => {
    const room = connection.room;
    const playerId = connection.playerId;
    if (!room || !playerId) return null;

    const base = {
      roomCode: room.code,
      playerId,
      readyPlayers: [...room.ready],
    };
    if (!room.engine) return { ...base, status: 'lobby', game: null };

    const game = room.engine.getView(playerId);
    return { ...base, status: game.status, game };
  };

  const broadcast = (room: Room): void => {
    for (const connection of room.connections.values()) {
      const session = sessionFor(connection);
      if (session) {
        send(connection.socket, {
          protocolVersion: PROTOCOL_VERSION,
          type: 'snapshot',
          session,
        });
      }
    }
  };

  const detach = (connection: Connection, notify: boolean): void => {
    const room = connection.room;
    const playerId = connection.playerId;
    if (!room || !playerId) {
      if (notify) send(connection.socket, { protocolVersion: PROTOCOL_VERSION, type: 'left' });
      return;
    }

    if (room.engine) room.engine.forfeit(playerId);
    room.connections.delete(playerId);
    if (!room.engine) room.ready.delete(playerId);
    connection.room = null;
    connection.playerId = null;
    if (notify) send(connection.socket, { protocolVersion: PROTOCOL_VERSION, type: 'left' });

    if (room.engine || playerId === 'p2') broadcast(room);
    if (!room.engine && playerId === 'p1') {
      rooms.delete(room.code);
      for (const remaining of room.connections.values()) {
        remaining.room = null;
        remaining.playerId = null;
        remaining.socket.close();
      }
      room.connections.clear();
    } else if (room.connections.size === 0) {
      rooms.delete(room.code);
    }
  };

  const handleMessage = (connection: Connection, raw: RawData): void => {
    let value: unknown;
    try {
      value = JSON.parse(raw.toString());
    } catch {
      sendError(connection.socket, 'INVALID_MESSAGE', 'JSON invalide.');
      return;
    }

    const parsed = parseClientMessage(value);
    if (!parsed.ok) {
      const message = parsed.code === 'UNSUPPORTED_VERSION'
        ? 'Version de protocole non prise en charge.'
        : 'Message invalide.';
      sendError(connection.socket, parsed.code, message);
      return;
    }

    const message = parsed.message;
    if (message.type === 'leave') {
      detach(connection, true);
      return;
    }

    if (message.type === 'create-room') {
      if (connection.room) {
        sendError(connection.socket, 'INVALID_MESSAGE', 'Connexion déjà rattachée.');
        return;
      }
      const room: Room = {
        code: roomCode(rooms),
        mode: message.mode,
        penalty: message.penalty,
        connections: new Map(),
        ready: new Set(),
        engine: null,
      };
      connection.room = room;
      connection.playerId = 'p1';
      room.connections.set('p1', connection);
      rooms.set(room.code, room);
      broadcast(room);
      return;
    }

    if (message.type === 'join-room') {
      if (connection.room) {
        sendError(connection.socket, 'INVALID_MESSAGE', 'Connexion déjà rattachée.');
        return;
      }
      const room = rooms.get(message.roomCode);
      if (!room) {
        sendError(connection.socket, 'ROOM_NOT_FOUND', 'Salon inconnu.');
        return;
      }
      if (room.engine || room.mode !== 'duo' || room.connections.size >= 2) {
        sendError(connection.socket, 'ROOM_FULL', 'Salon complet.');
        return;
      }
      connection.room = room;
      connection.playerId = 'p2';
      room.connections.set('p2', connection);
      broadcast(room);
      return;
    }

    const room = connection.room;
    const playerId = connection.playerId;
    if (!room || !playerId) {
      sendError(connection.socket, 'NOT_JOINED', 'Aucun salon.');
      return;
    }

    if (message.type === 'ready') {
      if (room.engine) {
        sendError(connection.socket, 'INVALID_MESSAGE', 'Partie déjà démarrée.');
        return;
      }
      if (room.ready.has(playerId)) return;
      room.ready.add(playerId);
      const allReady = room.mode === 'solo'
        ? room.ready.has('p1')
        : room.ready.has('p1') && room.ready.has('p2');
      if (allReady) {
        room.engine = createGame({ characters, mode: room.mode, penalty: room.penalty });
      }
      broadcast(room);
      return;
    }

    if (message.type === 'action') {
      if (!room.engine) {
        sendError(connection.socket, 'NOT_STARTED', 'Partie non démarrée.');
        return;
      }
      const result = room.engine.dispatch({ ...message.command, playerId });
      if (!result.ok) {
        sendError(connection.socket, result.error.code, result.error.message);
        return;
      }
      broadcast(room);
    }
  };

  webSocketServer.on('connection', (socket) => {
    const connection: Connection = { socket, room: null, playerId: null };
    connections.set(socket, connection);
    socket.on('message', (raw, isBinary) => {
      if (isBinary) {
        sendError(socket, 'INVALID_MESSAGE', 'Seuls les messages texte JSON sont acceptés.');
        return;
      }
      handleMessage(connection, raw);
    });
    socket.on('close', () => {
      connections.delete(socket);
      detach(connection, false);
    });
    socket.on('error', () => {
      connections.delete(socket);
      detach(connection, false);
      if (socket.readyState !== WebSocket.CLOSED) socket.terminate();
    });
  });

  http.on('upgrade', (request, socket, head) => {
    if (request.url !== '/ws') {
      socket.destroy();
      return;
    }
    webSocketServer.handleUpgrade(request, socket, head, (webSocket) => {
      webSocketServer.emit('connection', webSocket, request);
    });
  });

  await new Promise<void>((resolve, reject) => {
    const onListening = (): void => {
      http.off('error', onError);
      resolve();
    };
    const onError = (error: Error): void => {
      http.off('listening', onListening);
      reject(error);
    };
    http.once('error', onError);
    http.once('listening', onListening);
    http.listen(port);
  });

  const address = http.address();
  if (!address || typeof address === 'string') throw new Error('Unable to determine listening port');

  return {
    port: address.port,
    close: async () => {
      for (const socket of connections.keys()) socket.terminate();
      await new Promise<void>((resolve, reject) => {
        webSocketServer.close((error) => error ? reject(error) : resolve());
      });
      await new Promise<void>((resolve, reject) => {
        http.close((error) => error ? reject(error) : resolve());
      });
    },
  };
}
