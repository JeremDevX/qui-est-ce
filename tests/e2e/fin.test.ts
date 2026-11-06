import assert from 'node:assert/strict';
import test from 'node:test';
import type { Command } from '../../src/contracts/game.ts';
import { startServer } from '../../src/server/server.ts';
import { assertError, connect, createRoom, expectMessage, ready, registerCleanup, sendMessage, session, type TestClient } from '../server/helpers.ts';

test('C4 : proposition déjà éliminée au dernier tour et action après la fin', async t => {
  const server = await startServer(0);
  const clients: TestClient[] = [];
  registerCleanup(t, server, clients);
  const client = await connect(server.port, clients);
  await createRoom(client, 'solo', 'lose_turn');
  const original = Math.random;
  const draws = [0, 5 / 11];
  Math.random = () => draws.shift() ?? 0;
  try {
    const game = session(await ready(client)).game;
    assert.ok(game);
    assert.equal(game.forbiddenAttribute, 'piercing');
  } finally {
    Math.random = original;
  }

  const actions: Command[] = [
    { type: 'guess', characterId: 'c02' },
    { type: 'question', attribute: 'glasses', value: false },
    { type: 'question', attribute: 'skinTone', value: 'claire' },
    { type: 'question', attribute: 'gender', value: 'homme' },
    { type: 'question', attribute: 'earrings', value: false },
    { type: 'guess', characterId: 'c02' },
  ];
  for (const [index, command] of actions.entries()) {
    const snapshot = expectMessage(client, 'snapshot');
    sendMessage(client, { protocolVersion: 2, type: 'action', command });
    const game = session(await snapshot).game;
    assert.ok(game);
    assert.equal(game.selfPlayer.remainingTurns, 5 - index);
    assert.equal(game.selfPlayer.history.length, index + 1);
    assert.ok(!game.selfPlayer.candidateIds.includes('c02'));
    assert.equal(game.status, index === 5 ? 'finished' : 'playing');
    if (index === 5) {
      assert.equal(game.winnerId, null);
      assert.equal(game.activePlayerId, null);
      assert.equal(game.selfPlayer.history.at(-1)?.type, 'guess');
    }
  }
  const rejected = expectMessage(client, 'error');
  sendMessage(client, { protocolVersion: 2, type: 'action', command: { type: 'guess', characterId: 'c01' } });
  assertError(await rejected, 'GAME_FINISHED');
});
