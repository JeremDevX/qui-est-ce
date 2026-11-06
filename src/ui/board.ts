import type { AttributeId, Character, GameView } from '../contracts/game.ts';
import type { ClientState } from '../contracts/protocol.ts';
import { actionReason, attributeLabels, attributeOrder, attributeReason, displayValue, escapeHtml as h, questionChoices } from './actions.ts';

export interface Selection { attribute: AttributeId; value: string }

export function portrait(person: Character): string {
  return person.portrait
    ? `<img src="${h(person.portrait)}" alt="" draggable="false">`
    : '<span class="portrait-placeholder" role="img" aria-label="Portrait provisoire">?</span>';
}

function card(person: Character, index: number, candidate: boolean, folding: boolean, revealed: boolean): string {
  const state = revealed ? 'revealed' : candidate ? 'up' : 'down';
  const label = `${person.name}, ${revealed ? 'cible révélée' : candidate ? 'candidat' : 'écarté'}`;
  return `<button id="card-${index}" class="suspect-card${folding && !revealed ? ' is-folding' : ''}" type="button"
    data-character="${h(person.id)}" data-state="${state}" aria-label="${h(label)}" aria-haspopup="dialog">
    <span class="card-tray" aria-hidden="true"><span class="fold-mark">${revealed ? '★' : '×'}</span><span class="card-face">${portrait(person)}</span></span>
    <span class="card-name">${h(person.name)}</span>
  </button>`;
}

function questionForm(game: GameView, selection: Selection, disabled: boolean): string {
  const attributes = attributeOrder.map(key => {
    const why = attributeReason(game, key);
    return `<option value="${key}"${selection.attribute === key ? ' selected' : ''}${why ? ' disabled' : ''}>
      ${h(attributeLabels[key] + (why ? ' · ' + why : ''))}</option>`;
  }).join('');
  const values = questionChoices[selection.attribute].map(question => {
    const value = String(question.value);
    return `<option value="${h(value)}"${value === selection.value ? ' selected' : ''}>${h(displayValue(question.value))}</option>`;
  }).join('');
  return `<form id="question-form">
    <fieldset ${disabled ? 'disabled' : ''}>
      <legend class="sr-only">Poser une question</legend>
      <div class="question-fields">
        <label for="attribute">Attribut<select id="attribute">${attributes}</select></label>
        <label for="value">Valeur<select id="value">${values}</select></label>
      </div>
      <button id="ask" class="primary-button" ${attributeReason(game, selection.attribute) ? 'disabled' : ''}>Poser la question <span aria-hidden="true">↗</span></button>
    </fieldset>
  </form>`;
}

export function renderBoard(
  state: ClientState, pending: boolean, selection: Selection, game: GameView, roomCode: string, folding: ReadonlySet<string>,
): string {
  const { remainingTurns, candidateIds, history } = game.selfPlayer;
  const candidates = new Set(candidateIds);
  const targets = new Set(Object.values(game.revealedTargets ?? {}));
  const reason = actionReason(state, pending);
  const unavailable = state.connection !== 'connected' || pending ? 'disabled' : '';
  const lost = game.players.some(player => player.id === game.viewerId && player.status === 'lost');
  const turn = game.status === 'finished' ? (game.winnerId === game.viewerId ? 'Victoire !' : lost ? 'Défaite' : 'Partie terminée')
    : lost ? 'Vous avez perdu' : game.activePlayerId === game.viewerId ? 'À vous de jouer' : 'Au tour de votre adversaire';
  const turnStyle = game.status === 'finished' ? 'finished' : reason ? 'waiting' : 'active';
  const pips = Array.from({ length: 6 }, (_, i) => `<i class="${i < remainingTurns ? 'available' : ''}"></i>`).join('');
  const last = history.at(-1);
  const response = last?.type === 'question' ? (last.answer ? 'Oui' : 'Non') : last ? (last.correct ? 'Trouvé !' : 'Raté') : '';
  const lastQuestion = last?.type === 'question' ? `${attributeLabels[last.attribute]} · ${displayValue(last.value)}`
    : last ? game.characters.find(person => person.id === last.characterId)?.name ?? last.characterId : '';
  return `<main class="play-screen">
    <header class="game-hud">
      <div class="game-turn" data-turn="${turnStyle}">
        <p class="kicker">${game.mode === 'solo' ? 'Solo' : 'Duo'} <span aria-hidden="true">/</span> Salon ${h(roomCode)}</p>
        <h1 id="screen-title" tabindex="-1">${turn}</h1>
      </div>
      <dl class="metrics">
        <div><dt>Actions</dt><dd>${remainingTurns}<small> / 6</small><span class="action-pips" aria-hidden="true">${pips}</span></dd></div>
        <div><dt>Candidats</dt><dd>${candidates.size}<small> / ${game.characters.length}</small></dd></div>
        <div><dt>Attribut interdit</dt><dd class="forbidden-value">${h(attributeLabels[game.forbiddenAttribute])}</dd></div>
      </dl>
      <button id="leave" class="quiet-button leave-button" type="button" ${unavailable}><span aria-hidden="true">↪</span> Quitter</button>
    </header>
    <a id="skip-actions" class="skip-actions" href="#${reason ? 'show-history' : 'attribute'}">Aller aux commandes</a>
    <div class="table-layout">
      <section class="board-panel" aria-labelledby="board-title">
        <header class="board-heading"><h2 id="board-title">Les suspects</h2><p>Ouvrir une carte pour l’examiner</p></header>
        <div class="character-grid">
          ${game.characters.map((person, index) => card(person, index, candidates.has(person.id), folding.has(person.id), targets.has(person.id))).join('')}
        </div>
      </section>
      <aside class="control-deck" aria-label="Commandes de la partie">
        <div class="deck-heading"><p class="kicker">À vous de déduire</p><h2>Votre action</h2></div>
        ${reason ? `<p class="action-state">${h(reason)}</p>` : ''}
        ${game.status === 'playing' ? questionForm(game, selection, reason !== null) : ''}
        <div class="deck-tools">
          ${game.status === 'finished'
            ? '<button id="show-result" class="primary-button" aria-haspopup="dialog">Voir le résultat <span aria-hidden="true">↗</span></button>'
            : `<button id="propose" class="secondary-button" aria-haspopup="dialog" ${reason ? 'disabled' : ''}>Proposer un nom</button>`}
          <button id="show-history" class="secondary-button history-button" aria-haspopup="dialog">Journal <span>${history.length}</span></button>
        </div>
        <div class="last-move">
          <p class="kicker">Dernier indice</p>
          ${last ? `<p><strong data-answer="${last.type === 'question' ? last.answer : last.correct}">${response}</strong><span>${h(lastQuestion)}</span></p>`
            : '<p class="empty-move">Votre premier indice apparaîtra ici.</p>'}
        </div>
      </aside>
    </div>
  </main>`;
}
