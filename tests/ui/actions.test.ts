import assert from 'node:assert/strict';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { build } from 'vite';
import fixtureData from '../../fixtures/game-views.json' with { type: 'json' };
import type { ClientMessage, ClientState, GameClient } from '../../src/contracts/protocol.ts';
import { parseMockScenarios } from '../../src/ui/client/mock-fixtures.ts';
import { createDemoClient } from '../../src/ui/client/demo.ts';
import { ActionController, actionReason, attributeOrder, findQuestion, historyLine, questionChoices } from '../../src/ui/actions.ts';
import { initialSelection, normalizeSelection, renderScreen, screenAnnouncement } from '../../src/ui/screens.ts';

const fixtures = parseMockScenarios(fixtureData);
function stateFor(name = 'solo_initial'): ClientState {
  const fixture = fixtures.find(item => item.name === name);
  assert.ok(fixture);
  const game = structuredClone(fixture.view);
  return { connection: 'connected', error: null, session: { roomCode: 'SIMUL', playerId: game.viewerId, readyPlayers: [], status: game.status, game } };
}
function harness(state = stateFor()) {
  const sent: ClientMessage[] = [];
  const client: GameClient = { getState: () => structuredClone(state), subscribe: () => () => {}, send: message => { sent.push(message); }, close: () => {} };
  return { controller: new ActionController(client), sent };
}

test('les valeurs du formulaire produisent une seule Question v2 validée, sans playerId', () => {
  assert.equal(attributeOrder.length, 11);
  for (const key of attributeOrder) for (const question of questionChoices[key]) {
    assert.deepEqual(findQuestion(key, String(question.value)), question);
    assert.equal(question.attribute, key);
    assert.equal('playerId' in question, false);
  }
  assert.deepEqual(findQuestion('glasses', 'false'), { type: 'question', attribute: 'glasses', value: false });
  assert.equal(findQuestion('glasses', 'oui'), undefined);
  assert.equal(findQuestion('__proto__', 'true'), undefined);
});

test('une action en attente verrouille le double envoi sans modifier tours, candidats ni historique', () => {
  const { controller, sent } = harness();
  const before = structuredClone(controller.state);
  const question = findQuestion('glasses', 'true'); assert.ok(question);
  assert.equal(controller.send(question), true);
  assert.equal(controller.pending, true);
  assert.equal(controller.send(question), false);
  assert.equal(sent.length, 1);
  assert.deepEqual(sent[0], { protocolVersion: 2, type: 'action', command: question });
  assert.deepEqual(controller.state, before);
  controller.receive({ ...before, error: { code: 'INVALID_ACTION', message: 'Réessayez.' } });
  assert.equal(controller.pending, false);
  assert.equal(controller.send(question), true);
  controller.receive(stateFor('solo_apres_oui'));
  assert.equal(controller.state.session?.game?.selfPlayer.remainingTurns, 5);
  assert.equal(controller.pending, false);
});

test('tour adverse, attribut interdit ou utilisé, fin et fermeture bloquent les actions', () => {
  for (const name of ['duo_attente', 'solo_victoire']) {
    const { controller, sent } = harness(stateFor(name));
    assert.equal(controller.send({ type: 'guess', characterId: 'c01' }), false);
    assert.equal(sent.length, 0);
  }
  const { controller, sent } = harness(stateFor('solo_apres_oui'));
  assert.equal(controller.send({ type: 'question', attribute: 'piercing', value: true }), false);
  assert.equal(controller.send({ type: 'question', attribute: 'glasses', value: false }), false);
  assert.equal(controller.send({ type: 'guess', characterId: 'unknown' }), false);
  // Une proposition connue reste permise même hors des candidats, après confirmation dans l’UI.
  assert.equal(controller.send({ type: 'guess', characterId: 'c01' }), true);
  assert.equal(sent.length, 1);
  controller.receive({ connection: 'closed', session: null, error: null });
  assert.ok(actionReason(controller.state, false));
  assert.equal(controller.send({ type: 'guess', characterId: 'c01' }), false);
});

