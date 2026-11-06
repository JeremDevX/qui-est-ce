import type { GameClient } from '../contracts/protocol.ts';
import { createDemoClient, demoSceneLabels, demoSceneNames } from './client/demo.ts';
import { createWebSocketClient } from './client/websocket.ts';
import { escapeHtml } from './actions.ts';
import { mountUi } from './app.ts';

const root = document.querySelector<HTMLDivElement>('#app');
if (!root) throw new Error('Élément #app introuvable.');
root.innerHTML = '<form id="transport" class="scenario-bar"><label for="client-mode">Connexion</label><select id="client-mode"><option value="simulation">Simulation</option><option value="real">Serveur WebSocket</option></select><label for="server-url">URL du serveur</label><input id="server-url" type="url" value="ws://localhost:3001/ws" required /><button>Ouvrir une nouvelle session</button></form><p id="transport-error" class="notice" role="alert" hidden></p><div id="client-area"></div>';
const transport = root.querySelector<HTMLFormElement>('#transport');
const mode = root.querySelector<HTMLSelectElement>('#client-mode');
const url = root.querySelector<HTMLInputElement>('#server-url');
const error = root.querySelector<HTMLParagraphElement>('#transport-error');
const area = root.querySelector<HTMLDivElement>('#client-area');
if (!transport || !mode || !url || !error || !area) throw new Error('Structure UI introuvable.');
let client: GameClient | null = null;
let dispose = (): void => {};
let unsubscribe = (): void => {};
const start = (): void => {
  dispose(); unsubscribe(); client?.close(); client = null;
  error.hidden = true; area.replaceChildren();
  try {
    if (mode.value === 'simulation') {
      const demo = createDemoClient(); client = demo;
      area.innerHTML = '<aside class="simulation-banner" role="note"><div><strong>Mode simulation</strong><p>Exemples statiques, sans moteur ni serveur. Après une action, sélectionnez un état : rien n’est calculé.</p></div></aside><section class="scenario-bar"><label for="scenario">Scénario de démonstration</label><select id="scenario">'+demoSceneNames.map(name=>'<option value="'+escapeHtml(name)+'">'+escapeHtml(demoSceneLabels[name] ?? name)+'</option>').join('')+'</select></section><div id="screen"></div>';
      const scenario = area.querySelector<HTMLSelectElement>('#scenario');
      if (!scenario) throw new Error('Sélecteur introuvable.');
      scenario.addEventListener('change', () => demo.showScene(scenario.value));
      unsubscribe = demo.subscribe(() => { scenario.value = demo.getSceneName(); });
    } else {
      client = createWebSocketClient(url.value);
      area.innerHTML = '<p class="notice">Mode serveur WebSocket. Les réponses proviennent du serveur choisi.</p><div id="screen"></div>';
    }
    const screen = area.querySelector<HTMLDivElement>('#screen');
    if (!screen || !client) throw new Error('Écran introuvable.');
    dispose = mountUi(screen, client);
  } catch (cause) {
    client?.close(); client = null;
    error.hidden = false; error.textContent = cause instanceof Error ? cause.message : 'Connexion impossible.';
  }
};
transport.addEventListener('submit', event => { event.preventDefault(); start(); });
mode.addEventListener('change', () => { url.disabled = mode.value === 'simulation'; });
url.disabled = true;
start();
window.addEventListener('pagehide', () => { dispose(); unsubscribe(); client?.close(); }, { once: true });
