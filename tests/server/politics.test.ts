import assert from 'node:assert/strict';
import test from 'node:test';
import { startServer } from '../../src/server/server.ts';
import { loadPoliticalCharacters } from '../../src/server/catalog.ts';
import { ATTRIBUTE_IDS, usableForbiddenAttributes } from '../../src/engine/catalog.ts';
import { createGame } from '../../src/engine/index.ts';
import { connect, expectMessage, ready, registerCleanup, sendMessage, session, type TestClient } from './helpers.ts';

test('le salon politique partage son catalogue et conserve les salons classiques', async t => {
  const server = await startServer(0);
  const clients: TestClient[] = [];
  registerCleanup(t, server, clients);
  const [host, guest, classic] = await Promise.all([connect(server.port, clients), connect(server.port, clients), connect(server.port, clients)]);
  const created = expectMessage(host, 'snapshot');
  sendMessage(host, { protocolVersion: 2, type: 'create-room', mode: 'duo', penalty: 'lose_turn', theme: 'politics' });
  const lobby = session(await created);
  assert.equal(lobby.status, 'lobby');
  assert.equal(lobby.theme, 'politics');
  assert.equal(lobby.characters.length, 24);
  assert.ok(lobby.characters.some(person => person.name === 'Jean-Marie Le Pen'));
  assert.ok(lobby.characters.some(person => person.name === 'Jean-Luc Mélenchon'));
  assert.ok(lobby.characters.some(person => person.name === 'Francisco Franco'));
  assert.ok(!lobby.characters.some(person => person.name === 'Augusto Pinochet'));
  assert.equal(lobby.characters.find(person => person.name === 'Xi Jinping')?.attributes.hairColor, 'gris');

  const joinedHost = expectMessage(host, 'snapshot');
  const joinedGuest = expectMessage(guest, 'snapshot');
  sendMessage(guest, { protocolVersion: 2, type: 'join-room', roomCode: lobby.roomCode });
  await joinedHost;
  const guestLobby = session(await joinedGuest);
  assert.equal(guestLobby.theme, 'politics');
  assert.deepEqual(guestLobby.game, null);

  const guestWaiting = expectMessage(guest, 'snapshot');
  await Promise.all([ready(host, lobby.characters[0]!.id), guestWaiting]);
  const hostPlaying = expectMessage(host, 'snapshot');
  const [first, second] = await Promise.all([hostPlaying, ready(guest, lobby.characters[1]!.id)]);
  assert.equal(session(first).game?.characters[0]?.name, lobby.characters[0]!.name);
  assert.equal(session(second).game?.ownSecretId, lobby.characters[1]!.id);

  const classicLobby = expectMessage(classic, 'snapshot');
  sendMessage(classic, { protocolVersion: 2, type: 'create-room', mode: 'duo', penalty: 'lose_turn' });
  const other = session(await classicLobby);
  assert.equal(other.status, 'lobby');
  assert.equal(other.theme, undefined);
  assert.notEqual(other.characters[0]?.name, lobby.characters[0]?.name);
});

test('le tirage interdit laisse tous les portraits politiques distincts', async () => {
  const characters = await loadPoliticalCharacters();
  const choices = usableForbiddenAttributes(characters);
  assert.ok(choices.length > 0);
  for (let index = 0; index < choices.length; index++) {
    const draws = [0, (index + 0.5) / choices.length];
    const game = createGame({ characters, mode: 'solo', penalty: 'lose_turn', theme: 'politics' }, () => draws.shift() ?? 0);
    const forbidden = game.getView('p1').forbiddenAttribute;
    const available = ATTRIBUTE_IDS.filter(attribute => attribute !== forbidden);
    const signatures = characters.map(person => JSON.stringify(available.map(attribute => person.attributes[attribute])));
    assert.equal(new Set(signatures).size, 24);
  }
});
