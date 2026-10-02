/** Contrat v2 — source commune. Aucun état privé du moteur ici. */
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


export type Question = {
  [K in AttributeId]: { type: 'question'; attribute: K; value: AttributeValues[K] }
}[AttributeId];
export type Command = Question | { type: 'guess'; characterId: string };
/** Identité ajoutée uniquement par le serveur, jamais acceptée du navigateur. */
export type GameAction = Command & { playerId: PlayerId };
export type HistoryEntry =
  | (Question & { answer: boolean })
  | { type: 'guess'; characterId: string; correct: boolean };
export type PlayerStatus = 'playing' | 'won' | 'lost';
export interface PublicPlayer { id: PlayerId; status: PlayerStatus }
export interface SelfPlayer {
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
  viewerId: PlayerId;
  activePlayerId: PlayerId | null;
  forbiddenAttribute: AttributeId;
  characters: Character[];
  players: PublicPlayer[];
  selfPlayer: SelfPlayer;
  winnerId: PlayerId | null;
  revealedTargets: Partial<Record<PlayerId, string>> | null;
}
export type GameErrorCode =
  | 'INVALID_ACTION' | 'GAME_FINISHED' | 'WRONG_PLAYER'
  | 'INVALID_ATTRIBUTE' | 'INVALID_VALUE' | 'FORBIDDEN_ATTRIBUTE'
  | 'ATTRIBUTE_ALREADY_USED' | 'UNKNOWN_CHARACTER';
export interface GameError { code: GameErrorCode; message: string }
export type ActionResult = { ok: true } | { ok: false; error: GameError };
export interface GameEngine {
  getView(viewerId: PlayerId): GameView;
  dispatch(action: GameAction): ActionResult;
  /** Abandon ou expiration de reconnexion ; ne consomme pas d'action. */
  forfeit(playerId: PlayerId): ActionResult;
}
export type CreateGame = (options: GameOptions, random?: () => number) => GameEngine;
