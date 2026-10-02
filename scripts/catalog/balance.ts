import type { AttributeId, AttributeValues, Character } from '../../src/contracts/game.ts';
import { domains } from './catalog.ts';

export type Strategy = 'ordered' | 'balanced';
export interface QuestionStep {
  attribute: AttributeId;
  value: AttributeValues[AttributeId];
  answer: boolean;
  candidateIds: string[];
}
export interface StrategyTrace {
  targetId: string;
  questions: QuestionStep[];
  candidateIds: string[];
  /** null si cinq questions ne suffisent pas à isoler la cible. */
  actionsToWin: number | null;
}
// Clés du domaine interne typé ; aucune assertion de type sur un JSON externe.
export const attributeIds = Object.keys(domains) as AttributeId[];

export function findCollisions(characters: Character[], excluded?: AttributeId): string[][] {
  const attributes = attributeIds.filter((attribute) => attribute !== excluded);
  const groups = new Map<string, string[]>();
  for (const character of characters) {
    const signature = JSON.stringify(attributes.map((attribute) => character.attributes[attribute]));
    const ids = groups.get(signature) ?? [];
    ids.push(character.id);
    groups.set(signature, ids);
  }
  return [...groups.values()].filter((ids) => ids.length > 1);
}

function chooseQuestion(candidates: Character[], available: AttributeId[], strategy: Strategy) {
  let best: { attribute: AttributeId; value: AttributeValues[AttributeId]; worst: number } | null = null;
  for (const attribute of available) {
    for (const value of domains[attribute]) {
      const yes = candidates.filter((character) => character.attributes[attribute] === value).length;
      if (yes === 0 || yes === candidates.length) continue;
      const worst = Math.max(yes, candidates.length - yes);
      if (best === null || worst < best.worst) best = { attribute, value, worst };
    }
    // Ordre fixe : meilleur partage du premier attribut encore informatif.
    if (strategy === 'ordered' && best !== null) break;
  }
  return best;
}

/** Analyse du catalogue, indépendante du moteur ; cinq questions + une proposition. */
export function traceStrategy(characters: Character[], targetId: string, forbidden: AttributeId, strategy: Strategy): StrategyTrace {
  const target = characters.find((character) => character.id === targetId);
  if (target === undefined) throw new Error(`Cible inconnue pour l'analyse : ${targetId}.`);
  let candidates = characters;
  let available = attributeIds.filter((attribute) => attribute !== forbidden);
  const questions: QuestionStep[] = [];
  while (candidates.length > 1 && questions.length < 5) {
    const choice = chooseQuestion(candidates, available, strategy);
    if (choice === null) break;
    const { attribute, value } = choice;
    const answer = target.attributes[attribute] === value;
    candidates = candidates.filter((character) => (character.attributes[attribute] === value) === answer);
    available = available.filter((key) => key !== attribute);
    questions.push({ attribute, value, answer, candidateIds: candidates.map((character) => character.id) });
  }
  return {
    targetId, questions, candidateIds: candidates.map((character) => character.id),
    actionsToWin: candidates.length === 1 ? questions.length + 1 : null,
  };
}
