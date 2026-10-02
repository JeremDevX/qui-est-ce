import assert from 'node:assert/strict';
import test from 'node:test';
import fixtureData from '../../fixtures/game-views.json' with { type: 'json' };
import { parseMockScenarios } from '../../src/ui/client/mock-fixtures.ts';
import { createMockClient, getMockScenarioName, selectMockScenario } from '../../src/ui/client/mock.ts';

test('les quatre fixtures v2 sont chargées ; JSON mal formé et domaines inconnus rejetés', () => {
  assert.equal(parseMockScenarios(fixtureData).length, 4);
  for (const input of [null, {}, [], [{ name: 'broken', view: {} }]]) {
    assert.throws(() => parseMockScenarios(input));
  }
  const first = fixtureData[0];
  assert.ok(first);
  const sample = [{ ...first, view: { ...first.view, characters: first.view.characters.map((person) => ({
    ...person, attributes: { ...person.attributes, glasses: 'oui' },
  })) } }];
  assert.throws(() => parseMockScenarios(sample), /invalide/);
  assert.throws(() => parseMockScenarios([fixtureData[0], fixtureData[0]]), /dupliqué/);
});

test('un choix duo utilise un vrai snapshot duo, sans réétiqueter une vue solo', () => {
  selectMockScenario('solo_initial');
  const client = createMockClient();
  try {
    client.send({ protocolVersion: 2, type: 'create-room', mode: 'duo', penalty: 'lose_turn' });
    const game = client.getState().session?.game;
    assert.equal(getMockScenarioName(), 'duo_attente');
    assert.equal(game?.mode, 'duo');
    assert.equal(game?.players.length, 2);
    assert.equal(game?.penalty, 'lose_turn');
    selectMockScenario('solo_victoire');
    assert.equal(client.getState().session?.game?.mode, 'solo');
    assert.equal(client.getState().session?.status, 'finished');
  } finally { client.close(); }
});

test('lecture et abonnements ne permettent pas de modifier les snapshots ou fixtures', () => {
  selectMockScenario('solo_initial');
  const before = JSON.stringify(fixtureData);
  const first = createMockClient();
  const second = createMockClient();
  let observed: number | undefined;
  first.subscribe((state) => { state.session?.game?.selfPlayer.candidateIds.splice(0); });
  first.subscribe((state) => { observed = state.session?.game?.selfPlayer.candidateIds.length; });
  try {
    for (const client of [first, second]) client.send({ protocolVersion: 2, type: 'create-room', mode: 'solo', penalty: 'immediate_loss' });
    first.getState().session?.game?.selfPlayer.candidateIds.splice(0);
    assert.equal(observed, 24);
    assert.equal(first.getState().session?.game?.selfPlayer.candidateIds.length, 24);
    assert.equal(second.getState().session?.game?.selfPlayer.candidateIds.length, 24);
    assert.equal(JSON.stringify(fixtureData), before);
  } finally { first.close(); second.close(); }
});

test('désabonnement et fermeture stoppent les mises à jour ; aucune règle simulée', () => {
  selectMockScenario('solo_initial');
  const client = createMockClient();
  let count = 0;
  const unsubscribe = client.subscribe(() => { count++; });
  client.send({ protocolVersion: 2, type: 'create-room', mode: 'solo', penalty: 'immediate_loss' });
  const before = client.getState();
  client.send({ protocolVersion: 2, type: 'action', command: { type: 'guess', characterId: 'c01' } });
  assert.deepEqual(client.getState(), before);
  unsubscribe();
  selectMockScenario('solo_apres_oui');
  assert.equal(count, 1);
  assert.equal(client.getState().session?.game?.selfPlayer.remainingTurns, 5);
  client.close();
  selectMockScenario('solo_initial');
  client.send({ protocolVersion: 2, type: 'create-room', mode: 'solo', penalty: 'immediate_loss' });
  assert.deepEqual(client.getState(), { connection: 'closed', session: null, error: null });
  assert.throws(() => selectMockScenario('unknown'), /inconnu/);
});
