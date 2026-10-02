import type { AttributeId, Character } from '../contracts/game.ts';
import type { ClientState, GameClient } from '../contracts/protocol.ts';
import { createMockClient, getMockScenarioName, mockScenarioNames, selectMockScenario } from './client/mock.ts';


const app = document.querySelector<HTMLDivElement>('#app');
if (!app) throw new Error('Élément #app introuvable.');
const root: HTMLDivElement = app;
const client: GameClient = createMockClient();
let chosenScenario = mockScenarioNames[0] ?? '';
const attributeOrder: AttributeId[] = ['hairColor', 'glasses', 'skinTone', 'gender', 'earrings', 'piercing', 'clothing', 'eyeColor', 'ageGroup', 'hairLength', 'facialHair'];
const attributeLabels: Record<AttributeId, string> = { hairColor: 'Cheveux', glasses: 'Lunettes', skinTone: 'Teint', gender: 'Genre', earrings: 'Boucles d’oreilles', piercing: 'Piercing', clothing: 'Vêtement', eyeColor: 'Yeux', ageGroup: 'Âge', hairLength: 'Longueur des cheveux', facialHair: 'Barbe ou moustache' };
const scenarioLabels: Record<string, string> = { solo_initial: 'Solo · début', solo_apres_oui: 'Solo · après un oui', duo_attente: 'Duo · exemple', solo_victoire: 'Solo · partie terminée' };

