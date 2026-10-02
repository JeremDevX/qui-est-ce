import { readFile } from 'node:fs/promises';
import test from 'node:test';
import assert from 'node:assert/strict';

import type { AttributeId, Character, GameView } from '../src/contracts/game.ts';

// Fixtures locales de confiance ; la validation des messages externes appartient au serveur/client.
const readJson = async <T>(path: string): Promise<T> => JSON.parse(await readFile(new URL(path, import.meta.url), 'utf8'));
const characters = await readJson<Character[]>('../fixtures/characters.json');
const views = await readJson<{ name: string; view: GameView }[]>('../fixtures/game-views.json');
const domains: Record<AttributeId, readonly (string | boolean)[]> = {
  hairColor: ['noir', 'brun', 'blond', 'roux', 'blanc', 'aucun'],
  glasses: [false, true],
  skinTone: ['claire', 'intermediaire', 'foncee'],
  gender: ['femme', 'homme'],
  earrings: [false, true],
  piercing: [false, true],
  clothing: ['tshirt', 'chemise', 'pull', 'veste'],
  eyeColor: ['marron', 'bleu', 'vert'],
  ageGroup: ['jeune', 'vieux'],
  hairLength: ['aucun', 'court', 'long'],
  facialHair: ['aucune', 'moustache', 'barbe', 'les_deux'],
};
const keys = Object.keys(domains) as AttributeId[];
const signature = (person: Character, attributes = keys) => JSON.stringify(attributes.map((key) => person.attributes[key]));

test('24 personnages valides, IDs et signatures uniques', () => {
  assert.equal(characters.length, 24);
  assert.equal(new Set(characters.map((c) => c.id)).size, 24);
  assert.equal(new Set(characters.map((c) => signature(c))).size, 24);
  for (const character of characters) {
    assert.match(character.id, /^c\d{2}$/);
    assert.ok(character.name.length > 0);
    assert.ok(character.portrait === null || typeof character.portrait === 'string');
    assert.deepEqual(Object.keys(character.attributes).sort(), [...keys].sort());
    for (const key of keys) {
      assert.ok(domains[key].includes(character.attributes[key]), `${character.id}: ${key}`);
    }
    assert.equal(character.attributes.hairColor === 'aucun', character.attributes.hairLength === 'aucun');
  }
});

test('objectif initial : aucune collision après retrait de chaque attribut', () => {
  for (const forbidden of keys) {
    const remaining = keys.filter((key) => key !== forbidden);
    assert.equal(new Set(characters.map((c) => signature(c, remaining))).size, 24, forbidden);
  }
});

test('vues simulées : cohérence des candidats, budget et vues individuelles', () => {
  assert.equal(views.length, 4);
  const ids = new Set(characters.map((c) => c.id));
  for (const { view } of views) {
    assert.deepEqual(view.characters, characters);
    assert.ok(keys.includes(view.forbiddenAttribute));
    assert.equal(view.players.length, view.mode === 'solo' ? 1 : 2);
    if (view.status !== 'finished') {
      assert.equal(view.revealedTargets, null);
      assert.equal(view.winnerId, null);
    } else {
      assert.equal(view.activePlayerId, null);
      for (const id of Object.values(view.revealedTargets ?? {})) assert.ok(ids.has(id));
    }
    if (view.selfPlayer) {
      const player = view.selfPlayer;
      assert.equal(player.id, view.viewerId);
      assert.equal(player.remainingTurns, 6 - player.history.length);
      assert.ok(player.remainingTurns >= 0 && player.remainingTurns <= 6);
      assert.equal(new Set(player.usedAttributes).size, player.usedAttributes.length);
      assert.ok(!player.usedAttributes.includes(view.forbiddenAttribute));
      const expected = characters.filter((person) => player.history.every((entry) => {
        if (entry.type === 'question') return (person.attributes[entry.attribute] === entry.value) === entry.answer;
        return entry.correct || person.id !== entry.characterId;
      })).map((person) => person.id);
      assert.deepEqual(player.candidateIds, expected);
    }
  }
});
