import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createGame } from '../../src/engine/index.ts';
import type { Character } from '../../src/contracts/game.ts';
const characters = JSON.parse(await readFile(new URL('../../fixtures/characters.json', import.meta.url), 'utf8')) as Character[];
const options = (penalty: 'immediate_loss' | 'lose_turn') => ({ characters, mode: 'solo' as const, penalty });

test('proposition incorrecte : défaite immédiate', () => {
  const game = createGame(options('immediate_loss'), () => 0);
  assert.deepEqual(game.dispatch({ playerId: 'p1', type: 'guess', characterId: 'c02' }), { ok: true });
  const view = game.getView('p1');
  assert.equal(view.status, 'finished'); assert.equal(view.selfPlayer.remainingTurns, 5); assert.equal(view.players[0]!.status, 'lost');
  assert.equal(game.dispatch({ playerId: 'p1', type: 'guess', characterId: 'c01' }).ok, false);
});

test('variante perte de tour : la cible proposée est éliminée et le budget diminue', () => {
  const game = createGame(options('lose_turn'), () => 0);
  assert.deepEqual(game.dispatch({ playerId: 'p1', type: 'guess', characterId: 'c02' }), { ok: true });
  const view = game.getView('p1');
  assert.equal(view.status, 'playing'); assert.equal(view.selfPlayer.remainingTurns, 5); assert.ok(!view.selfPlayer.candidateIds.includes('c02'));
});

test('abandon sans coût d’action', () => {
  const game = createGame(options('immediate_loss'), () => 0);
  assert.deepEqual(game.forfeit('p1'), { ok: true });
  assert.equal(game.getView('p1').status, 'finished'); assert.equal(game.getView('p1').selfPlayer.remainingTurns, 6);
});
