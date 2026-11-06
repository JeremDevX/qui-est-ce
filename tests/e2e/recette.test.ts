import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import type { Command, Penalty } from '../../src/contracts/game.ts';
import { startServer } from '../../src/server/server.ts';
import { assertError, connect, createRoom, expectMessage, ready, registerCleanup, sendMessage, session, type TestClient } from '../server/helpers.ts';

async function action(client: TestClient, command: Command) {
  const next = expectMessage(client, 'snapshot');
  sendMessage(client, { protocolVersion: 2, type: 'action', command });
  const game = session(await next).game;
  assert.ok(game);
  return game;
}

async function startSolo(client: TestClient, penalty: Penalty) {
  await createRoom(client, 'solo', penalty);
  // Le tirage est fixé pendant le démarrage : cible c01, interdit piercing.
  const original = Math.random;
  const draws = [0, 5 / 11];
  Math.random = () => draws.shift() ?? 0;
  try {
    const game = session(await ready(client)).game;
    assert.ok(game);
    assert.equal(game.forbiddenAttribute, 'piercing');
    assert.equal(game.characters.length, 24);
    return game;
  } finally {
    Math.random = original;
  }
}

const questions: Command[] = [
  { type: 'question', attribute: 'glasses', value: false },
  { type: 'question', attribute: 'skinTone', value: 'claire' },
  { type: 'question', attribute: 'gender', value: 'homme' },
  { type: 'question', attribute: 'earrings', value: false },
  { type: 'question', attribute: 'clothing', value: 'tshirt' },
];

test('C4 : règles, rejets sans consommation et victoire à la sixième action par WebSocket', async t => {
  const server = await startServer(0);
  const clients: TestClient[] = [];
  registerCleanup(t, server, clients);
  const client = await connect(server.port, clients);
  const initial = await startSolo(client, 'lose_turn');
  const catalogue: unknown = JSON.parse(await readFile(new URL('../../data/characters.json', import.meta.url), 'utf8'));
  assert.deepEqual(initial.characters, catalogue);
  const first = await action(client, questions[0]!);
  assert.equal(first.selfPlayer.remainingTurns, 5);
  assert.deepEqual(first.selfPlayer.history[0], { type: 'question', attribute: 'glasses', value: false, answer: true });
  assert.deepEqual(first.selfPlayer.candidateIds, Array.from({ length: 12 }, (_, index) => `c${String(index * 2 + 1).padStart(2, '0')}`));
  const rejected = expectMessage(client, 'error');
  sendMessage(client, { protocolVersion: 2, type: 'action', command: questions[0] });
  assertError(await rejected, 'ATTRIBUTE_ALREADY_USED');
  const forbidden = expectMessage(client, 'error');
  sendMessage(client, { protocolVersion: 2, type: 'action', command: { type: 'question', attribute: 'piercing', value: false } });
  assertError(await forbidden, 'FORBIDDEN_ATTRIBUTE');
  const invalid = expectMessage(client, 'error');
  client.socket.send('{');
  assertError(await invalid, 'INVALID_MESSAGE');
  const second = await action(client, questions[1]!);
  assert.equal(second.selfPlayer.remainingTurns, 4);
  assert.deepEqual(second.selfPlayer.usedAttributes, ['glasses', 'skinTone']);
  assert.deepEqual(second.selfPlayer.candidateIds, initial.characters
    .filter(character => !character.attributes.glasses && character.attributes.skinTone === 'claire')
    .map(character => character.id));
  for (const question of questions.slice(2)) await action(client, question);
  const won = await action(client, { type: 'guess', characterId: 'c01' });
  assert.equal(won.selfPlayer.remainingTurns, 0);
  assert.equal(won.winnerId, 'p1');
  assert.equal(won.status, 'finished');
  assert.equal(won.selfPlayer.history.length, 6);
});

test('C4 : les deux pénalités et une question à la sixième action', async t => {
  const server = await startServer(0);
  const clients: TestClient[] = [];
  registerCleanup(t, server, clients);
  const [immediate, turn, sixth] = await Promise.all([connect(server.port, clients), connect(server.port, clients), connect(server.port, clients)]);
  await startSolo(immediate, 'immediate_loss');
  const lost = await action(immediate, { type: 'guess', characterId: 'c02' });
  assert.equal(lost.status, 'finished');
  assert.equal(lost.winnerId, null);
  assert.equal(lost.selfPlayer.remainingTurns, 5);
  await startSolo(turn, 'lose_turn');
  const continued = await action(turn, { type: 'guess', characterId: 'c02' });
  assert.equal(continued.status, 'playing');
  assert.equal(continued.selfPlayer.remainingTurns, 5);
  assert.ok(!continued.selfPlayer.candidateIds.includes('c02'));
  await startSolo(sixth, 'lose_turn');
  for (const question of questions) await action(sixth, question);
  const exhausted = await action(sixth, { type: 'question', attribute: 'hairColor', value: 'noir' });
  assert.equal(exhausted.status, 'finished');
  assert.equal(exhausted.winnerId, null);
  assert.equal(exhausted.selfPlayer.remainingTurns, 0);
});