test('rendu : contrôles étiquetés, attributs indisponibles, confirmation et descriptions', () => {
  const state = stateFor('solo_apres_oui'); const game = state.session?.game; assert.ok(game);
  const selection = initialSelection(); normalizeSelection(selection, game);
  const html = renderScreen(state, false, selection);
  assert.match(html, /value="glasses" disabled/);
  assert.match(html, /value="piercing" disabled/);
  assert.match(html, /label for="attribute"/);
  assert.match(html, /Attributs de/);
  assert.match(html, /Portrait provisoire/);
  assert.match(html, /Lunettes : oui → Oui/);
  assert.doesNotMatch(html, /id="confirm-guess"/);
  selection.confirming = true;
  assert.match(renderScreen(state, false, selection), /id="confirm-guess"/);
  assert.match(renderScreen(state, false, selection), /id="cancel-guess"/);
  assert.match(renderScreen(state, true, selection), /fieldset disabled/);
  assert.doesNotMatch(renderScreen(state, true, selection), /id="confirm-guess"/);
  assert.match(renderScreen(stateFor('duo_attente'), false, selection), /Au tour de votre adversaire/);
});

test('annonces des réponses oui/non, victoire, cibles, erreurs échappées et fermeture', () => {
  const state = stateFor('solo_apres_oui'); const game = state.session?.game; assert.ok(game);
  assert.match(screenAnnouncement(state, false), /Oui/);
  assert.match(historyLine({ type: 'question', attribute: 'glasses', value: true, answer: false }, game), /Non/);
  const final = stateFor('solo_victoire');
  assert.match(renderScreen(final, false, initialSelection()), /vous avez gagné/);
  assert.match(renderScreen(final, false, initialSelection()), /Cible de p1/);
  const html = renderScreen({ ...state, error: { code: 'INVALID_ACTION', message: '<script>erreur</script>' } }, false, initialSelection());
  assert.match(html, /role="alert"/); assert.match(html, /&lt;script&gt;/); assert.doesNotMatch(html, /<script>/);
  assert.match(screenAnnouncement({ connection: 'closed', session: null, error: null }, false), /Connexion fermée/);
});

test('démonstration : salon/prêt, scènes manuelles et aucune réponse calculée à une action', () => {
  const demo = createDemoClient();
  try {
    demo.send({ protocolVersion: 2, type: 'create-room', mode: 'duo', penalty: 'immediate_loss' });
    assert.equal(demo.getState().session?.status, 'lobby');
    assert.match(renderScreen(demo.getState(), false, initialSelection()), /Je suis prêt/);
    demo.send({ protocolVersion: 2, type: 'ready' });
    assert.deepEqual(demo.getState().session?.readyPlayers, ['p1']);
    demo.showScene('solo_initial'); const before = demo.getState();
    demo.send({ protocolVersion: 2, type: 'action', command: { type: 'guess', characterId: 'c01' } });
    assert.deepEqual(demo.getState(), before);
    demo.showScene('solo_non'); assert.match(screenAnnouncement(demo.getState(), false), /Non/);
    demo.showScene('erreur'); assert.equal(demo.getState().error?.code, 'INVALID_ACTION');
    demo.showScene('solo_defaite'); assert.match(screenAnnouncement(demo.getState(), false), /vous avez perdu/);
    demo.send({ protocolVersion: 2, type: 'leave' }); assert.equal(demo.getState().session, null);
    demo.showScene('fermeture'); assert.equal(demo.getState().connection, 'closed');
  } finally { demo.close(); }
});

test('le build Vite de l’interface produit le HTML et le bundle, sans écrire de fichiers', async () => {
  const result = await build({ root: fileURLToPath(new URL('../../', import.meta.url)), configFile: false, logLevel: 'silent', build: { write: false, watch: null } });
  const bundles = Array.isArray(result) ? result : [result];
  assert.ok(bundles.some(bundle => 'output' in bundle && bundle.output.some(file => file.fileName === 'index.html')));
  assert.ok(bundles.some(bundle => 'output' in bundle && bundle.output.some(file => file.type === 'chunk')));
});
