import { readFile, readdir, mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';
import test from 'node:test';
import { validateCatalog } from '../../scripts/catalog/catalog.ts';
import { validatePortraitFiles } from '../../scripts/catalog/check-portraits.ts';

const input: unknown = JSON.parse(await readFile(new URL('../../data/characters.json', import.meta.url), 'utf8'));
const characters = validateCatalog(input);

test('24 portraits SVG existent, chacun lié au bon ID et accessible', async () => {
  await validatePortraitFiles(characters);
  const directory = new URL('../../public/characters/', import.meta.url);
  assert.deepEqual((await readdir(directory)).sort(), characters.map((character) => `${character.id}.svg`).sort());
  for (const character of characters) {
    assert.equal(character.portrait, `/characters/${character.id}.svg`);
    const svg = await readFile(new URL(`../../public${character.portrait}`, import.meta.url), 'utf8');
    assert.match(svg, /<svg[^>]+viewBox="0 0 220 280"/);
    assert.ok(svg.includes(`aria-labelledby="title-${character.id} desc-${character.id}"`));
    assert.ok(svg.includes(`<title id="title-${character.id}">${character.name} — ${character.id}</title>`));
    assert.match(svg, /<desc id="desc-c\d{2}">[^<]+<\/desc>/);
    assert.ok(svg.includes(character.attributes.gender === 'femme' ? 'Femme' : 'Homme'));
    assert.ok(svg.includes(character.attributes.ageGroup === 'jeune' ? 'Jeune' : 'Vieux'));
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
  const portrait = new URL('characters/c01.svg', root);
  await writeFile(portrait, '');
  await assert.rejects(validatePortraitFiles(characters, root), /c01 : portrait vide ou non fichier/);
  await rm(portrait);
  await mkdir(portrait);
  await assert.rejects(validatePortraitFiles(characters, root), /c01 : portrait vide ou non fichier/);
});

test('la description du portrait renseigne tous les attributs du catalogue réel', async () => {
  for (const character of characters) {
    const svg = await readFile(new URL(`../../public${character.portrait}`, import.meta.url), 'utf8');
    const description = svg.match(/<desc[^>]*>([^<]+)<\/desc>/)?.[1];
    assert.ok(description, character.id);
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
