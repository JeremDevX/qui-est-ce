import type {
  ActionResult, CreateGame, GameAction, GameEngine, GameErrorCode, HistoryEntry,
  GameOptions, PlayerId,
} from '../contracts/game.ts';
import { ATTRIBUTE_IDS, isValidAttributeValue } from './catalog.ts';
import { createInitialState } from './state.ts';
import type { InternalGameState, InternalPlayerState } from './state.ts';
import { projectGameView } from './view.ts';

const fail = (code: GameErrorCode, message: string): ActionResult => ({
  ok: false,
  error: { code, message },
});

const playerState = (state: InternalGameState, id: PlayerId): InternalPlayerState | undefined =>
  state.players[id];

function questionHistory(
  action: Extract<GameAction, { type: 'question' }>,
  answer: boolean,
): HistoryEntry {
  switch (action.attribute) {
    case 'ageGroup': return { type: 'question', attribute: 'ageGroup', value: action.value, answer };
    case 'clothing': return { type: 'question', attribute: 'clothing', value: action.value, answer };
    case 'earrings': return { type: 'question', attribute: 'earrings', value: action.value, answer };
    case 'eyeColor': return { type: 'question', attribute: 'eyeColor', value: action.value, answer };
    case 'facialHair': return { type: 'question', attribute: 'facialHair', value: action.value, answer };
    case 'gender': return { type: 'question', attribute: 'gender', value: action.value, answer };
    case 'glasses': return { type: 'question', attribute: 'glasses', value: action.value, answer };
    case 'hairColor': return { type: 'question', attribute: 'hairColor', value: action.value, answer };
    case 'hairLength': return { type: 'question', attribute: 'hairLength', value: action.value, answer };
    case 'piercing': return { type: 'question', attribute: 'piercing', value: action.value, answer };
    case 'skinTone': return { type: 'question', attribute: 'skinTone', value: action.value, answer };
    default: {
      const exhaustive: never = action;
      return exhaustive;
    }
  }
}

export const createGame: CreateGame = (options: GameOptions, random = Math.random): GameEngine => {
  const state = createInitialState(options, random);
  const charactersById = new Map(state.characters.map((character) => [character.id, character]));

  const finishIfNeeded = (): void => {
    const activePlayers = state.playerIds.filter((id) => playerState(state, id)?.status === 'playing');
    if (activePlayers.length === 0 || state.winnerId) {
      state.finished = true;
      state.activePlayerId = null;
    } else if (state.activePlayerId === null || !activePlayers.includes(state.activePlayerId)) {
      state.activePlayerId = activePlayers[0]!;
    }
  };

  const nextTurn = (from: PlayerId): void => {
    const activePlayers = state.playerIds.filter((id) => playerState(state, id)?.status === 'playing');
    if (activePlayers.length === 0) {
      state.finished = true;
      state.activePlayerId = null;
      return;
    }
    const index = activePlayers.indexOf(from);
    state.activePlayerId = activePlayers[(index + 1) % activePlayers.length]!;
  };

  const dispatch = (action: GameAction): ActionResult => {
    if (state.finished) return fail('GAME_FINISHED', 'La partie est terminée.');
    if (!action || typeof action !== 'object' ||
        (action.type !== 'question' && action.type !== 'guess')) {
      return fail('INVALID_ACTION', 'Action invalide.');
    }
    if (!state.playerIds.includes(action.playerId)) return fail('WRONG_PLAYER', 'Joueur inconnu.');
    if (state.activePlayerId !== action.playerId) return fail('WRONG_PLAYER', 'Ce n’est pas votre tour.');
    const player = playerState(state, action.playerId);
    if (!player) return fail('WRONG_PLAYER', 'Joueur inconnu.');

    if (action.type === 'question') {
      if (!ATTRIBUTE_IDS.includes(action.attribute)) return fail('INVALID_ATTRIBUTE', 'Attribut inconnu.');
      if (action.attribute === state.forbiddenAttribute) {
        return fail('FORBIDDEN_ATTRIBUTE', 'Attribut interdit.');
      }
      if (player.usedAttributes.has(action.attribute)) {
        return fail('ATTRIBUTE_ALREADY_USED', 'Attribut déjà utilisé.');
      }
      if (!isValidAttributeValue(action.attribute, action.value)) {
        return fail('INVALID_VALUE', 'Valeur inconnue.');
      }
      const targetId = state.targets[action.playerId];
      const target = targetId ? charactersById.get(targetId) : undefined;
      if (!target) return fail('WRONG_PLAYER', 'Joueur inconnu.');
      const answer = target.attributes[action.attribute] === action.value;
      player.usedAttributes.add(action.attribute);
      player.remainingTurns -= 1;
      player.history.push(questionHistory(action, answer));
      for (const candidateId of player.candidates) {
        const candidate = charactersById.get(candidateId)!;
        if ((candidate.attributes[action.attribute] === action.value) !== answer) {
          player.candidates.delete(candidateId);
        }
      }
    } else if (action.type === 'guess') {
      const targetId = state.targets[action.playerId];
      if (!charactersById.has(action.characterId)) {
        return fail('UNKNOWN_CHARACTER', 'Personnage inconnu.');
      }
      const correct = targetId === action.characterId;
      player.remainingTurns -= 1;
      player.history.push({ type: 'guess', characterId: action.characterId, correct });
      if (correct) {
        player.status = 'won';
        state.winnerId = action.playerId;
      } else if (state.penalty === 'immediate_loss' || player.remainingTurns <= 0) {
        player.status = 'lost';
      } else {
        player.candidates.delete(action.characterId);
      }
    }

    if (player.status === 'playing' && player.remainingTurns <= 0) player.status = 'lost';
    if (player.status !== 'playing') finishIfNeeded();
    else if (!state.winnerId) nextTurn(action.playerId);
    return { ok: true };
  };

  const forfeit = (playerId: PlayerId): ActionResult => {
    if (state.finished) return fail('GAME_FINISHED', 'La partie est terminée.');
    if (!state.playerIds.includes(playerId)) return fail('WRONG_PLAYER', 'Joueur inconnu.');
    const player = playerState(state, playerId);
    if (!player) return fail('WRONG_PLAYER', 'Joueur inconnu.');
    player.status = 'lost';
    finishIfNeeded();
    if (!state.finished && state.activePlayerId === playerId) nextTurn(playerId);
    return { ok: true };
  };

  return {
    getView: (viewerId) => projectGameView(state, viewerId),
    dispatch,
    forfeit,
  };
};
