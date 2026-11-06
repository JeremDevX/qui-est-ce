import type {
  AttributeId, Character, GameOptions, HistoryEntry, PlayerId, PlayerStatus,
} from '../contracts/game.ts';
import { ATTRIBUTE_IDS, validateCatalog } from './catalog.ts';

export interface InternalPlayerState {
  status: PlayerStatus;
  remainingTurns: number;
  usedAttributes: Set<AttributeId>;
  history: HistoryEntry[];
  candidates: Set<string>;
}

export interface InternalGameState {
  mode: GameOptions['mode'];
  penalty: GameOptions['penalty'];
  characters: Character[];
  targets: Partial<Record<PlayerId, string>>;
  forbiddenAttribute: AttributeId;
  playerIds: PlayerId[];
  players: Partial<Record<PlayerId, InternalPlayerState>>;
  activePlayerId: PlayerId | null;
  winnerId: PlayerId | null;
  finished: boolean;
}

function drawIndex(size: number, random: () => number): number {
  const value = random();
  if (!Number.isFinite(value) || value < 0 || value >= 1) throw new Error('INVALID_RANDOM');
  return Math.floor(value * size);
}

export function createInitialState(options: GameOptions, random: () => number): InternalGameState {
  if (!options || typeof options !== 'object') throw new Error('INVALID_OPTIONS');
  if (options.mode !== 'solo' && options.mode !== 'duo') throw new Error('INVALID_MODE');
  if (options.penalty !== 'immediate_loss' && options.penalty !== 'lose_turn') {
    throw new Error('INVALID_PENALTY');
  }

  const characters = validateCatalog(options.characters);
  const playerIds: PlayerId[] = options.mode === 'solo' ? ['p1'] : ['p1', 'p2'];
  const targets: Partial<Record<PlayerId, string>> = {
    p1: characters[drawIndex(characters.length, random)]!.id,
  };
  if (options.mode === 'duo') {
    targets.p2 = characters[drawIndex(characters.length, random)]!.id;
  }
  const forbiddenAttribute = ATTRIBUTE_IDS[drawIndex(ATTRIBUTE_IDS.length, random)]!;
  const players: Partial<Record<PlayerId, InternalPlayerState>> = {};
  for (const id of playerIds) {
    players[id] = {
      status: 'playing',
      remainingTurns: 6,
      usedAttributes: new Set(),
      history: [],
      candidates: new Set(characters.map((character) => character.id)),
    };
  }

  return {
    mode: options.mode,
    penalty: options.penalty,
    characters,
    targets,
    forbiddenAttribute,
    playerIds,
    players,
    activePlayerId: 'p1',
    winnerId: null,
    finished: false,
  };
}
