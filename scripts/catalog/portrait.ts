import type { Character } from '../../src/contracts/game.ts';

export function escapeXml(value: string): string {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;').replaceAll("'", '&apos;');
}

export function describeCharacter(character: Character): string {
  const a = character.attributes;
  return [
    `Cheveux : ${a.hairColor} ; longueur : ${a.hairLength}`,
    a.glasses ? 'avec lunettes' : 'sans lunettes', `peau ${a.skinTone}`,
    a.gender === 'femme' ? 'Femme' : 'Homme',
    a.earrings ? 'avec boucles d’oreilles' : 'sans boucles d’oreilles',
    a.piercing ? 'avec piercing au nez' : 'sans piercing',
    `vêtement : ${a.clothing}`, `yeux ${a.eyeColor}`, a.ageGroup === 'jeune' ? 'Jeune' : 'Vieux',
    `pilosité : ${a.facialHair}`,
  ].join(' ; ') + '.';
}
