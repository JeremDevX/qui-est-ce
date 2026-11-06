import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createGame } from '../../src/engine/index.ts';
import type { Character, GameAction, GameEngine, GameOptions, PlayerId } from '../../src/contracts/game.ts';

const characters = JSON.parse(
  await readFile(new URL('../../fixtures/characters.json', import.meta.url), 'utf8'),
) as Character[];
const target = characters[0]!;

function game(
  mode: GameOptions['mode'] = 'solo',
  penalty: GameOptions['penalty'] = 'immediate_loss',
  draws = [0, 0.5],
): GameEngine {
  if (mode === 'duo') {
    return createGame({ characters, mode, penalty, targets: { p1: 'c01', p2: 'c02' } }, () => 0.5);
  }
  let index = 0;
  return createGame({ characters, mode, penalty }, () => draws[index++]!);
}

function assertRejectedWithoutMutation(
  engine: GameEngine,
  action: GameAction,
  code: string,
  players: PlayerId[] = ['p1'],
): void {
  const before = players.map((playerId) => engine.getView(playerId));
  const result = engine.dispatch(action);
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.error.code, code);
  assert.deepEqual(players.map((playerId) => engine.getView(playerId)), before);
}

test('une question répond, consomme une action, élimine les candidats et alimente l’historique', () => {
  const engine = game();
  const value = target.attributes.glasses;
  assert.deepEqual(engine.dispatch({ playerId: 'p1', type: 'question', attribute: 'glasses', value }), { ok: true });

  const view = engine.getView('p1');
  const expectedCandidates = characters
    .filter((character) => character.attributes.glasses === value)
    .map((character) => character.id);
  assert.deepEqual(view.selfPlayer.candidateIds, expectedCandidates);
  assert.equal(view.selfPlayer.remainingTurns, 5);
  assert.deepEqual(view.selfPlayer.usedAttributes, ['glasses']);
  assert.deepEqual(view.selfPlayer.history, [{ type: 'question', attribute: 'glasses', value, answer: true }]);
  assert.equal(view.activePlayerId, 'p1');
});

test('attribut interdit, attribut répété, valeur inconnue et action inconnue sont rejetés sans mutation', () => {
  const forbidden = game('solo', 'immediate_loss', [0, 0]);
  assertRejectedWithoutMutation(forbidden, {
    playerId: 'p1', type: 'question', attribute: 'hairColor', value: 'noir',
  }, 'FORBIDDEN_ATTRIBUTE');

  const repeated = game();
  assert.deepEqual(repeated.dispatch({
    playerId: 'p1', type: 'question', attribute: 'glasses', value: target.attributes.glasses,
  }), { ok: true });
  assertRejectedWithoutMutation(repeated, {
    playerId: 'p1', type: 'question', attribute: 'glasses', value: !target.attributes.glasses,
  }, 'ATTRIBUTE_ALREADY_USED');

  const invalidValue = game();
  const malformedValue: GameAction = {
    playerId: 'p1', type: 'question', attribute: 'glasses', value: false,
  };
  Object.defineProperty(malformedValue, 'value', { value: 'violet' });
  assertRejectedWithoutMutation(invalidValue, malformedValue, 'INVALID_VALUE');

  const invalidType = game();
  const malformedType: GameAction = {
    playerId: 'p1', type: 'question', attribute: 'glasses', value: false,
  };
  Object.defineProperty(malformedType, 'type', { value: 'unknown' });
  assertRejectedWithoutMutation(invalidType, malformedType, 'INVALID_ACTION');
});

test('un attribut inconnu et un personnage inconnu ne consomment rien', () => {
  const engine = game();
  const malformedAttribute: GameAction = {
    playerId: 'p1', type: 'question', attribute: 'glasses', value: false,
  };
  Object.defineProperty(malformedAttribute, 'attribute', { value: 'unknown' });
  assertRejectedWithoutMutation(engine, malformedAttribute, 'INVALID_ATTRIBUTE');
  assertRejectedWithoutMutation(engine, { playerId: 'p1', type: 'guess', characterId: 'c99' }, 'UNKNOWN_CHARACTER');
});

