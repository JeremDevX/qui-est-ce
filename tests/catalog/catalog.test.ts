import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import test from 'node:test';
import type { AttributeId } from '../../src/contracts/game.ts';
import { validateCatalog } from '../../scripts/catalog/catalog.ts';

const input: unknown = JSON.parse(await readFile(new URL('../../data/characters.json', import.meta.url), 'utf8'));
const characters = validateCatalog(input);
const first = characters[0];
assert.ok(first);

function replaceFirst(fields: Record<string, unknown>): unknown[] {
  return characters.map((character, index) => index === 0 ? { ...character, ...fields } : character);
}

const replaceAttributes = (fields: Record<string, unknown>): unknown[] =>
  replaceFirst({ attributes: { ...first.attributes, ...fields } });

test('catalogue réel : 24 fiches, IDs stables et validation sans mutation', () => {
  const before = structuredClone(input);
  const validated = validateCatalog(input);
  assert.deepEqual(validated.map((character) => character.id).sort(),
    Array.from({ length: 24 }, (_, index) => `c${String(index + 1).padStart(2, '0')}`));
  assert.ok(validated.every((character) => character.portrait === `/characters/${character.id}.svg`));
  assert.deepEqual(input, before);
});

for (const invalid of [null, {}, 'catalogue', [], characters.slice(1), [...characters, first]]) {
  test(`rejette une racine invalide ou un effectif différent de 24 (${JSON.stringify(invalid).slice(0,30)})`, () => {
    assert.throws(() => validateCatalog(invalid), /exactement 24 personnages/);
  });
}

test('rejette une fiche non objet', () => {
  const invalid: unknown[] = [...characters];
  invalid[0] = null;
  assert.throws(() => validateCatalog(invalid), /Personnage 1 : objet attendu/);
});

test('rejette un ID dupliqué', () => {
  const second = characters[1];
  assert.ok(second);
  assert.throws(() => validateCatalog(replaceFirst({ id: second.id })), /c02 : ID dupliqué/);
});

for (const id of ['c00', 'c25', 'c1', '', 1]) {
  test(`rejette un ID hors convention (${JSON.stringify(id)})`, () => {
    assert.throws(() => validateCatalog(replaceFirst({ id })), /ID attendu entre c01 et c24/);
  });
}

for (const name of ['', '  ', null, 42]) {
  test(`rejette un nom invalide (${JSON.stringify(name)})`, () => {
    assert.throws(() => validateCatalog(replaceFirst({ name })), /c01 : nom non vide/);
  });
}

test('exige les 11 attributs, sans champ manquant, ajouté ou remplacé', () => {
  const { glasses, ...missing } = first.attributes;
  void glasses;
  for (const attributes of [missing, { ...first.attributes, extra: true }, { ...missing, extra: true }]) {
    assert.throws(() => validateCatalog(replaceFirst({ attributes })), /exactement les 11 attributs/);
  }
  for (const attributes of [null, [], 'attributs']) {
    assert.throws(() => validateCatalog(replaceFirst({ attributes })), /attributes doit être un objet/);
  }
});

const invalidValues: Record<AttributeId, unknown> = {
  hairColor: 'violet', glasses: 'false', skinTone: 'bleue', gender: 'inconnu',
  earrings: 0, piercing: null, clothing: 'robe', eyeColor: 'gris',
  ageGroup: 20, hairLength: 'moyen', facialHair: false,
};
for (const [attribute, value] of Object.entries(invalidValues)) {
  test(`rejette une valeur inconnue pour ${attribute}`, () => {
    assert.throws(() => validateCatalog(replaceAttributes({ [attribute]: value })),
      new RegExp(`c01 : valeur inconnue pour ${attribute}`));
  });
}

test('cheveux absents : couleur et longueur doivent correspondre dans les deux sens', () => {
  assert.throws(() => validateCatalog(replaceAttributes({ hairColor: 'aucun' })), /aucun ensemble/);
  assert.throws(() => validateCatalog(replaceAttributes({ hairLength: 'aucun' })), /aucun ensemble/);
  assert.doesNotThrow(() => validateCatalog(replaceAttributes({ hairColor: 'aucun', hairLength: 'aucun' })));
});

test('rejette deux signatures identiques sur les 11 attributs', () => {
  const duplicate = characters.map((character, index) => index === 1
    ? { ...character, attributes: { ...first.attributes } } : character);
  assert.throws(() => validateCatalog(duplicate), /c01 et c02 : collision sur les 11 attributs/);
});

test('détecte aussi la collision qui apparaît seulement après retrait d’un attribut', () => {
  const collision = characters.map((character, index) => index === 1
    ? { ...character, attributes: { ...first.attributes, hairColor: 'blond' } } : character);
  assert.throws(() => validateCatalog(collision), /c01 et c02 : collision après retrait de hairColor/);
});

test('accepte des chemins de portraits sous la racine publique, sans exiger les médias de C2', () => {
  for (const portrait of ['/characters/c01.svg', '/characters/groupe/c01.png', '/characters/c01.webp']) {
    assert.doesNotThrow(() => validateCatalog(replaceFirst({ portrait })));
  }
});

for (const portrait of [undefined, '', 1, 'https://example.com/c01.svg', 'characters/c01.svg',
  '/characters/../c01.svg', '/characters/c01.svg?x=1', '/characters/c01.exe']) {
  test(`rejette un portrait invalide (${String(portrait)})`, () => {
    assert.throws(() => validateCatalog(replaceFirst({ portrait })), /portrait attendu à null ou sous/);
  });
}
