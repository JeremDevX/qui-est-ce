import type { GameView } from '../contracts/game.ts';
import type { ClientState } from '../contracts/protocol.ts';
import { attributeOrder, attributeReason, escapeHtml as h, historyLine, questionChoices } from './actions.ts';
import { renderBoard, type Selection } from './board.ts';
import { renderHome, renderLobby } from './entry-screens.ts';

export function initialSelection(): Selection { return { attribute: 'hairColor', value: 'noir' }; }

export function normalizeSelection(selection: Selection, game: GameView): void {
  if (attributeReason(game, selection.attribute)) {
    const available = attributeOrder.find(key => !attributeReason(game, key));
    if (available) selection.attribute = available;
  }
  const choices = questionChoices[selection.attribute];
  if (!choices.some(question => String(question.value) === selection.value)) selection.value = String(choices[0]?.value ?? '');
}

export function screenAnnouncement(state: ClientState, pending: boolean): string {
  if (state.error) return 'Erreur : ' + state.error.message;
  if (state.connection === 'closed') return 'Connexion fermée. La session est abandonnée.';
  if (pending) return 'Action envoyée. En attente de confirmation.';
  const session = state.session;
  if (!session) return 'Préparer ou rejoindre une partie.';
  if (!session.game) return 'Salon ' + session.roomCode + '. ' + (session.readyPlayers.includes(session.playerId) ? 'Vous êtes prêt. Attente de votre adversaire.' : 'Confirmez que vous êtes prêt.');
  const game = session.game;
  if (game.status === 'finished' && game.players.find(player => player.id === game.viewerId)?.status === 'lost') return 'Partie terminée : vous avez perdu.';
  if (game.status === 'finished') return game.winnerId === game.viewerId ? 'Partie terminée : vous avez gagné.' : game.winnerId ? 'Partie terminée : victoire de votre adversaire.' : 'Partie terminée : aucun gagnant.';
  const last = game.selfPlayer.history.at(-1);
  if (game.players.find(player => player.id === game.viewerId)?.status === 'lost') return (last ? historyLine(last, game) + '. ' : '') + 'Vous avez perdu et ne jouerez plus. Votre adversaire continue.';
  return (last ? historyLine(last, game) + '. ' : '') + (game.activePlayerId === game.viewerId ? 'À vous de jouer.' : 'Au tour de votre adversaire.') + ' ' + game.selfPlayer.remainingTurns + ' actions restantes.';
}

export function renderScreen(state: ClientState, pending: boolean, selection: Selection, folding: ReadonlySet<string> = new Set()): string {
  const error = state.error ? `<p class="notice error" role="alert">${h(state.error.message)}</p>` : '';
  const session = state.session;
  if (!session) return error + renderHome(state, pending);
  if (!session.game) return error + renderLobby(state, pending, session);
  return error + renderBoard(state, pending, selection, session.game, session.roomCode, folding);
}
