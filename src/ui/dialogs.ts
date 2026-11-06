import type { Character, GameView } from '../contracts/game.ts';
import type { ClientState } from '../contracts/protocol.ts';
import { actionReason, attributeLabels, attributeOrder, displayValue, escapeHtml as h, historyLine } from './actions.ts';
import { portrait } from './board.ts';
import { screenAnnouncement } from './screens.ts';

export type GameDialog =
  | { kind: 'portrait' | 'confirm'; characterId: string }
  | { kind: 'history' | 'result' };

function details(person: Character): string {
  return `<div class="dossier">
    <div class="dossier-image">${portrait(person)}</div>
    <dl class="attribute-list" aria-label="Attributs de ${h(person.name)}">
      ${attributeOrder.map(key => `<div><dt>${h(attributeLabels[key])}</dt><dd>${h(displayValue(person.attributes[key]))}</dd></div>`).join('')}
    </dl>
  </div>`;
}

function dialog(title: string, kicker: string, content: string): string {
  return `<div class="dialog-heading"><div><p class="kicker">${kicker}</p><h2 id="dialog-title" tabindex="-1">${title}</h2></div>
    <button class="dialog-close" type="button" data-close aria-label="Fermer">×</button></div>${content}`;
}

export function renderGameDialog(state: ClientState, pending: boolean, choice: GameDialog): string {
  const game = state.session?.game;
  if (!game) return '';
  const reason = actionReason(state, pending);
  const unavailable = reason ? 'disabled' : '';
  const history = game.selfPlayer.history;
  if (choice.kind === 'history') {
    const entries = history.length ? `<ol class="case-log">${history.map(entry => `<li>${h(historyLine(entry, game))}</li>`).join('')}</ol>`
      : '<p>Aucune action confirmée.</p>';
    return dialog('Journal des indices', 'Votre enquête', entries);
  }
  if (choice.kind === 'result') {
    if (game.status !== 'finished') return '';
    const targets = Object.entries(game.revealedTargets ?? {}).map(([player, id]) => {
      const person = game.characters.find(character => character.id === id);
      return person ? `<figure class="revealed-target">${portrait(person)}<figcaption><strong>${h(person.name)}</strong><span>${player === game.viewerId ? 'Votre cible' : 'Votre secret'}<span class="sr-only"> · Cible de ${h(player)}</span></span></figcaption></figure>` : '';
    }).join('');
    const message = screenAnnouncement({ ...state, error: null, connection: 'connected' }, false);
    return dialog(h(message), 'Enquête terminée', `<div class="target-lineup">${targets}</div>
      <div class="dialog-actions"><button data-close class="secondary-button">Revoir le plateau</button>
      <button id="play-again" class="primary-button" ${pending || state.connection !== 'connected' ? 'disabled' : ''}>Nouvelle partie</button></div>`);
  }
  if (!('characterId' in choice)) return '';
  const person = game.characters.find(candidate => candidate.id === choice.characterId);
  if (!person) return '';
  const name = h(person.name);
  if (choice.kind === 'confirm') {
    const penalty = game.penalty === 'immediate_loss' ? 'Une erreur entraîne la défaite.' : 'Une erreur consomme une action.';
    return dialog(`Proposer ${name} ?`, 'Dernière vérification', `<div class="guess-confirmation">
      <div class="guess-portrait">${portrait(person)}</div>
      <p>${penalty}</p>
      </div>
      <div class="dialog-actions"><button id="cancel-guess" class="secondary-button" data-close>Annuler</button>
      <button id="confirm-guess" class="primary-button" ${unavailable}>Confirmer la proposition</button></div>`);
  }
  const status = game.selfPlayer.candidateIds.includes(person.id) ? 'Candidat' : 'Écarté';
  return dialog(name, `Fiche portrait · ${status}`, `${details(person)}
    ${reason ? '' : `<div class="dialog-actions"><button id="inspect-guess" class="primary-button">Proposer ${name}</button></div>`}`);
}
