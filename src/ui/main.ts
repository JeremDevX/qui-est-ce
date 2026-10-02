import { createDemoClient, demoSceneLabels, demoSceneNames } from './client/demo.ts';
import { escapeHtml } from './actions.ts';
import { mountUi } from './app.ts';

const root = document.querySelector<HTMLDivElement>('#app');
if (!root) throw new Error('Élément #app introuvable.');
const client = createDemoClient();
root.innerHTML = '<aside class="simulation-banner" role="note"><div><strong>Mode simulation</strong><p>Exemples statiques : aucun moteur ni serveur. Après une action, sélectionnez un état pour montrer une réponse ou une erreur. Rien n’est calculé.</p></div></aside><section class="scenario-bar"><label for="scenario">Scénario de démonstration</label><select id="scenario">'+demoSceneNames.map(name=>'<option value="'+escapeHtml(name)+'">'+escapeHtml(demoSceneLabels[name] ?? name)+'</option>').join('')+'</select></section><div id="screen"></div>';
const screen = root.querySelector<HTMLDivElement>('#screen');
const scenario = root.querySelector<HTMLSelectElement>('#scenario');
if (!screen || !scenario) throw new Error('Structure UI introuvable.');
const dispose = mountUi(screen, client);
scenario.addEventListener('change', () => client.showScene(scenario.value));
const syncScenario = client.subscribe(() => { scenario.value = client.getSceneName(); });
window.addEventListener('pagehide', () => { dispose(); syncScenario(); client.close(); }, { once: true });
