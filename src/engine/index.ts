import type {
  ActionResult, AttributeId, GameErrorCode, AttributeValues, Character, CreateGame, GameAction, GameEngine, GameOptions, GameView, HistoryEntry, PlayerId, PlayerStatus, SelfPlayer,
} from '../contracts/game.ts';

const attributeDomains: { [K in AttributeId]: readonly AttributeValues[K][] } = {
  hairColor: ['noir', 'brun', 'blond', 'roux', 'blanc', 'aucun'], glasses: [false, true], skinTone: ['claire', 'intermediaire', 'foncee'], gender: ['femme', 'homme'], earrings: [false, true], piercing: [false, true], clothing: ['tshirt', 'chemise', 'pull', 'veste'], eyeColor: ['marron', 'bleu', 'vert'], ageGroup: ['jeune', 'vieux'], hairLength: ['aucun', 'court', 'long'], facialHair: ['aucune', 'moustache', 'barbe', 'les_deux'],
};
const attributeIds = Object.keys(attributeDomains) as AttributeId[];
const clone = <T>(value: T): T => structuredClone(value);
const fail = (code: GameErrorCode, message: string): ActionResult => ({ ok: false, error: { code, message } });

function validateCatalog(characters: Character[]): Character[] {
  if (!Array.isArray(characters) || characters.length !== 24) throw new Error('INVALID_CATALOG: expected 24 characters');
  const ids = new Set<string>(); const signatures = new Set<string>();
  for (const person of characters) {
    if (!person || typeof person.id !== 'string' || typeof person.name !== 'string' || (person.portrait !== null && typeof person.portrait !== 'string')) throw new Error('INVALID_CATALOG: invalid character');
    if (ids.has(person.id)) throw new Error('INVALID_CATALOG: duplicate id'); ids.add(person.id);
    const attrs = person.attributes as unknown as Record<string, unknown>;
    if (!attrs || Object.keys(attrs).sort().join() !== attributeIds.slice().sort().join()) throw new Error('INVALID_CATALOG: invalid attributes');
    for (const key of attributeIds) if (!(attributeDomains[key] as readonly unknown[]).includes(attrs[key])) throw new Error(`INVALID_CATALOG: invalid ${key}`);
    if ((attrs.hairColor === 'aucun') !== (attrs.hairLength === 'aucun')) throw new Error('INVALID_CATALOG: inconsistent hair');
    const signature = JSON.stringify(attributeIds.map((key) => attrs[key]));
    if (signatures.has(signature)) throw new Error('INVALID_CATALOG: duplicate signature'); signatures.add(signature);
  }
  return clone(characters);
}

