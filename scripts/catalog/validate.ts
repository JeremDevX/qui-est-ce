import { readFile } from 'node:fs/promises';
import { validateCatalog } from './catalog.ts';

async function main(): Promise<void> {
  const source = new URL('../../data/characters.json', import.meta.url);
  const input: unknown = JSON.parse(await readFile(source, 'utf8'));
  const characters = validateCatalog(input);
  console.log(`Catalogue valide : ${characters.length} personnages, IDs c01–c24, 11 attributs valides.`);
  console.log('Signatures uniques, y compris après retrait de chacun des 11 attributs.');
}

if (import.meta.main) {
  main().catch((error: unknown) => {
    console.error('Catalogue invalide :', error instanceof Error ? error.message : 'erreur inconnue');
    process.exitCode = 1;
  });
}
