import type { Command, GameErrorCode, GameView, Mode, Penalty, PlayerId } from './game.ts';

export const PROTOCOL_VERSION = 2;
export type ClientMessage =
  | { protocolVersion: 2; type: 'create-room'; mode: Mode; penalty: Penalty }
  | { protocolVersion: 2; type: 'join-room'; roomCode: string }
  | { protocolVersion: 2; type: 'ready' }
  | { protocolVersion: 2; type: 'action'; command: Command }
  | { protocolVersion: 2; type: 'leave' };
export interface SessionBase {
  roomCode: string;
  playerId: PlayerId;
  readyPlayers: PlayerId[];
}
export type SessionView = SessionBase & (
  | { status: 'lobby'; game: null }
  | { status: 'playing' | 'finished'; game: GameView }
);
export type ProtocolErrorCode = GameErrorCode
  | 'INVALID_MESSAGE' | 'UNSUPPORTED_VERSION' | 'ROOM_NOT_FOUND' | 'ROOM_FULL'
  | 'NOT_JOINED' | 'NOT_STARTED';
export type ServerMessage =
  | { protocolVersion: 2; type: 'snapshot'; session: SessionView }
  | { protocolVersion: 2; type: 'error'; code: ProtocolErrorCode; message: string }
  | { protocolVersion: 2; type: 'left' };
export interface ClientState {
  connection: 'connecting' | 'connected' | 'closed';
  session: SessionView | null;
  error: { code: ProtocolErrorCode; message: string } | null;
}
/** Même API pour le simulateur UI et le transport WebSocket réel. */
export interface GameClient {
  getState(): ClientState;
  subscribe(listener: (state: ClientState) => void): () => void;
  /** Envoi uniquement ; le résultat métier arrive par subscribe. */
  send(message: ClientMessage): void;
  close(): void;
}
