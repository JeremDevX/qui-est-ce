import { readFile, readdir, mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';
import test from 'node:test';
import { validateCatalog } from '../../scripts/catalog/catalog.ts';
import { validatePortraitFiles } from '../../scripts/catalog/check-portraits.ts';
import { describeCharacter } from '../../scripts/catalog/portrait.ts';

const input: unknown = JSON.parse(await readFile(new URL('../../data/characters.json', import.meta.url), 'utf8'));
const characters = validateCatalog(input);

test('le catalogue classique conserve douze personnages par genre et aucune pilosité faciale féminine', () => {
  assert.equal(characters.filter((character) => character.attributes.gender === 'femme').length, 12);
  assert.equal(characters.filter((character) => character.attributes.gender === 'homme').length, 12);
  assert.ok(characters.filter((character) => character.attributes.gender === 'femme')
    .every((character) => character.attributes.facialHair === 'aucune'));
});

test('24 portraits PNG existent, chacun lié au bon ID et lisible', async () => {
  await validatePortraitFiles(characters);
  const directory = new URL('../../public/characters/', import.meta.url);
  assert.deepEqual((await readdir(directory)).sort(), characters.map((character) => `${character.id}.png`).sort());
  for (const character of characters) {
    assert.equal(character.portrait, `/characters/${character.id}.png`);
    const png = await readFile(new URL(`../../public${character.portrait}`, import.meta.url));
    assert.deepEqual(png.subarray(0, 8), Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), character.id);
    assert.ok(png.length > 24, character.id);
    assert.ok(png.readUInt32BE(16) > 0 && png.readUInt32BE(20) > 0, character.id);
  }
});

test('le contrôle rejette les portraits null, absents, vides ou remplacés par un dossier', async (t) => {
  const directory = await mkdtemp(join(tmpdir(), 'qui-est-ce-portraits-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const root = pathToFileURL(directory + '/');
  const first = characters[0];
  assert.ok(first);
  await assert.rejects(validatePortraitFiles([{ ...first, portrait: null }], root), /c01 : portrait manquant/);
  await assert.rejects(validatePortraitFiles(characters, root), /c01 : portrait inaccessible/);
  await mkdir(new URL('characters/', root));
  const portrait = new URL('characters/c01.png', root);
  await writeFile(portrait, '');
  await assert.rejects(validatePortraitFiles(characters, root), /c01 : portrait vide ou non fichier/);
  await rm(portrait);
  await mkdir(portrait);
  await assert.rejects(validatePortraitFiles(characters, root), /c01 : portrait vide ou non fichier/);
});

test('la description textuelle renseigne tous les attributs du catalogue réel', () => {
  for (const character of characters) {
    const description = describeCharacter(character);
    const a = character.attributes;
    const expected = [
      `Cheveux : ${a.hairColor}`, `longueur : ${a.hairLength}`, `peau ${a.skinTone}`,
      a.glasses ? 'avec lunettes' : 'sans lunettes', a.gender === 'femme' ? 'Femme' : 'Homme',
      a.earrings ? 'avec boucles d’oreilles' : 'sans boucles d’oreilles',
      a.piercing ? 'avec piercing au nez' : 'sans piercing',
      `vêtement : ${a.clothing}`, `yeux ${a.eyeColor}`, a.ageGroup === 'jeune' ? 'Jeune' : 'Vieux',
      `pilosité : ${a.facialHair}`,
    ];
    for (const label of expected) assert.ok(description.includes(label), `${character.id} : ${label}`);
  }
});
