import type { GameView, PlayerId, SelfPlayer } from '../contracts/game.ts';
import type { InternalGameState } from './state.ts';

export function projectGameView(state: InternalGameState, viewerId: PlayerId): GameView {
  if (!state.playerIds.includes(viewerId)) throw new Error('UNKNOWN_VIEWER');
  const player = state.players[viewerId];
  if (!player) throw new Error('UNKNOWN_VIEWER');

  const selfPlayer: SelfPlayer = {
    id: viewerId,
    remainingTurns: player.remainingTurns,
    candidateIds: [...player.candidates],
    usedAttributes: [...player.usedAttributes],
    history: structuredClone(player.history),
  };
  const revealedTargets = state.finished
    ? {
        p1: state.targets.p1!,
        ...(state.mode === 'duo' ? { p2: state.targets.p2! } : {}),
      }
    : null;

  return structuredClone({
    mode: state.mode,
    penalty: state.penalty,
    status: state.finished ? 'finished' : 'playing',
    viewerId,
    activePlayerId: state.activePlayerId,
    forbiddenAttribute: state.forbiddenAttribute,
    characters: state.characters,
    players: state.playerIds.map((id) => ({ id, status: state.players[id]!.status })),
    selfPlayer,
    winnerId: state.winnerId,
    revealedTargets,
  });
}
