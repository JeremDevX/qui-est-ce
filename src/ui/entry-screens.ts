import type { ClientState, SessionView } from '../contracts/protocol.ts';
import { escapeHtml as h } from './actions.ts';

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

export function renderLobby(state: ClientState, pending: boolean, session: SessionView): string {
  const ready = session.readyPlayers.includes(session.playerId);
  const opponentReady = session.readyPlayers.some(id => id !== session.playerId);
  const showOpponent = ready || opponentReady || session.playerId === 'p2';
  const disabled = pending || state.connection !== 'connected' ? 'disabled' : '';
  return `<main class="entry-screen entry-lobby">
    <section class="entry-intro" aria-labelledby="screen-title">
      <div>
        <p class="entry-kicker">Avant la partie</p>
        <h1 id="screen-title" tabindex="-1">Salon <span>d’attente</span></h1>
        <p class="entry-lead">La partie démarre dès que tous les joueurs sont prêts.</p>
      </div>
      ${deck}
    </section>
    <section class="entry-controls" aria-labelledby="room-title">
      <div class="entry-room">
        <h2 id="room-title">Code du salon</h2>
        <code>${h(session.roomCode)}</code>
        <p>Pour jouer en duo, partagez ce code.</p>
      </div>
      <ul class="entry-players">
        <li><span>Vous</span><strong>${ready ? 'Prêt' : 'Pas encore prêt'}</strong></li>
        ${showOpponent ? `<li><span>Adversaire</span><strong>${opponentReady ? 'Prêt' : 'En attente'}</strong></li>` : ''}
      </ul>
      <div class="entry-lobby-actions">
        <button id="ready" class="primary-button" type="button" ${ready ? 'disabled' : disabled}>${ready ? 'Vous êtes prêt' : 'Je suis prêt'}</button>
        <button id="leave" class="secondary-button" type="button" ${disabled}>Quitter le salon</button>
      </div>
    </section>
  </main>`;
}
