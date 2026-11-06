import { readFile } from 'node:fs/promises';
import type { Character } from '../contracts/game.ts';
import { usableForbiddenAttributes, validateCatalog } from '../engine/catalog.ts';

const catalogueFiles = [
  new URL('../../data/characters.json', import.meta.url),
  new URL('../../fixtures/characters.json', import.meta.url),
];

function isMissingFile(error: unknown): boolean {
  return typeof error === 'object' && error !== null &&
    'code' in error && error.code === 'ENOENT';
}

export async function loadCharacters(): Promise<Character[]> {
  for (const file of catalogueFiles) {
    let text: string;
    try {
      text = await readFile(file, 'utf8');
    } catch (error) {
      if (isMissingFile(error)) continue;
      throw error;
    }

    const parsed: unknown = JSON.parse(text);
    return validateCatalog(parsed);
  }
  throw new Error('No catalogue found');
}

export async function loadPoliticalCharacters(): Promise<Character[]> {
  const file = new URL('../../data/politics.json', import.meta.url);
  const parsed: unknown = JSON.parse(await readFile(file, 'utf8'));
  const characters = validateCatalog(parsed);
  if (usableForbiddenAttributes(characters).length === 0) throw new Error('INVALID_CATALOG: no usable forbidden attribute');
  return characters;
}
