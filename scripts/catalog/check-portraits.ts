import { stat } from 'node:fs/promises';
import type { Character } from '../../src/contracts/game.ts';

/** Complète la validation du catalogue avec la présence des médias de C2. */
export async function validatePortraitFiles(
  characters: Character[],
  publicRoot = new URL('../../public/', import.meta.url),
): Promise<void> {
  for (const character of characters) {
    if (character.portrait === null) throw new Error(`${character.id} : portrait manquant.`);
    const file = new URL(`.${character.portrait}`, publicRoot);
    let information;
    try {
      information = await stat(file);
    } catch (error: unknown) {
      throw new Error(`${character.id} : portrait inaccessible (${character.portrait}).`, { cause: error });
    }
    if (!information.isFile() || information.size === 0) {
      throw new Error(`${character.id} : portrait vide ou non fichier (${character.portrait}).`);
    }
  }
}
