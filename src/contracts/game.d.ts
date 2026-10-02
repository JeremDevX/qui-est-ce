/** Contrat v1 — source commune. Aucun état privé du moteur ici. */
export interface AttributeValues {
  hairColor: 'noir' | 'brun' | 'blond' | 'roux' | 'blanc' | 'aucun';
  glasses: boolean;
  skinTone: 'claire' | 'intermediaire' | 'foncee';
  gender: 'femme' | 'homme';
  earrings: boolean;
  piercing: boolean;
  clothing: 'tshirt' | 'chemise' | 'pull' | 'veste';
  eyeColor: 'marron' | 'bleu' | 'vert';
  ageGroup: 'jeune' | 'vieux';
  hairLength: 'aucun' | 'court' | 'long';
  facialHair: 'aucune' | 'moustache' | 'barbe' | 'les_deux';
}

export type AttributeId = keyof AttributeValues;
export interface Character {
  id: string;
  name: string;
  portrait: string | null;
  attributes: AttributeValues;
}
export type PlayerId = 'p1' | 'p2';
export type Mode = 'solo' | 'duo';
export type Penalty = 'immediate_loss' | 'lose_turn';
export interface GameOptions {
  characters: Character[];
  mode: Mode;
  penalty: Penalty;
}

export type QuestionAction = {
  [K in AttributeId]: {
    type: 'question'; playerId: PlayerId; attribute: K; value: AttributeValues[K];
  }
}[AttributeId];
export interface GuessAction {
  type: 'guess';
  playerId: PlayerId;
  characterId: string;
}
export interface ReadyAction { type: 'ready'; playerId: PlayerId }
export type GameAction = QuestionAction | GuessAction | ReadyAction;
export type HistoryEntry =
  | (QuestionAction & { answer: boolean })
  | (GuessAction & { correct: boolean });
export type PlayerStatus = 'playing' | 'won' | 'lost';
export interface PublicPlayer { id: PlayerId; status: PlayerStatus }
export interface CurrentPlayer {
  id: PlayerId;
  remainingTurns: number;
  candidateIds: string[];
  usedAttributes: AttributeId[];
  history: HistoryEntry[];
}
export interface GameView {
  mode: Mode;
  penalty: Penalty;
  status: 'playing' | 'finished';
  phase: 'playing' | 'handoff' | 'finished';
  /** Joueur attendu en playing ou handoff ; null en finished. */
  activePlayerId: PlayerId | null;
  forbiddenAttribute: AttributeId;
  characters: Character[];
  players: PublicPlayer[];
  currentPlayer: CurrentPlayer | null;
  winnerId: PlayerId | null;
  /** null tant que la partie globale n'est pas terminée. */
  revealedTargets: Partial<Record<PlayerId, string>> | null;
}
export type GameErrorCode =
  | 'INVALID_ACTION' | 'GAME_FINISHED' | 'WRONG_PLAYER' | 'NOT_READY'
  | 'INVALID_ATTRIBUTE' | 'INVALID_VALUE' | 'FORBIDDEN_ATTRIBUTE'
  | 'ATTRIBUTE_ALREADY_USED' | 'UNKNOWN_CHARACTER';
export type ActionResult =
  | { ok: true; view: GameView }
  | { ok: false; error: { code: GameErrorCode; message: string }; view: GameView };
export interface GamePort {
  getView(): GameView;
  dispatch(action: GameAction): ActionResult;
}
export type CreateGame = (options: GameOptions, random?: () => number) => GamePort;
