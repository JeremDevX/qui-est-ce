import type { AttributeId, Command, GameView, HistoryEntry, Question } from '../contracts/game.ts';
import type { ClientState, GameClient } from '../contracts/protocol.ts';

export const attributeLabels: Record<AttributeId, string> = {
  hairColor: 'Cheveux', glasses: 'Lunettes', skinTone: 'Teint', gender: 'Genre',
  earrings: 'Boucles d’oreilles', piercing: 'Piercing', clothing: 'Vêtement',
  eyeColor: 'Yeux', ageGroup: 'Âge', hairLength: 'Longueur des cheveux', facialHair: 'Barbe ou moustache',
};
export const attributeOrder = Object.keys(attributeLabels) as AttributeId[];
// Chaque option contient déjà une Question v2 typée ; les valeurs du formulaire sont vérifiées par recherche.
export const questionChoices: Record<AttributeId, Question[]> = {
  hairColor: (['noir', 'brun', 'blond', 'roux', 'blanc', 'aucun'] as const).map(value => ({ type: 'question', attribute: 'hairColor', value })),
  glasses: [true, false].map(value => ({ type: 'question', attribute: 'glasses', value })),
  skinTone: [{ type: 'question', attribute: 'skinTone', value: 'claire' }, { type: 'question', attribute: 'skinTone', value: 'intermediaire' }, { type: 'question', attribute: 'skinTone', value: 'foncee' }],
  gender: [{ type: 'question', attribute: 'gender', value: 'femme' }, { type: 'question', attribute: 'gender', value: 'homme' }],
  earrings: [true, false].map(value => ({ type: 'question', attribute: 'earrings', value })),
  piercing: [true, false].map(value => ({ type: 'question', attribute: 'piercing', value })),
  clothing: [{ type: 'question', attribute: 'clothing', value: 'tshirt' }, { type: 'question', attribute: 'clothing', value: 'chemise' }, { type: 'question', attribute: 'clothing', value: 'pull' }, { type: 'question', attribute: 'clothing', value: 'veste' }],
  eyeColor: [{ type: 'question', attribute: 'eyeColor', value: 'marron' }, { type: 'question', attribute: 'eyeColor', value: 'bleu' }, { type: 'question', attribute: 'eyeColor', value: 'vert' }],
  ageGroup: [{ type: 'question', attribute: 'ageGroup', value: 'jeune' }, { type: 'question', attribute: 'ageGroup', value: 'vieux' }],
  hairLength: [{ type: 'question', attribute: 'hairLength', value: 'aucun' }, { type: 'question', attribute: 'hairLength', value: 'court' }, { type: 'question', attribute: 'hairLength', value: 'long' }],
  facialHair: [{ type: 'question', attribute: 'facialHair', value: 'aucune' }, { type: 'question', attribute: 'facialHair', value: 'moustache' }, { type: 'question', attribute: 'facialHair', value: 'barbe' }, { type: 'question', attribute: 'facialHair', value: 'les_deux' }],
};
export function findQuestion(attribute: string, value: string): Question | undefined {
  return attributeOrder.flatMap(key => questionChoices[key]).find(question => question.attribute === attribute && String(question.value) === value);
}
export function displayValue(value: string | boolean): string {
  return typeof value === 'boolean' ? (value ? 'oui' : 'non') : value.replaceAll('_', ' ');
}
export function escapeHtml(value: string): string {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll(String.fromCharCode(34), '&quot;').replaceAll(String.fromCharCode(39), '&#39;');
}
export function historyLine(entry: HistoryEntry, game: GameView): string {
  if (entry.type === 'question') return attributeLabels[entry.attribute] + ' : ' + displayValue(entry.value) + ' → ' + (entry.answer ? 'Oui' : 'Non');
  const name = game.characters.find(person => person.id === entry.characterId)?.name ?? entry.characterId;
  return 'Proposition : ' + name + ' → ' + (entry.correct ? 'Correcte' : 'Incorrecte');
}
export function actionReason(state: ClientState, pending: boolean): string | null {
  if (state.connection !== 'connected') return 'La connexion est fermée ou en cours.';
  if (pending) return 'Action envoyée. En attente du prochain état ou d’une erreur.';
  const game = state.session?.game;
  if (!game) return 'La partie n’a pas commencé.';
  if (game.status === 'finished') return 'La partie est terminée.';
  if (game.activePlayerId !== game.viewerId) return 'Au tour de votre adversaire. Veuillez patienter.';
  if (game.selfPlayer.remainingTurns <= 0) return 'Aucune action restante.';
  return null;
}
export function attributeReason(game: GameView, key: AttributeId): string | null {
  if (game.forbiddenAttribute === key) return 'interdit';
  return game.selfPlayer.usedAttributes.includes(key) ? 'déjà utilisé' : null;
}
/** Verrou de présentation uniquement : le moteur reste l’autorité des règles. */
export class ActionController {
  state: ClientState;
  pending = false;
  private client: GameClient;
  constructor(client: GameClient) { this.client = client; this.state = client.getState(); }
  receive(state: ClientState): void { this.state = state; this.pending = false; }
  send(command: Command): boolean {
    const game = this.state.session?.game;
    if (!game || actionReason(this.state, this.pending)) return false;
    if (command.type === 'question' && (attributeReason(game, command.attribute) || !findQuestion(command.attribute, String(command.value)))) return false;
    if (command.type === 'guess' && !game.characters.some(person => person.id === command.characterId)) return false;
    this.pending = true;
    try { this.client.send({ protocolVersion: 2, type: 'action', command }); }
    catch (error) { this.pending = false; throw error; }
    return true;
  }
}
