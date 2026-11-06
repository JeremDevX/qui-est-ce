import type { AttributeId, AttributeValues, Character, GameView, HistoryEntry } from '../../contracts/game.ts';

export interface MockScenario { name: string; view: GameView }

const domains = {
  hairColor: ['noir', 'brun', 'blond', 'roux', 'blanc', 'aucun'], glasses: [false, true],
  skinTone: ['claire', 'intermediaire', 'foncee'], gender: ['femme', 'homme'],
  earrings: [false, true], piercing: [false, true], clothing: ['tshirt', 'chemise', 'pull', 'veste'],
  eyeColor: ['marron', 'bleu', 'vert'], ageGroup: ['jeune', 'vieux'],
  hairLength: ['aucun', 'court', 'long'], facialHair: ['aucune', 'moustache', 'barbe', 'les_deux'],
} satisfies { [K in AttributeId]: readonly AttributeValues[K][] };

function object(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
function attribute(value: unknown): value is AttributeId {
  return typeof value === 'string' && Object.hasOwn(domains, value);
}
function player(value: unknown): value is 'p1' | 'p2' { return value === 'p1' || value === 'p2'; }
function attributeValue(key: AttributeId, value: unknown): boolean {
  return domains[key].some((known) => known === value);
}
function character(value: unknown): value is Character {
  if (!object(value) || typeof value.id !== 'string' || typeof value.name !== 'string'
    || !(value.portrait === null || typeof value.portrait === 'string') || !object(value.attributes)) return false;
  const attributes = value.attributes;
  return Object.keys(domains).every((key) => attribute(key) && attributeValue(key, attributes[key]));
}
function history(value: unknown): value is HistoryEntry {
  if (!object(value)) return false;
  if (value.type === 'guess') return typeof value.characterId === 'string' && typeof value.correct === 'boolean';
  return value.type === 'question' && attribute(value.attribute)
    && attributeValue(value.attribute, value.value) && typeof value.answer === 'boolean';
}
function gameView(value: unknown): value is GameView {
  if (!object(value) || (value.mode !== 'solo' && value.mode !== 'duo')
    || (value.penalty !== 'immediate_loss' && value.penalty !== 'lose_turn')
    || (value.status !== 'playing' && value.status !== 'finished') || !player(value.viewerId)
    || !(value.activePlayerId === null || player(value.activePlayerId))
    || !(value.winnerId === null || player(value.winnerId)) || !attribute(value.forbiddenAttribute)
    || !Array.isArray(value.characters) || !value.characters.every(character)
    || !Array.isArray(value.players) || !value.players.every((entry: unknown) => object(entry)
      && player(entry.id) && (entry.status === 'playing' || entry.status === 'won' || entry.status === 'lost'))) return false;
  const self = value.selfPlayer;
  if (!object(self) || !player(self.id) || typeof self.remainingTurns !== 'number'
    || !Number.isInteger(self.remainingTurns) || self.remainingTurns < 0 || self.remainingTurns > 6
    || !Array.isArray(self.candidateIds) || !self.candidateIds.every((id: unknown) => typeof id === 'string')
    || !Array.isArray(self.usedAttributes) || !self.usedAttributes.every(attribute)
    || !Array.isArray(self.history) || !self.history.every(history)) return false;
  if (value.revealedTargets !== null && (!object(value.revealedTargets)
    || !Object.entries(value.revealedTargets).every(([key, id]) => player(key) && typeof id === 'string'))) return false;
  return self.id === value.viewerId && value.characters.length === 24
    && value.players.length === (value.mode === 'solo' ? 1 : 2);
}

/** Frontière des exemples JSON locaux, sans cast vers les contrats v2. */
export function parseMockScenarios(input: unknown): MockScenario[] {
  if (!Array.isArray(input) || input.length === 0) throw new Error('Les fixtures UI doivent contenir des scénarios.');
  const result: MockScenario[] = [];
  for (const entry of input) {
    if (!object(entry) || typeof entry.name !== 'string' || entry.name.length === 0 || !gameView(entry.view)) {
      throw new Error('Scénario UI invalide : nom ou GameView v2 incorrect.');
    }
    if (result.some(({ name }) => name === entry.name)) throw new Error(`Scénario UI dupliqué : ${entry.name}.`);
    result.push({ name: entry.name, view: structuredClone(entry.view) });
  }
  return result;
}
