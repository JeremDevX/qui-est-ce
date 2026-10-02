import type { Command } from '../../src/contracts/game.ts';
import type { ClientMessage, SessionView } from '../../src/contracts/protocol.ts';

const question: Command = { type: 'question', attribute: 'glasses', value: true };
const message: ClientMessage = { protocolVersion: 2, type: 'action', command: question };
// @ts-expect-error Une valeur de cheveux ne peut pas être utilisée pour les lunettes.
const wrongValue: Command = { type: 'question', attribute: 'glasses', value: 'blond' };
// @ts-expect-error L’identité n’est jamais envoyée dans une commande du navigateur.
const wrongIdentity: ClientMessage = { protocolVersion: 2, type: 'action', command: { type: 'guess', characterId: 'c01', playerId: 'p2' } };
// @ts-expect-error Le lobby ne contient pas de partie commencée.
const wrongLobby: SessionView = { roomCode: 'ABC123', playerId: 'p1', readyPlayers: [], status: 'lobby', game: {} };
void [message, wrongValue, wrongIdentity, wrongLobby];
