import { readFile, writeFile } from 'node:fs/promises';
import type { Character } from '../../src/contracts/game.ts';
import { domains, validateCatalog } from './catalog.ts';
import { attributeIds, findCollisions, traceStrategy } from './balance.ts';
import type { Strategy } from './balance.ts';

export function buildBalanceReport(characters: Character[]): string {
  const lines = [
    '# Équilibrage du catalogue — C3', '',
    'Rapport généré depuis data/characters.json par node scripts/catalog/report-balance.ts. Aucun moteur, interface ou serveur WebSocket exécuté.', '',
    '## Distribution des 11 attributs', '',
    '| Attribut | Répartition (effectif sur 24) |', '| --- | --- |',
  ];
  for (const attribute of attributeIds) {
    const counts = domains[attribute].map((value) => {
      const count = characters.filter((character) => character.attributes[attribute] === value).length;
      return `${String(value)} : ${count}`;
    });
    lines.push(`| ${attribute} | ${counts.join(' ; ')} |`);
  }
  lines.push('', 'false/true signifient non/oui. Une valeur absente reste affichée avec un effectif zéro.', '',
    '## Collisions de signatures', '',
    `Sur les 11 attributs : ${findCollisions(characters).length} groupe(s) de collision.`, '',
    '| Attribut retiré | Groupes identiques sur les 10 autres attributs |', '| --- | --- |');
  for (const attribute of attributeIds) {
    const groups = findCollisions(characters, attribute);
    lines.push(`| ${attribute} | ${groups.length === 0 ? '0' : groups.map((ids) => ids.join(', ')).join(' ; ')} |`);
  }
  lines.push('', 'Cette unicité supplémentaire après retrait d’un attribut garantit seulement des signatures différentes ; elle ne garantit pas un chemin légal en six actions.', '',
    '## Stratégies comparées — cinq questions puis une proposition', '',
    '- Ordre fixe : premier attribut disponible qui partage les candidats ; choisir sa valeur qui minimise la plus grande branche.',
    '- Partage équilibré : même critère, appliqué à tous les attributs disponibles à chaque étape.',
    '- Égalités départagées par l’ordre des domaines dans scripts/catalog/catalog.ts. Questions d’égalité oui/non, un seul attribut, aucun type répété, attribut interdit exclu.',
    '- Chaque cible est analysée séparément pour chaque interdiction. Une cible isolée est proposée à l’action suivante. Après cinq questions, plusieurs candidats = cible non garantie par cette méthode ; aucune proposition au hasard comptée comme victoire.', '',
    '| Interdit | Méthode | Cibles isolées en ≤5 questions | Actions maximales des réussites, proposition incluse | Candidats maximum après arrêt | Cibles non garanties |',
    '| --- | --- | --- | --- | --- | --- |');
  let guaranteedScenarios = 0;
  for (const forbidden of attributeIds) {
    for (const strategy of ['ordered', 'balanced'] satisfies Strategy[]) {
      const traces = characters.map((character) => traceStrategy(characters, character.id, forbidden, strategy));
      const wins = traces.flatMap((trace) => trace.actionsToWin === null ? [] : [trace.actionsToWin]);
      const failed = traces.filter((trace) => trace.actionsToWin === null).map((trace) => trace.targetId);
      if (strategy === 'balanced') guaranteedScenarios += wins.length;
      lines.push(`| ${forbidden} | ${strategy === 'ordered' ? 'Ordre fixe' : 'Partage équilibré'} | ${wins.length}/24 | ${wins.length === 0 ? '—' : Math.max(...wins)} | ${Math.max(...traces.map((trace) => trace.candidateIds.length))} | ${failed.join(', ') || 'Aucune'} |`);
    }
  }
  lines.push('', `La méthode de partage équilibré isole ${guaranteedScenarios}/264 couples cible/interdiction dans ce modèle.`, '',
    '## Exemple reproductible', '',
    'Cible c01, attribut interdit piercing, méthode de partage équilibré :', '',
    '| Question | Attribut = valeur | Réponse | Candidats restants |', '| --- | --- | --- | --- |');
  const sample = traceStrategy(characters, 'c01', 'piercing', 'balanced');
  sample.questions.forEach((step, index) => lines.push(`| ${index + 1} | ${step.attribute} = ${String(step.value)} | ${step.answer ? 'Oui' : 'Non'} | ${step.candidateIds.join(', ')} |`));
  lines.push('', sample.actionsToWin === null
    ? `Après cinq questions au maximum, restent ${sample.candidateIds.join(', ')} : aucune victoire garantie par cette méthode.`
    : `Proposer c01 à l’action ${sample.actionsToWin} : une proposition finale est comptée dans les six actions.`, '',
    '## Interprétation et limites', '',
    'Une stratégie choisissant chaque question adaptativement peut avoir de meilleurs résultats qu’un ordre fixe. Ces deux méthodes gloutonnes ne recherchent pas tous les arbres possibles ; leurs échecs ne prouvent pas une impossibilité pour toute stratégie.', '',
    'Les réussites supposent des réponses exactes et des actions conformes au modèle. Aucune mauvaise proposition n’est tentée : les deux variantes de pénalité ne changent pas ces chemins. Une mauvaise proposition retire du budget ou termine la partie ; elle ne peut pas être considérée comme gratuite.', '',
    'Cinq réponses binaires offrent au plus 32 feuilles pour 24 cibles ; cette borne théorique ne suffit pas, car seules certaines partitions sont accessibles et un attribut ne peut pas être réutilisé. Une sixième question sans proposition consomme le dernier tour et ne gagne pas.', '',
    'Le catalogue et les portraits ne sont pas modifiés par le rapport. Aucun taux de victoire de joueurs réels, validation du moteur ou succès réseau n’est déduit de cette analyse. La recette applicative reste à exécuter en C4.', '');
  return lines.join('\n');
}

async function main(): Promise<void> {
  const input: unknown = JSON.parse(await readFile(new URL('../../data/characters.json', import.meta.url), 'utf8'));
  const characters = validateCatalog(input);
  await writeFile(new URL('../../data/equilibrage.md', import.meta.url), buildBalanceReport(characters));
  console.log('Rapport data/equilibrage.md généré : distributions, collisions et deux stratégies sur 264 couples chacune.');
}

if (import.meta.main) main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : 'Analyse impossible');
  process.exitCode = 1;
});