test('une action hors tour est rejetée et laisse les deux vues identiques', () => {
  const engine = game('duo');
  assertRejectedWithoutMutation(engine, {
    playerId: 'p2', type: 'question', attribute: 'glasses', value: target.attributes.glasses,
  }, 'WRONG_PLAYER', ['p1', 'p2']);
});

test('les budgets et historiques sont indépendants, les tours alternent et la même cible est possible', () => {
  const engine = createGame({
    characters, mode: 'duo', penalty: 'immediate_loss', targets: { p1: 'c01', p2: 'c01' },
  }, () => 0.5);
  assert.deepEqual(engine.dispatch({
    playerId: 'p1', type: 'question', attribute: 'glasses', value: target.attributes.glasses,
  }), { ok: true });
  assert.equal(engine.getView('p2').activePlayerId, 'p2');
  assert.deepEqual(engine.dispatch({
    playerId: 'p2', type: 'question', attribute: 'glasses', value: target.attributes.glasses,
  }), { ok: true });

  const p1 = engine.getView('p1');
  const p2 = engine.getView('p2');
  assert.equal(p1.activePlayerId, 'p1');
  assert.equal(p1.selfPlayer.remainingTurns, 5);
  assert.equal(p2.selfPlayer.remainingTurns, 5);
  assert.deepEqual(p1.selfPlayer.usedAttributes, ['glasses']);
  assert.deepEqual(p2.selfPlayer.usedAttributes, ['glasses']);
  assert.equal(p1.selfPlayer.history.length, 1);
  assert.equal(p2.selfPlayer.history.length, 1);

  assert.deepEqual(engine.dispatch({ playerId: 'p1', type: 'guess', characterId: 'c01' }), { ok: true });
  assert.equal(engine.getView('p2').status, 'finished');
  assert.deepEqual(engine.getView('p2').revealedTargets, { p1: 'c01', p2: 'c01' });
});

test('une bonne proposition gagne à la sixième action; une question à la sixième fait perdre', () => {
  const questions = [
    { attribute: 'glasses', value: target.attributes.glasses },
    { attribute: 'skinTone', value: target.attributes.skinTone },
    { attribute: 'gender', value: target.attributes.gender },
    { attribute: 'earrings', value: target.attributes.earrings },
    { attribute: 'clothing', value: target.attributes.clothing },
  ] as const;
  const win = game();
  for (const question of questions) {
    assert.deepEqual(win.dispatch({ playerId: 'p1', type: 'question', ...question }), { ok: true });
  }
  assert.equal(win.getView('p1').selfPlayer.remainingTurns, 1);
  assert.deepEqual(win.dispatch({ playerId: 'p1', type: 'guess', characterId: 'c01' }), { ok: true });
  assert.equal(win.getView('p1').players[0]!.status, 'won');
  assert.equal(win.getView('p1').selfPlayer.remainingTurns, 0);
  assert.equal(win.getView('p1').activePlayerId, null);
  assert.equal(win.getView('p1').winnerId, 'p1');

  const lose = game();
  for (const question of questions) {
    assert.deepEqual(lose.dispatch({ playerId: 'p1', type: 'question', ...question }), { ok: true });
  }
  assert.deepEqual(lose.dispatch({
    playerId: 'p1', type: 'question', attribute: 'hairColor', value: target.attributes.hairColor,
  }), { ok: true });
  assert.equal(lose.getView('p1').status, 'finished');
  assert.equal(lose.getView('p1').players[0]!.status, 'lost');
  assert.equal(lose.getView('p1').selfPlayer.remainingTurns, 0);
  assert.equal(lose.getView('p1').winnerId, null);
});

