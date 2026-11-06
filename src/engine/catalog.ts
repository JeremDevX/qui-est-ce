import type { AttributeId, AttributeValues, Character } from '../contracts/game.ts';

export const ATTRIBUTE_IDS: readonly AttributeId[] = [
  'hairColor', 'glasses', 'skinTone', 'gender', 'earrings', 'piercing',
  'clothing', 'eyeColor', 'ageGroup', 'hairLength', 'facialHair',
];

const attributeDomains: { [K in AttributeId]: readonly AttributeValues[K][] } = {
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
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const hasExactKeys = (value: Record<string, unknown>, expected: readonly string[]): boolean => {
  const actual = Object.keys(value).sort();
  const keys = [...expected].sort();
  return actual.length === keys.length && actual.every((key, index) => key === keys[index]);
};

function parseAttribute<K extends AttributeId>(attribute: K, value: unknown): AttributeValues[K] {
  if (!(attributeDomains[attribute] as readonly unknown[]).includes(value)) {
    throw new Error(`INVALID_CATALOG: invalid ${attribute}`);
  }
  return value as AttributeValues[K];
}

function parseCharacter(value: unknown): Character {
  if (!isRecord(value) || !hasExactKeys(value, ['id', 'name', 'portrait', 'attributes'])) {
    throw new Error('INVALID_CATALOG: invalid character shape');
  }
  if (typeof value.id !== 'string' || typeof value.name !== 'string' ||
      (value.portrait !== null && typeof value.portrait !== 'string')) {
    throw new Error('INVALID_CATALOG: invalid character fields');
  }
  if (!isRecord(value.attributes) || !hasExactKeys(value.attributes, ATTRIBUTE_IDS)) {
    throw new Error('INVALID_CATALOG: invalid attributes');
  }

  const attributes: AttributeValues = {
    hairColor: parseAttribute('hairColor', value.attributes.hairColor),
    glasses: parseAttribute('glasses', value.attributes.glasses),
    skinTone: parseAttribute('skinTone', value.attributes.skinTone),
    gender: parseAttribute('gender', value.attributes.gender),
    earrings: parseAttribute('earrings', value.attributes.earrings),
    piercing: parseAttribute('piercing', value.attributes.piercing),
    clothing: parseAttribute('clothing', value.attributes.clothing),
    eyeColor: parseAttribute('eyeColor', value.attributes.eyeColor),
    ageGroup: parseAttribute('ageGroup', value.attributes.ageGroup),
    hairLength: parseAttribute('hairLength', value.attributes.hairLength),
    facialHair: parseAttribute('facialHair', value.attributes.facialHair),
  };
  if ((attributes.hairColor === 'aucun') !== (attributes.hairLength === 'aucun')) {
    throw new Error('INVALID_CATALOG: inconsistent hair');
  }

  return { id: value.id, name: value.name, portrait: value.portrait, attributes };
}

export function validateCatalog(value: unknown): Character[] {
  if (!Array.isArray(value) || value.length !== 24) {
    throw new Error('INVALID_CATALOG: expected 24 characters');
  }

  const characters = value.map(parseCharacter);
  const ids = new Set<string>();
  const signatures = new Set<string>();
  for (const character of characters) {
    if (ids.has(character.id)) throw new Error('INVALID_CATALOG: duplicate id');
    ids.add(character.id);

    const signature = JSON.stringify(ATTRIBUTE_IDS.map((attribute) => character.attributes[attribute]));
    if (signatures.has(signature)) throw new Error('INVALID_CATALOG: duplicate signature');
    signatures.add(signature);
  }
  return characters;
}
