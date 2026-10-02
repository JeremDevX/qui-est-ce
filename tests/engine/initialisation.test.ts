import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createGame } from '../../src/engine/index.ts';
import type { Character } from '../../src/contracts/game.ts';
const characters = JSON.parse(await readFile(new URL('../../fixtures/characters.json', import.meta.url), 'utf8')) as Character[];
test('moteur initialise une vue détachée et rejette une action invalide', () => {
  const game = createGame({ characters, mode: 'solo', penalty: 'immediate_loss' }, () => 0);
  const view = game.getView('p1'); view.characters[0]!.name = 'muté';
  assert.equal(game.getView('p1').characters[0]!.name, characters[0]!.name);
  const before = game.getView('p1');
  const result = game.dispatch({ playerId: 'p1', type: 'guess', characterId: 'unknown' });
  assert.equal(result.ok, false); assert.deepEqual(game.getView('p1').selfPlayer, before.selfPlayer);
});


