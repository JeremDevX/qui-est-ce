import type { ClientState, SessionView } from '../contracts/protocol.ts';
import { escapeHtml as h } from './actions.ts';
import { portrait } from './board.ts';

const deck = `
  <div class="entry-deck" aria-hidden="true">
    <div class="entry-tile"><img src="/characters/c01.png" alt="" width="250" height="210" /></div>
    <div class="entry-tile"><img src="/characters/c20.png" alt="" width="250" height="210" /></div>
    <div class="entry-tile"><img src="/characters/c08.png" alt="" width="250" height="210" /></div>
  </div>`;

export function renderHome(state: ClientState, pending: boolean): string {
  const disabled = state.connection !== 'connected' || pending ? 'disabled' : '';
  const controls = state.connection === 'closed' ? `
    <section class="entry-controls" aria-labelledby="reconnect-title">
      <h2 id="reconnect-title">Connexion interrompue</h2>
      <p>Reconnectez-vous pour créer ou rejoindre une partie.</p>
      <button id="reconnect" class="primary-button" type="button">Se reconnecter</button>
    </section>` : `
    <section class="entry-controls" aria-label="Jouer">
      <form id="setup" aria-labelledby="setup-title">
        <h2 id="setup-title">Nouvelle partie</h2>
        <fieldset class="entry-mode">
          <legend>Mode de jeu</legend>
          <div class="entry-mode-options">
            <label><input id="mode" type="radio" name="mode" value="solo" checked /><span>Solo</span></label>
            <label><input id="mode-duo" type="radio" name="mode" value="duo" /><span>Duo</span></label>
          </div>
        </fieldset>
        <div class="entry-field">
          <label for="penalty">Si vous vous trompez</label>
          <select id="penalty" name="penalty">
            <option value="immediate_loss">Défaite immédiate</option>
            <option value="lose_turn">Perte d’un tour</option>
          </select>
        </div>
        <button id="create-room" class="primary-button" ${disabled}>Créer une partie</button>
      </form>
      <form id="join">
        <label for="room-code">Rejoindre un salon</label>
        <div class="entry-join">
          <input id="room-code" name="roomCode" required maxlength="12" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="Code du salon" />
          <button id="join-room" class="secondary-button" ${disabled}>Rejoindre</button>
        </div>
      </form>
    </section>`;

  return `<main class="entry-screen entry-home">
    <section class="entry-intro" aria-labelledby="screen-title">
      <div>
        <p class="entry-kicker">Jeu de déduction</p>
        <h1 id="screen-title" tabindex="-1">Qui <span>est-ce<span class="entry-question"> ?</span></span></h1>
        <p class="entry-lead">Posez les bonnes questions pour démasquer le visage mystère.</p>
      </div>
      ${deck}
      <ul class="entry-stats">
        <li><strong>24</strong> visages</li>
        <li><strong>6</strong> actions</li>
      </ul>
    </section>
    ${controls}
  </main>`;
}

type Lobby = Extract<SessionView, { status: 'lobby' }>;

export function renderLobby(state: ClientState, pending: boolean, session: Lobby, selectedSecret = ''): string {
  const ready = session.readyPlayers.includes(session.playerId);
  const disabled = pending || state.connection !== 'connected';
  if (session.mode === 'duo') {
    const selected = session.characters.find(person => person.id === selectedSecret);
    const opponentReady = session.readyPlayers.some(id => id !== session.playerId);
    return `<main class="entry-screen duo-lobby">
      <header class="duo-intro">
        <div><p class="entry-kicker">Duo <span aria-hidden="true">/</span> Préparation</p>
        <h1 id="screen-title" tabindex="-1">Choisissez votre secret</h1></div>
        <p>Votre adversaire devra deviner ce personnage.</p>
      </header>
      <fieldset class="secret-roster" ${disabled || ready ? 'disabled' : ''}>
        <legend class="sr-only">Personnage secret</legend>
        <div class="secret-grid">
          ${session.characters.map((person, index) => `<label class="secret-option">
            <input class="sr-only" type="radio" name="secret" id="secret-${index}" value="${h(person.id)}" ${selected?.id === person.id ? 'checked' : ''}>
            <span class="secret-card"><span class="secret-face">${portrait(person)}</span><span class="secret-name">${h(person.name)}</span></span>
          </label>`).join('')}
        </div>
      </fieldset>
      <section class="entry-controls duo-controls" aria-label="Préparer le duel">
        <div class="entry-room"><h2>Code du salon</h2><code>${h(session.roomCode)}</code><p>Partagez ce code avec votre adversaire.</p></div>
        <div class="secret-preview" data-selected="${Boolean(selected)}">
          <span class="secret-preview-face">${selected ? portrait(selected) : '<span aria-hidden="true">?</span>'}</span>
          <div><p class="kicker">${ready ? 'Secret verrouillé' : 'Votre secret'}</p><strong>${selected ? h(selected.name) : ready ? 'Personnage confirmé' : 'À choisir'}</strong></div>
        </div>
        <ul class="entry-players">
          <li><span>Vous</span><strong>${ready ? 'Prêt' : 'En préparation'}</strong></li>
          <li><span>Adversaire</span><strong>${opponentReady ? 'Prêt' : 'En attente'}</strong></li>
        </ul>
        <button id="ready" class="primary-button" type="button" ${ready || disabled || !selected ? 'disabled' : ''}>${ready ? 'Secret verrouillé' : 'Confirmer mon secret'} <span aria-hidden="true">↗</span></button>
        <button id="leave" class="secondary-button" type="button" ${disabled ? 'disabled' : ''}>Quitter le salon</button>
      </section>
    </main>`;
  }
  return `<main class="entry-screen entry-lobby">
    <section class="entry-intro" aria-labelledby="screen-title">
      <div>
        <p class="entry-kicker">Avant la partie</p>
        <h1 id="screen-title" tabindex="-1">Salon <span>d’attente</span></h1>
        <p class="entry-lead">Confirmez pour ouvrir votre enquête.</p>
      </div>
      ${deck}
    </section>
    <section class="entry-controls" aria-labelledby="room-title">
      <div class="entry-room">
        <h2 id="room-title">Code du salon</h2>
        <code>${h(session.roomCode)}</code>
      </div>
      <ul class="entry-players">
        <li><span>Vous</span><strong>${ready ? 'Prêt' : 'Pas encore prêt'}</strong></li>
      </ul>
      <div class="entry-lobby-actions">
        <button id="ready" class="primary-button" type="button" ${ready || disabled ? 'disabled' : ''}>${ready ? 'Vous êtes prêt' : 'Je suis prêt'}</button>
        <button id="leave" class="secondary-button" type="button" ${disabled ? 'disabled' : ''}>Quitter le salon</button>
      </div>
    </section>
  </main>`;
}
