import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createGame } from '../../src/engine/index.ts';
import type { Character, GameOptions } from '../../src/contracts/game.ts';

const characters = JSON.parse(
  await readFile(new URL('../../fixtures/characters.json', import.meta.url), 'utf8'),
) as Character[];

const options = (mode: GameOptions['mode'] = 'solo'): GameOptions => ({
  characters: structuredClone(characters),
  mode,
  penalty: 'immediate_loss',
});

function sequence(values: number[]) {
  let index = 0;
  return {
    random: () => {
      assert.ok(index < values.length, 'unexpected random draw');
      return values[index++]!;
    },
    calls: () => index,
  };
}

test('le tirage solo suit cible p1 puis attribut interdit', () => {
  const draws = sequence([0, 0.5]);
  const game = createGame(options(), draws.random);
  const view = game.getView('p1');

  assert.equal(view.selfPlayer.candidateIds.length, 24);
  assert.equal(view.selfPlayer.remainingTurns, 6);
  assert.equal(view.activePlayerId, 'p1');
  assert.equal(view.forbiddenAttribute, 'piercing');
  assert.equal(view.status, 'playing');
  assert.equal(view.revealedTargets, null);
  assert.deepEqual(view.players, [{ id: 'p1', status: 'playing' }]);
  assert.equal(draws.calls(), 2);
  assert.throws(() => game.getView('p2'), /UNKNOWN_VIEWER/);
  assert.deepEqual(game.dispatch({ playerId: 'p1', type: 'guess', characterId: 'c01' }), { ok: true });
  assert.equal(game.getView('p1').winnerId, 'p1');
});

test('le tirage duo suit les cibles p1, p2 puis l’attribut interdit', () => {
  const draws = sequence([0, 1 / 24, 0.5]);
  const game = createGame(options('duo'), draws.random);
  const p1 = game.getView('p1');
  const p2 = game.getView('p2');

  assert.equal(p1.forbiddenAttribute, 'piercing');
  assert.equal(p2.forbiddenAttribute, 'piercing');
  assert.equal(p1.activePlayerId, 'p1');
  assert.equal(p2.activePlayerId, 'p1');
  assert.deepEqual(p1.players, [
    { id: 'p1', status: 'playing' },
    { id: 'p2', status: 'playing' },
  ]);
  assert.equal(p1.selfPlayer.remainingTurns, 6);
  assert.equal(p2.selfPlayer.remainingTurns, 6);
  assert.equal(p1.selfPlayer.candidateIds.length, 24);
  assert.equal(p2.selfPlayer.candidateIds.length, 24);
  assert.equal(draws.calls(), 3);
  assert.deepEqual(game.dispatch({ playerId: 'p1', type: 'question', attribute: 'glasses', value: false }), { ok: true });
  assert.deepEqual(game.dispatch({ playerId: 'p2', type: 'guess', characterId: 'c02' }), { ok: true });
  assert.equal(game.getView('p2').winnerId, 'p2');
});

test('le catalogue et chaque vue sont détachés de l’état interne', () => {
  const gameOptions = options();
  const game = createGame(gameOptions, () => 0);
  gameOptions.characters[0]!.name = 'nom muté en entrée';
  const firstView = game.getView('p1');
  firstView.characters[0]!.name = 'nom muté dans la vue';
  firstView.selfPlayer.candidateIds.pop();
  firstView.selfPlayer.usedAttributes.push('glasses');

  const secondView = game.getView('p1');
  assert.equal(secondView.characters[0]!.name, characters[0]!.name);
  assert.equal(secondView.selfPlayer.candidateIds.length, 24);
  assert.deepEqual(secondView.selfPlayer.usedAttributes, []);
});

test('le catalogue exige 24 personnages, des domaines valides et des signatures uniques', () => {
  const invalidCases: Array<[string, (gameOptions: GameOptions) => void]> = [
    ['effectif', (gameOptions) => { gameOptions.characters.pop(); }],
    ['id dupliqué', (gameOptions) => { gameOptions.characters[1]!.id = gameOptions.characters[0]!.id; }],
    ['valeur hors domaine', (gameOptions) => {
      Object.defineProperty(gameOptions.characters[0]!.attributes, 'hairColor', { value: 'violet' });
    }],
    ['attribut supplémentaire', (gameOptions) => {
      Object.defineProperty(gameOptions.characters[0]!.attributes, 'extra', { value: true, enumerable: true });
    }],
    ['signature dupliquée', (gameOptions) => {
      gameOptions.characters[1]!.attributes = structuredClone(gameOptions.characters[0]!.attributes);
    }],
    ['cheveux incohérents', (gameOptions) => {
      gameOptions.characters[0]!.attributes.hairColor = 'aucun';
      gameOptions.characters[0]!.attributes.hairLength = 'long';
    }],
    ['catalogue non tableau', (gameOptions) => {
      Object.defineProperty(gameOptions, 'characters', { value: null });
    }],
  ];

  for (const [label, corrupt] of invalidCases) {
    const gameOptions = options();
    corrupt(gameOptions);
    assert.throws(() => createGame(gameOptions, () => 0), /INVALID_CATALOG/, label);
  }
});

test('un générateur aléatoire hors de [0, 1) est rejeté', () => {
  for (const invalidValue of [Number.NaN, -0.01, 1, Number.POSITIVE_INFINITY]) {
    assert.throws(() => createGame(options(), () => invalidValue), /INVALID_RANDOM/);
  }
});
