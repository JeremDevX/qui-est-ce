import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import type { Character } from '../../src/contracts/game.ts';
import { validateCatalog } from '../../scripts/catalog/catalog.ts';
import { attributeIds, findCollisions, traceStrategy } from '../../scripts/catalog/balance.ts';
import { buildBalanceReport } from '../../scripts/catalog/report-balance.ts';

const input: unknown = JSON.parse(await readFile(new URL('../../data/characters.json', import.meta.url), 'utf8'));
const characters = validateCatalog(input);
const base = characters[0];
assert.ok(base);

test('rapport publié reproductible sans mutation du catalogue', async () => {
  const before = JSON.stringify(characters);
  assert.equal(buildBalanceReport(characters), await readFile(new URL('../../data/equilibrage.md', import.meta.url), 'utf8'));
  assert.equal(JSON.stringify(characters), before);
});

test('collisions complètes et projetées détectées sur un contre-exemple', () => {
  const first = base;
  const second: Character = { ...first, id: 'different', attributes: { ...first.attributes, hairColor: 'blond' } };
  assert.deepEqual(findCollisions([first, second]), []);
  assert.deepEqual(findCollisions([first, second], 'hairColor'), [[first.id, second.id]]);
  assert.deepEqual(findCollisions([first, second, { ...first, id: 'duplicate' }]), [[first.id, 'duplicate']]);
});

test('264 chemins équilibrés légaux réservent une action à la proposition', () => {
  for (const forbidden of attributeIds) {
    assert.deepEqual(findCollisions(characters, forbidden), []);
    const traces = characters.map(({ id }) => traceStrategy(characters, id, forbidden, 'balanced'));
    // La première question ne dépend pas du secret, seulement des candidats connus.
    const first = traces[0]?.questions[0];
    assert.ok(first);
    for (const trace of traces) {
      assert.deepEqual(trace.candidateIds, [trace.targetId]);
      assert.ok(trace.questions.length <= 5);
      assert.equal(trace.actionsToWin, trace.questions.length + 1);
      assert.equal(new Set(trace.questions.map((step) => step.attribute)).size, trace.questions.length);
      assert.ok(trace.questions.every((step) => step.attribute !== forbidden));
      assert.equal(trace.questions[0]?.attribute, first.attribute);
      assert.equal(trace.questions[0]?.value, first.value);
    }
  }
});

test('ordre fixe ne garantit pas les 24 cibles pour chaque interdiction', () => {
  assert.ok(characters.some(({ id }) => traceStrategy(characters, id, 'glasses', 'ordered').actionsToWin === null));
});

test('signatures distinctes ne suffisent pas si un attribut ne peut être répété', () => {
  const sample: Character[] = (['noir', 'brun', 'blond'] as const).map((hairColor, index) => ({
    ...base, id: `sample${index}`, attributes: { ...base.attributes, hairColor },
  }));
  assert.deepEqual(findCollisions(sample), []);
  const trace = traceStrategy(sample, 'sample2', 'piercing', 'balanced');
  assert.equal(trace.questions.length, 1);
  assert.equal(trace.candidateIds.length, 2);
  assert.equal(trace.actionsToWin, null);
  assert.equal(traceStrategy(sample, 'sample0', 'hairColor', 'balanced').questions.length, 0);
});

test('budget arrête les questions à cinq, même si une sixième isolerait la cible', () => {
  const sample: Character[] = Array.from({ length: 64 }, (_, index) => ({
    ...base, id: `sample${index}`, attributes: {
      ...base.attributes,
      glasses: Boolean(index & 1), earrings: Boolean(index & 2), piercing: Boolean(index & 4),
      gender: index & 8 ? 'femme' : 'homme', hairLength: index & 16 ? 'long' : 'court',
      ageGroup: index & 32 ? 'vieux' : 'jeune',
    },
  }));
  const trace = traceStrategy(sample, 'sample0', 'clothing', 'balanced');
  assert.equal(trace.questions.length, 5);
  assert.equal(trace.candidateIds.length, 2);
  assert.equal(trace.actionsToWin, null);
});

test('une cible déjà isolée coûte encore une proposition et une cible inconnue échoue', () => {
  assert.equal(traceStrategy([base], base.id, 'piercing', 'balanced').actionsToWin, 1);
  assert.throws(() => traceStrategy(characters, 'unknown', 'piercing', 'balanced'), /Cible inconnue/);
});