test('les deux pénalités consomment une seule action; une proposition éliminée reste autorisée', () => {
  const immediate = game('solo', 'immediate_loss');
  assert.deepEqual(immediate.dispatch({ playerId: 'p1', type: 'guess', characterId: 'c02' }), { ok: true });
  assert.equal(immediate.getView('p1').status, 'finished');
  assert.equal(immediate.getView('p1').selfPlayer.remainingTurns, 5);
  assert.deepEqual(immediate.getView('p1').selfPlayer.history, [
    { type: 'guess', characterId: 'c02', correct: false },
  ]);

  const loseTurn = game('solo', 'lose_turn');
  assert.deepEqual(loseTurn.dispatch({ playerId: 'p1', type: 'guess', characterId: 'c02' }), { ok: true });
  assert.equal(loseTurn.getView('p1').status, 'playing');
  assert.equal(loseTurn.getView('p1').selfPlayer.remainingTurns, 5);
  assert.ok(!loseTurn.getView('p1').selfPlayer.candidateIds.includes('c02'));
  assert.deepEqual(loseTurn.dispatch({ playerId: 'p1', type: 'guess', characterId: 'c02' }), { ok: true });
  assert.equal(loseTurn.getView('p1').selfPlayer.remainingTurns, 4);
});

test('un perdant sort de la rotation, deux perdants terminent sans gagnant', () => {
  const oneLoser = game('duo');
  assert.deepEqual(oneLoser.dispatch({ playerId: 'p1', type: 'guess', characterId: 'c02' }), { ok: true });
  assert.equal(oneLoser.getView('p2').status, 'playing');
  assert.equal(oneLoser.getView('p2').activePlayerId, 'p2');
  assert.equal(oneLoser.getView('p2').selfPlayer.remainingTurns, 6);
  assert.deepEqual(oneLoser.dispatch({ playerId: 'p2', type: 'guess', characterId: 'c02' }), { ok: true });
  assert.equal(oneLoser.getView('p2').winnerId, 'p2');

  const noWinner = game('duo');
  assert.deepEqual(noWinner.dispatch({ playerId: 'p1', type: 'guess', characterId: 'c02' }), { ok: true });
  assert.deepEqual(noWinner.dispatch({ playerId: 'p2', type: 'guess', characterId: 'c01' }), { ok: true });
  const finished = noWinner.getView('p1');
  assert.equal(finished.status, 'finished');
  assert.equal(finished.activePlayerId, null);
  assert.equal(finished.winnerId, null);
  assert.deepEqual(finished.revealedTargets, { p1: 'c01', p2: 'c02' });
});

test('abandon sans action; deux abandons terminent sans gagnant et la fin rejette les actions', () => {
  const solo = game();
  assert.deepEqual(solo.forfeit('p1'), { ok: true });
  assert.equal(solo.getView('p1').selfPlayer.remainingTurns, 6);
  assert.equal(solo.getView('p1').players[0]!.status, 'lost');
  assert.equal(solo.getView('p1').winnerId, null);
  assert.deepEqual(solo.forfeit('p1'), { ok: false, error: {
    code: 'GAME_FINISHED', message: 'La partie est terminée.',
  } });
  assertRejectedWithoutMutation(solo, {
    playerId: 'p1', type: 'question', attribute: 'glasses', value: target.attributes.glasses,
  }, 'GAME_FINISHED');

  const duo = game('duo');
  assert.deepEqual(duo.forfeit('p1'), { ok: true });
  assert.equal(duo.getView('p2').activePlayerId, 'p2');
  assert.equal(duo.getView('p2').selfPlayer.remainingTurns, 6);
  assert.deepEqual(duo.forfeit('p2'), { ok: true });
  assert.equal(duo.getView('p1').status, 'finished');
  assert.equal(duo.getView('p1').activePlayerId, null);
  assert.equal(duo.getView('p1').winnerId, null);
});