export const createGame: CreateGame = (options: GameOptions, random = Math.random): GameEngine => {
  const characters = validateCatalog(options.characters);
  if (options.mode !== 'solo' && options.mode !== 'duo') throw new Error('INVALID_MODE');
  if (options.penalty !== 'immediate_loss' && options.penalty !== 'lose_turn') throw new Error('INVALID_PENALTY');
  const draw = (size: number): number => { const n = random(); if (!Number.isFinite(n) || n < 0 || n >= 1) throw new Error('INVALID_RANDOM'); return Math.floor(n * size); };
  const target: Record<PlayerId, string> = { p1: characters[draw(characters.length)]!.id, p2: characters[draw(characters.length)]!.id };
  const forbiddenAttribute = attributeIds[draw(attributeIds.length)]!;
  const players: Record<PlayerId, { status: PlayerStatus; remainingTurns: number; used: Set<AttributeId>; history: HistoryEntry[]; candidates: Set<string> }> = {
    p1: { status: 'playing', remainingTurns: 6, used: new Set(), history: [], candidates: new Set(characters.map((c) => c.id)) },
    p2: { status: 'playing', remainingTurns: 6, used: new Set(), history: [], candidates: new Set(characters.map((c) => c.id)) },
  };
  const ids: PlayerId[] = options.mode === 'solo' ? ['p1'] : ['p1', 'p2'];
  let active: PlayerId | null = 'p1'; let winner: PlayerId | null = null; let finished = false;
  const player = (id: PlayerId) => players[id];
  const finishIfNeeded = (): void => {
    const activeIds = ids.filter((id) => player(id).status === 'playing');
    if (activeIds.length === 0) { finished = true; active = null; return; }
    if (winner) { finished = true; active = null; return; }
    if (!active || player(active).status !== 'playing') active = activeIds[0]!;
  };
  const nextTurn = (from: PlayerId): void => {
    const candidates = ids.filter((id) => player(id).status === 'playing');
    if (!candidates.length) { finished = true; active = null; return; }
    const index = candidates.indexOf(from); active = candidates[(index + 1 + candidates.length) % candidates.length] ?? candidates[0]!;
  };
  const dispatch = (action: GameAction): ActionResult => {
    if (finished) return fail('GAME_FINISHED', 'La partie est terminée.');
    if (!ids.includes(action.playerId)) return fail('WRONG_PLAYER', 'Joueur inconnu.');
    if (active !== action.playerId) return fail('WRONG_PLAYER', 'Ce n’est pas votre tour.');
    const state = player(action.playerId);
    if (action.type === 'question') {
      if (!attributeIds.includes(action.attribute)) return fail('INVALID_ATTRIBUTE', 'Attribut inconnu.');
      if (action.attribute === forbiddenAttribute) return fail('FORBIDDEN_ATTRIBUTE', 'Attribut interdit.');
      if (state.used.has(action.attribute)) return fail('ATTRIBUTE_ALREADY_USED', 'Attribut déjà utilisé.');
      if (!(attributeDomains[action.attribute] as readonly unknown[]).includes(action.value)) return fail('INVALID_VALUE', 'Valeur inconnue.');
      const answer = (characters.find((c) => c.id === target[action.playerId])!.attributes[action.attribute] === action.value);
      state.used.add(action.attribute); state.remainingTurns -= 1; state.history.push({ ...action, answer });
      state.candidates = new Set([...state.candidates].filter((id) => ((characters.find((c) => c.id === id)!.attributes[action.attribute] === action.value) === answer)));
    } else if (action.type === 'guess') {
      if (!characters.some((c) => c.id === action.characterId)) return fail('UNKNOWN_CHARACTER', 'Personnage inconnu.');
      const correct = target[action.playerId] === action.characterId;
      state.remainingTurns -= 1; state.history.push({ type: 'guess', characterId: action.characterId, correct });
      if (correct) { state.status = 'won'; winner = action.playerId; }
      else if (options.penalty === 'immediate_loss' || state.remainingTurns <= 0) state.status = 'lost';
      else state.candidates.delete(action.characterId);
    }
    if (state.status === 'playing' && state.remainingTurns <= 0) state.status = 'lost';
    if (state.status !== 'playing') { finishIfNeeded(); } else if (!winner) nextTurn(action.playerId);
    return { ok: true };
  };
  const forfeit = (id: PlayerId): ActionResult => {
    if (finished) return fail('GAME_FINISHED', 'La partie est terminée.');
    if (!ids.includes(id)) return fail('WRONG_PLAYER', 'Joueur inconnu.');
    player(id).status = 'lost'; finishIfNeeded(); if (!finished && active === id) nextTurn(id); return { ok: true };
  };
  const getView = (viewerId: PlayerId): GameView => {
    if (!ids.includes(viewerId)) throw new Error('UNKNOWN_VIEWER');
    const state = player(viewerId);
    const selfPlayer: SelfPlayer = { id: viewerId, remainingTurns: state.remainingTurns, candidateIds: [...state.candidates], usedAttributes: [...state.used], history: clone(state.history) };
    return clone({ mode: options.mode, penalty: options.penalty, status: finished ? 'finished' : 'playing', viewerId, activePlayerId: active, forbiddenAttribute, characters, players: ids.map((id) => ({ id, status: player(id).status })), selfPlayer, winnerId: winner, revealedTargets: finished ? { p1: target.p1, ...(options.mode === 'duo' ? { p2: target.p2 } : {}) } : null });
  };
  return { getView, dispatch, forfeit };
};



