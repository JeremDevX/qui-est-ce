import type { GameClient } from '../contracts/protocol.ts';
import { createDemoClient, demoSceneLabels, demoSceneNames } from './client/demo.ts';
import { createWebSocketClient } from './client/websocket.ts';
import { escapeHtml } from './actions.ts';
import { mountUi } from './app.ts';

const root = document.querySelector<HTMLDivElement>('#app');
if (!root) throw new Error('Élément #app introuvable.');
root.innerHTML = `
  <header class="top-bar">
    <div class="brand" aria-label="Qui est-ce ?"><span class="brand-mark" aria-hidden="true">?</span><span>QUI EST-CE<span class="brand-punctuation">?</span></span></div>
    <div class="top-tools">
      <span id="connection-status" class="connection-status"></span>
      <button id="open-rules" class="quiet-button" type="button" aria-haspopup="dialog">Règles</button>
      <button id="open-settings" class="quiet-button" type="button" aria-haspopup="dialog"><span aria-hidden="true">⚙</span> <span class="settings-label">Réglages</span><span class="sr-only compact-settings-label">Réglages</span></button>
    </div>
  </header>
  <div id="client-area"><p id="transport-error" class="notice error" role="alert" hidden></p><div id="screen"></div></div>
  <dialog id="rules" class="shell-dialog" aria-labelledby="rules-title">
    <div class="dialog-heading"><div><p class="kicker">Le jeu des visages</p><h2 id="rules-title">Comment jouer</h2></div><form method="dialog"><button class="dialog-close" aria-label="Fermer">×</button></form></div>
    <ol class="case-log">
      <li><strong>Observez les 24 suspects.</strong> Ouvrez un portrait pour examiner ses 11 attributs.</li>
      <li><strong>Posez des questions.</strong> Une réponse oui ou non rabat les cartes incompatibles. Chaque attribut ne peut servir qu’une fois et l’attribut interdit reste indisponible.</li>
      <li><strong>Proposez un nom.</strong> Vous avez six actions en tout, proposition comprise. En duo, chacun cherche sa cible à tour de rôle.</li>
    </ol>
  </dialog>
  <dialog id="settings" class="shell-dialog" aria-labelledby="settings-title">
    <div class="dialog-heading"><div><p class="kicker">Connexion</p><h2 id="settings-title">Réglages</h2></div><form method="dialog"><button class="dialog-close" aria-label="Fermer">×</button></form></div>
    <form id="transport" class="dialog-stack">
      <label for="client-mode">Mode de connexion</label>
      <select id="client-mode"><option value="real">Serveur WebSocket</option><option value="simulation">Simulation</option></select>
      <label for="server-url">Adresse du serveur</label>
      <input id="server-url" type="url" value="ws://localhost:3001/ws" required>
      <p class="connection-note">Ouvrir une nouvelle connexion ferme la session en cours.</p>
      <button class="primary-button">Ouvrir une nouvelle connexion</button>
    </form>
    <div id="demo-settings" class="dialog-stack" hidden>
      <label for="scenario">Scénario de simulation</label>
      <select id="scenario">${demoSceneNames.map(name => `<option value="${escapeHtml(name)}">${escapeHtml(demoSceneLabels[name] ?? name)}</option>`).join('')}</select>
      <p class="connection-note">Exemples statiques. Après une action, choisissez la scène suivante pour afficher son état.</p>
    </div>
  </dialog>`;

const transport = root.querySelector<HTMLFormElement>('#transport');
const mode = root.querySelector<HTMLSelectElement>('#client-mode');
const url = root.querySelector<HTMLInputElement>('#server-url');
const error = root.querySelector<HTMLParagraphElement>('#transport-error');
const screen = root.querySelector<HTMLDivElement>('#screen');
const status = root.querySelector<HTMLSpanElement>('#connection-status');
const settings = root.querySelector<HTMLDialogElement>('#settings');
const rules = root.querySelector<HTMLDialogElement>('#rules');
const demoSettings = root.querySelector<HTMLDivElement>('#demo-settings');
const scenario = root.querySelector<HTMLSelectElement>('#scenario');
if (!transport || !mode || !url || !error || !screen || !status || !settings || !rules || !demoSettings || !scenario) throw new Error('Structure UI introuvable.');

let client: GameClient | null = null;
let dispose = (): void => {};
let unsubscribe = (): void => {};
const start = (simulation: boolean, endpoint: string): void => {
  error.hidden = true;
  try {
    const demo = simulation ? createDemoClient() : null;
    const next = demo ?? createWebSocketClient(endpoint);
    dispose();
    unsubscribe();
    client?.close();
    client = next;
    demoSettings.hidden = !demo;
    scenario.onchange = null;
    if (demo) {
      scenario.value = demo.getSceneName();
      scenario.onchange = () => { settings.close(); demo.showScene(scenario.value); };
    }
    const updateStatus = (): void => {
      const connection = next.getState().connection;
      status.dataset.connection = connection;
      status.textContent = simulation ? 'Simulation' : connection === 'connected' ? 'En ligne' : connection === 'closed' ? 'Hors ligne' : 'Connexion…';
      if (demo) scenario.value = demo.getSceneName();
    };
    unsubscribe = next.subscribe(updateStatus);
    updateStatus();
    dispose = mountUi(screen, next, simulation, () => start(simulation, endpoint));
  } catch (cause) {
    error.hidden = false;
    error.textContent = cause instanceof Error ? cause.message : 'Connexion impossible.';
    if (!client) {
      status.dataset.connection = 'closed';
      status.textContent = 'Hors ligne';
    }
  }
};

root.querySelector('#open-rules')?.addEventListener('click', () => rules.showModal());
root.querySelector('#open-settings')?.addEventListener('click', () => settings.showModal());
transport.addEventListener('submit', event => {
  event.preventDefault();
  settings.close();
  start(mode.value === 'simulation', url.value);
});
mode.addEventListener('change', () => { url.disabled = mode.value === 'simulation'; });
start(false, url.value);
window.addEventListener('pagehide', () => { dispose(); unsubscribe(); client?.close(); }, { once: true });
