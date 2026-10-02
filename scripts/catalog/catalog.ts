import type { AttributeId, AttributeValues, Character } from '../../src/contracts/game.ts';

// Domaines de validation à l'exécution, vérifiés contre les types v2.
const domains = {
  hairColor: ['noir', 'brun', 'blond', 'roux', 'blanc', 'aucun'],
  glasses: [false, true],
  skinTone: ['claire', 'intermediaire', 'foncee'],
  gender: ['femme', 'homme'],
  earrings: [false, true],
  piercing: [false, true],
  clothing: ['tshirt', 'chemise', 'pull', 'veste'],
  eyeColor: ['marron', 'bleu', 'vert'],
  ageGroup: ['jeune', 'vieux'],
  hairLength: ['aucun', 'court', 'long'],
  facialHair: ['aucune', 'moustache', 'barbe', 'les_deux'],
} satisfies { [K in AttributeId]: readonly AttributeValues[K][] };

// Ce cast concerne uniquement les clés de l'objet interne ci-dessus, pas le JSON reçu.
const attributeIds = Object.keys(domains) as AttributeId[];
const portraitPath = /^\/characters\/(?:[A-Za-z0-9_-]+\/)*[A-Za-z0-9_-]+\.(?:svg|png|jpg|jpeg|webp)$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function validateCharacter(value: unknown, position: number): asserts value is Character {
  if (!isRecord(value)) throw new Error(`Personnage ${position} : objet attendu.`);
  if (typeof value.id !== 'string' || !/^c(?:0[1-9]|1[0-9]|2[0-4])$/.test(value.id)) {
    throw new Error(`Personnage ${position} : ID attendu entre c01 et c24.`);
  }
  const id = value.id;
  if (typeof value.name !== 'string' || value.name.trim().length === 0) {
    throw new Error(`${id} : nom non vide attendu.`);
  }
  if (value.portrait !== null && (typeof value.portrait !== 'string' || !portraitPath.test(value.portrait))) {
    throw new Error(`${id} : portrait attendu à null ou sous /characters/ (svg, png, jpg, jpeg, webp).`);
  }
  if (!isRecord(value.attributes)) throw new Error(`${id} : attributes doit être un objet.`);
  const attributes = value.attributes;
  const keys = Object.keys(attributes);
  if (keys.length !== attributeIds.length || !attributeIds.every((key) => Object.hasOwn(attributes, key))) {
    throw new Error(`${id} : exactement les 11 attributs du contrat sont attendus.`);
  }
  for (const key of attributeIds) {
    const allowed: readonly unknown[] = domains[key];
    if (!allowed.includes(attributes[key])) throw new Error(`${id} : valeur inconnue pour ${key}.`);
  }
  if ((attributes.hairColor === 'aucun') !== (attributes.hairLength === 'aucun')) {
    throw new Error(`${id} : hairColor et hairLength doivent indiquer aucun ensemble.`);
  }
}

function checkSignatures(characters: Character[], attributes: AttributeId[], label: string): void {
  const seen = new Map<string, string>();
  for (const character of characters) {
    const signature = JSON.stringify(attributes.map((key) => character.attributes[key]));
    const previous = seen.get(signature);
    if (previous !== undefined) throw new Error(`${previous} et ${character.id} : collision ${label}.`);
    seen.set(signature, character.id);
  }
}

/** Valide une frontière JSON et retourne les personnages sans modifier l'entrée. */
export function validateCatalog(value: unknown): Character[] {
  if (!Array.isArray(value) || value.length !== 24) {
    throw new Error('Le catalogue doit être un tableau de exactement 24 personnages.');
  }
  const entries: unknown[] = value;
  const characters: Character[] = [];
  const ids = new Set<string>();
  for (const [index, entry] of entries.entries()) {
    validateCharacter(entry, index + 1);
    if (ids.has(entry.id)) throw new Error(`${entry.id} : ID dupliqué.`);
    ids.add(entry.id);
    characters.push(entry);
  }
  checkSignatures(characters, attributeIds, 'sur les 11 attributs');
  for (const forbidden of attributeIds) {
    checkSignatures(characters, attributeIds.filter((key) => key !== forbidden), `après retrait de ${forbidden}`);
  }
  return characters;
}