function escapeHtml(value: string): string {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('\"', '&quot;').replaceAll('\'', '&#39;');
}
function showValue(value: string | boolean): string {
  if (typeof value === 'boolean') return value ? 'oui' : 'non';
  const text = value.replaceAll('_', ' ');
  return text.charAt(0).toLocaleUpperCase('fr-FR') + text.slice(1);
}
function describeCharacter(character: Character): string {
  return attributeOrder.map((key) => attributeLabels[key] + ' : ' + showValue(character.attributes[key])).join('. ');
}
function scenarioOptions(): string {
  return mockScenarioNames.map((name) => '<option value="' + escapeHtml(name) + '" ' + (name === chosenScenario ? 'selected' : '') + '>' + escapeHtml(scenarioLabels[name] ?? name) + '</option>').join('');
}
function banner(): string {
  return '<aside class="simulation-banner" role="note"><span class="simulation-dot" aria-hidden="true"></span><div><strong>Mode simulation</strong><p>Ces vues sont des exemples statiques. Elles ne font pas tourner les règles du jeu ni le serveur.</p></div></aside>';
}
function bindScenarioSelect(): void {
  const scenarioSelect = root.querySelector<HTMLSelectElement>('#scenario');
  scenarioSelect?.addEventListener('change', (event) => {
    chosenScenario = scenarioSelect.value;
    selectMockScenario(chosenScenario);
    root.querySelector<HTMLSelectElement>('#scenario')?.focus();
  });
}
function renderHome(state: ClientState): void {
  const closed = state.connection === 'closed' ? '<p class="notice" role="status">La démonstration est fermée. Recharge la page pour en ouvrir une nouvelle.</p>' : '';
  root.innerHTML = banner() + closed + '<main class="welcome-layout"><section class="welcome-copy"><p class="eyebrow">Un jeu de déduction, à ton rythme</p><h1>Qui est-ce&nbsp;?</h1><p class="lead">Observe les personnages et découvre les écrans de la partie.</p><div class="welcome-mark" aria-hidden="true">?<span>24</span></div></section><form id="setup" class="setup-card"><div class="section-kicker">Pour commencer</div><h2>Préparer une partie</h2><label for="mode">Mode de jeu</label><select id="mode" name="mode"><option value="solo">Solo</option><option value="duo">Duo</option></select><label for="penalty">Pénalité en cas de mauvaise proposition</label><select id="penalty" name="penalty"><option value="immediate_loss">Défaite immédiate</option><option value="lose_turn">Perdre un tour</option></select><label for="scenario">Scénario d’exemple</label><select id="scenario">' + scenarioOptions() + '</select><button class="primary-button" type="submit" ' + (state.connection === 'closed' ? 'disabled' : '') + '>Afficher la démonstration <span aria-hidden="true">→</span></button><p class="form-note">Le mode et la pénalité règlent l’affichage. Aucune partie réelle n’est lancée.</p></form></main>';
  bindScenarioSelect();
  root.querySelector<HTMLFormElement>('#setup')?.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!(event.currentTarget instanceof HTMLFormElement)) return;
    const data = new FormData(event.currentTarget);
    const mode = data.get('mode');
    const penalty = data.get('penalty');
    if ((mode !== 'solo' && mode !== 'duo') || (penalty !== 'immediate_loss' && penalty !== 'lose_turn')) return;
    client.send({ protocolVersion: 2, type: 'create-room', mode, penalty });
  });
}
function card(character: Character, candidate: boolean): string {
  const description = character.name + '. ' + describeCharacter(character) + (candidate ? '' : '. Non retenu parmi les candidats.');
  const portrait = character.portrait ? '<img class="portrait-image" src="' + escapeHtml(character.portrait) + '" alt="Portrait de ' + escapeHtml(character.name) + '" />' : '<div class="portrait-placeholder" role="img" aria-label="Portrait provisoire de ' + escapeHtml(character.name) + '"><span aria-hidden="true">☺</span></div>';
  const facts = [attributeLabels.hairColor + ' ' + showValue(character.attributes.hairColor), attributeLabels.glasses + ' ' + showValue(character.attributes.glasses), attributeLabels.clothing + ' ' + showValue(character.attributes.clothing)];
  return '<article class="character-card ' + (candidate ? '' : 'is-muted') + '" aria-label="' + escapeHtml(description) + '">' + portrait + '<div class="card-copy"><span class="character-id">' + escapeHtml(character.id) + '</span><h3>' + escapeHtml(character.name) + '</h3><ul class="quick-facts">' + facts.map((fact) => '<li>' + escapeHtml(fact) + '</li>').join('') + '</ul></div></article>';
}
function renderGame(state: ClientState): void {
  chosenScenario = getMockScenarioName();
  const session = state.session;
  const game = session?.game;
  if (!session || !game) { renderHome(state); return; }
  const candidateIds = new Set(game.selfPlayer.candidateIds);
  const modeLabel = game.mode === 'solo' ? 'Solo' : 'Duo';
  const statusLabel = game.status === 'finished' ? 'Exemple terminé' : game.activePlayerId === game.viewerId ? 'À vous de jouer' : 'Tour adverse';
  const targets = game.revealedTargets ? Object.entries(game.revealedTargets).map(([player, id]) => player + ' : ' + (game.characters.find((person) => person.id === id)?.name ?? id)).join(' · ') : '';
  root.innerHTML = banner() + '<main class="game-layout"><header class="game-heading"><div><p class="eyebrow">' + modeLabel + ' · exemple ' + escapeHtml(session.roomCode) + '</p><h1>La galerie</h1></div><span class="turn-pill">' + escapeHtml(statusLabel) + '</span></header><section class="scenario-bar" aria-label="Sélection du scénario de démonstration"><label for="scenario">Scénario</label><select id="scenario">' + scenarioOptions() + '</select><p>Chaque choix affiche un autre snapshot fourni.</p></section><section class="status-grid" aria-label="Résumé de la vue"><article class="status-card"><span>Actions restantes</span><strong>' + game.selfPlayer.remainingTurns + '<small> / 6</small></strong></article><article class="status-card"><span>Personnages candidats</span><strong>' + candidateIds.size + '<small> / ' + game.characters.length + '</small></strong></article><article class="status-card status-card-wide"><span>Attribut interdit</span><strong>' + escapeHtml(attributeLabels[game.forbiddenAttribute]) + '</strong><small>Cet attribut ne peut pas être demandé.</small></article></section>' + (targets ? '<p class="notice" role="status">Cibles révélées dans l’exemple terminé : ' + escapeHtml(targets) + '</p>' : '') + (state.error ? '<p class="notice" role="status">' + escapeHtml(state.error.message) + '</p>' : '') + '<div class="gallery-heading"><div><p class="eyebrow">La galerie</p><h2>Les 24 personnages</h2></div><p>Cartes présentées comme dans GameView.</p></div><section class="character-grid" aria-label="Grille des personnages">' + game.characters.map((person) => card(person, candidateIds.has(person.id))).join('') + '</section><footer class="game-footer"><span>Snapshot <code>' + escapeHtml(session.status) + '</code></span><span>La simulation ne calcule pas les réponses ni les éliminations.</span></footer></main>';
  bindScenarioSelect();
}
function render(state: ClientState): void {
  if (state.session?.game) renderGame(state);
  else renderHome(state);
}
client.subscribe(render);
render(client.getState());
