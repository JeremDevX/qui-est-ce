import type { ClientMessage, ClientState, GameClient, ProtocolErrorCode, ServerMessage, SessionView } from '../../contracts/protocol.ts';
import { parseMockScenarios } from './mock-fixtures.ts';
import { findQuestion } from '../actions.ts';

function object(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
function keys(value: Record<string, unknown>, expected: string[]): boolean {
  return Object.keys(value).length === expected.length && expected.every(key => Object.hasOwn(value, key));
}
function player(value: unknown): value is 'p1' | 'p2' { return value === 'p1' || value === 'p2'; }
const errorCodes = ['INVALID_ACTION','GAME_FINISHED','WRONG_PLAYER','INVALID_ATTRIBUTE','INVALID_VALUE','FORBIDDEN_ATTRIBUTE','ATTRIBUTE_ALREADY_USED','UNKNOWN_CHARACTER','INVALID_MESSAGE','UNSUPPORTED_VERSION','ROOM_NOT_FOUND','ROOM_FULL','NOT_JOINED','NOT_STARTED'] satisfies ProtocolErrorCode[];
function errorCode(value: unknown): value is ProtocolErrorCode { return errorCodes.some(code => code === value); }
function sessionView(value: unknown): SessionView {
  if (!object(value) || !keys(value, ['roomCode','playerId','readyPlayers','status','game'])
    || typeof value.roomCode !== 'string' || !/^[A-Z0-9]{6}$/i.test(value.roomCode)
    || !player(value.playerId) || !Array.isArray(value.readyPlayers) || !value.readyPlayers.every(player)
    || new Set(value.readyPlayers).size !== value.readyPlayers.length) throw new Error('Salon invalide.');
  const base = { roomCode: value.roomCode, playerId: value.playerId, readyPlayers: [...value.readyPlayers] };
  if (value.status === 'lobby' && value.game === null) return { ...base, status: 'lobby', game: null };
  if (value.status !== 'playing' && value.status !== 'finished') throw new Error('État du salon invalide.');
  // Réutilise la validation complète des GameView, sans charger les fixtures.
  const game = parseMockScenarios([{ name: 'network', view: value.game }])[0]?.view;
  if (!game || game.status !== value.status || game.viewerId !== value.playerId) throw new Error('Vue du joueur incohérente.');
  const ids = new Set(game.characters.map(person => person.id));
  if (ids.size !== 24 || !game.selfPlayer.candidateIds.every(id => ids.has(id))
    || !game.players.some(entry => entry.id === game.viewerId)
    || (game.status === 'playing' && (game.activePlayerId === null || game.revealedTargets !== null))) throw new Error('Vue de jeu incohérente.');
  return { ...base, status: value.status, game };
}
export function parseServerMessage(input: unknown): ServerMessage {
  if (!object(input) || input.protocolVersion !== 2) throw new Error('Message ou version invalide.');
  if (input.type === 'left' && keys(input, ['protocolVersion','type'])) return { protocolVersion: 2, type: 'left' };
  if (input.type === 'error' && keys(input, ['protocolVersion','type','code','message']) && errorCode(input.code) && typeof input.message === 'string') {
    return { protocolVersion: 2, type: 'error', code: input.code, message: input.message };
  }
  if (input.type === 'snapshot' && keys(input, ['protocolVersion','type','session'])) return { protocolVersion: 2, type: 'snapshot', session: sessionView(input.session) };
  throw new Error('Message serveur invalide.');
}
/** Reconstruit uniquement les champs v2 autorisés ; aucune identité/cible ajoutée. */
function outgoing(input: unknown): ClientMessage {
  if (!object(input) || input.protocolVersion !== 2) throw new Error('Commande v2 attendue.');
  if (input.type === 'create-room' && keys(input, ['protocolVersion','type','mode','penalty']) && (input.mode === 'solo' || input.mode === 'duo') && (input.penalty === 'immediate_loss' || input.penalty === 'lose_turn')) return { protocolVersion: 2, type: input.type, mode: input.mode, penalty: input.penalty };
  if (input.type === 'join-room' && keys(input, ['protocolVersion','type','roomCode']) && typeof input.roomCode === 'string' && /^[A-Z0-9]{6}$/i.test(input.roomCode)) return { protocolVersion: 2, type: input.type, roomCode: input.roomCode };
  if ((input.type === 'ready' || input.type === 'leave') && keys(input, ['protocolVersion','type'])) return { protocolVersion: 2, type: input.type };
  if (input.type === 'action' && keys(input, ['protocolVersion','type','command']) && object(input.command)) {
    const command = input.command;
    if (command.type === 'guess' && keys(command, ['type','characterId']) && typeof command.characterId === 'string') return { protocolVersion: 2, type: 'action', command: { type: 'guess', characterId: command.characterId } };
    if (command.type === 'question' && keys(command, ['type','attribute','value']) && typeof command.attribute === 'string' && (typeof command.value === 'boolean' || typeof command.value === 'string')) {
      const question = findQuestion(command.attribute, String(command.value));
      if (question && question.value === command.value) return { protocolVersion: 2, type: 'action', command: { ...question } };
    }
  }
  throw new Error('Commande invalide ou champs interdits.');
}

export function createWebSocketClient(url: string): GameClient {
  const endpoint = new URL(url);
  if (!['ws:', 'wss:'].includes(endpoint.protocol) || endpoint.username || endpoint.password || endpoint.hash) throw new Error('URL WebSocket invalide.');
  const socket = new WebSocket(endpoint.href);
  let state: ClientState = { connection: 'connecting', session: null, error: null };
  let pending = false;
  let closed = false;
  const listeners = new Set<(state: ClientState) => void>();
  const publish = (): void => { for (const listener of [...listeners]) listener(structuredClone(state)); };
  const finish = (message?: string): void => {
    if (closed) return;
    closed = true; pending = false;
    state = { connection: 'closed', session: null, error: message ? { code: 'INVALID_MESSAGE', message } : null };
    socket.removeEventListener('open', onOpen);
    socket.removeEventListener('message', onMessage);
    socket.removeEventListener('error', onError);
    socket.removeEventListener('close', onClose);
    publish(); listeners.clear();
  };
  function onOpen(): void {
    if (closed) return;
    state = { ...state, connection: 'connected' }; publish();
  }
  function onMessage(event: MessageEvent<unknown>): void {
    if (closed) return;
    let message: ServerMessage;
    try {
      if (typeof event.data !== 'string') throw new Error('Trame texte attendue.');
      const input: unknown = JSON.parse(event.data);
      message = parseServerMessage(input);
    } catch {
      finish('Le serveur a envoyé un message invalide. Reconnectez-vous pour recommencer.');
      socket.close(1002, 'Invalid server message'); return;
    }
    pending = false;
    if (message.type === 'snapshot') state = { connection: 'connected', session: message.session, error: null };
    else if (message.type === 'error') state = { ...state, error: { code: message.code, message: message.message } };
    else state = { connection: 'connected', session: null, error: null };
    publish();
  }
  function onError(): void { finish('Connexion au serveur impossible ou interrompue.'); socket.close(); }
  function onClose(): void { finish(); }
  socket.addEventListener('open', onOpen);
  socket.addEventListener('message', onMessage);
  socket.addEventListener('error', onError);
  socket.addEventListener('close', onClose);
  return {
    getState: () => structuredClone(state),
    subscribe(listener) { if (closed) return () => {}; listeners.add(listener); return () => { listeners.delete(listener); }; },
    send(message) {
      if (closed || socket.readyState !== WebSocket.OPEN) throw new Error('Le serveur n’est pas connecté.');
      if (pending) throw new Error('Une demande attend déjà sa réponse.');
      const payload = outgoing(message);
      socket.send(JSON.stringify(payload));
      pending = true;
      // Aucun snapshot, erreur ou succès optimiste publié à l’envoi.
    },
    close() { if (closed) return; finish(); socket.close(); },
  };
}
