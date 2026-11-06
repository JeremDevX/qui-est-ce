import { readFile, writeFile } from 'node:fs/promises';
import { validateCatalog } from './catalog.ts';
import { describeCharacter, escapeXml } from './portrait.ts';

async function main(): Promise<void> {
  const catalogueUrl = new URL('../../data/characters.json', import.meta.url);
  const input: unknown = JSON.parse(await readFile(catalogueUrl, 'utf8'));
  const characters = validateCatalog(input);
  const cards = characters.map((character) => `<article><img src="../public${escapeXml(character.portrait ?? '')}" alt="${escapeXml(character.name)}" width="220" height="280"/><h2>${character.id} — ${escapeXml(character.name)}</h2><p>${escapeXml(describeCharacter(character))}</p></article>`).join('\n');
  await writeFile(new URL('../../data/portraits.html', import.meta.url), `<!doctype html>
<html lang="fr"><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>Revue des 24 portraits — C2</title>
<style>body{margin:24px;background:#f4efe7;color:#252937;font:16px sans-serif}main{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:18px}article{background:white;border-radius:18px;padding:12px}img{display:block;margin:auto;max-width:100%;height:auto}h2{font-size:17px}p{font-size:14px;line-height:1.5}</style>
<h1>Revue des 24 portraits — C2</h1><p>Catalogue fictif. Planche de contrôle des attributs ; aucun jeu réel n’est exécuté ici.</p>
<main>${cards}</main></html>\n`);
  console.log('Planche data/portraits.html générée ; catalogue et portraits inchangés.');
}

if (import.meta.main) main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : 'Génération impossible');
  process.exitCode = 1;
});
