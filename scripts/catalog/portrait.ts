import type { Character, AttributeValues } from '../../src/contracts/game.ts';

const hairColors = { noir: '#24242b', brun: '#70432d', blond: '#e8be58', roux: '#bd5734', blanc: '#e9e7e3', aucun: 'none' };
const skinColors = { claire: '#f3c9a9', intermediaire: '#c48a61', foncee: '#784b35' };
const eyeColors = { marron: '#75452c', bleu: '#347bc6', vert: '#38794a' };

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

function drawHair(a: AttributeValues, back: boolean): string {
  const color = hairColors[a.hairColor];
  if (a.hairLength === 'aucun') return '';
  if (back) return a.hairLength === 'long'
    ? `<path d="M54 86 Q52 32 110 32 Q168 32 166 86 L177 201 Q154 213 142 195 L78 195 Q62 213 43 201Z" fill="${color}" stroke="#34333b" stroke-width="2"/>`
    : '';
  return `<path d="M65 86 Q62 36 110 36 Q158 36 155 87 L143 76 L138 58 Q111 82 78 70 L76 88Z" fill="${color}" stroke="#34333b" stroke-width="2"/>`;
}

function drawClothing(a: AttributeValues): string {
  const outline = 'stroke="#34333b" stroke-width="2" stroke-linejoin="round"';
  const body = 'M83 181 L63 185 L29 204 L23 239 L197 239 L191 204 L157 185 L137 181Z';
  switch (a.clothing) {
    case 'tshirt': return `<path d="${body}" fill="#6894c8" ${outline}/><path d="M84 182 Q110 207 136 182 M44 197 L54 218 M176 197 L166 218" fill="none" ${outline}/>`;
    case 'chemise': return `<path d="${body}" fill="#fff9eb" ${outline}/><path d="M83 181 L110 197 L91 207 L76 185 M137 181 L110 197 L129 207 L144 185 M110 197 V239" fill="#f0dfbb" ${outline}/><circle cx="115" cy="214" r="2"/><circle cx="115" cy="229" r="2"/>`;
    case 'pull': return `<path d="${body}" fill="#4d9b85" ${outline}/><rect x="83" y="175" width="54" height="23" rx="5" fill="#4d9b85" ${outline}/><path d="M89 179 V193 M99 179 V193 M109 179 V193 M119 179 V193 M129 179 V193 M70 210 L79 217 L70 224 L79 231 M141 210 L150 217 L141 224 L150 231" fill="none" stroke="#245a4b" stroke-width="2"/>`;
    case 'veste': return `<path d="${body}" fill="#c76b54" ${outline}/><path d="M91 182 L110 197 L129 182 L136 239 L84 239Z" fill="#f6ecdd" ${outline}/><path d="M83 181 L69 201 L93 211 L87 221 L107 239 M137 181 L151 201 L127 211 L133 221 L113 239" fill="none" ${outline}/><path d="M151 223 H174" ${outline}/>`;
  }
}

function drawFacialHair(a: AttributeValues): string {
  const color = hairColors[a.hairColor] === 'none' ? '#70432d' : hairColors[a.hairColor];
  const beard = a.facialHair === 'barbe' || a.facialHair === 'les_deux'
    ? `<path d="M77 135 Q79 164 110 175 Q141 164 143 135 L132 145 Q110 159 88 145Z" fill="${color}" stroke="#34333b" stroke-width="2"/>` : '';
  const moustache = a.facialHair === 'moustache' || a.facialHair === 'les_deux'
    ? `<path d="M110 126 Q96 120 88 134 Q99 139 110 132 Q121 139 132 134 Q124 120 110 126Z" fill="${color}" stroke="#34333b" stroke-width="2"/>` : '';
  return beard + moustache;
}

/** Dessin vectoriel original ; aucun média ni appel réseau nécessaire. */
export function renderPortrait(character: Character): string {
  const a = character.attributes;
  const skin = skinColors[a.skinTone];
  const eyes = eyeColors[a.eyeColor];
  const name = escapeXml(character.name);
  const wrinkles = a.ageGroup === 'vieux'
    ? '<path d="M91 81 Q110 76 129 81 M94 87 Q110 83 126 87 M77 119 L85 121 M143 119 L135 121 M90 146 L94 140 M130 146 L126 140" fill="none" stroke="#493c36" stroke-width="1.5"/>' : '';
  const earrings = a.earrings
    ? '<g fill="#efbc49" stroke="#34333b" stroke-width="2"><circle cx="58" cy="124" r="7"/><circle cx="162" cy="124" r="7"/><circle cx="58" cy="124" r="3" fill="none"/><circle cx="162" cy="124" r="3" fill="none"/></g>' : '';
  const glasses = a.glasses
    ? '<g fill="none" stroke="#252937" stroke-width="3"><rect x="76" y="101" width="28" height="22" rx="7"/><rect x="116" y="101" width="28" height="22" rx="7"/><path d="M104 109 Q110 105 116 109 M76 108 L65 103 M144 108 L155 103"/></g>' : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 280" role="img" aria-labelledby="title-${character.id} desc-${character.id}">
<title id="title-${character.id}">${name} — ${character.id}</title>
<desc id="desc-${character.id}">${escapeXml(describeCharacter(character))}</desc>
<rect width="220" height="280" rx="18" fill="#f4efe7"/>
${drawHair(a, true)}
<path d="M92 153 V186 Q110 203 128 186 V153" fill="${skin}" stroke="#34333b" stroke-width="2"/>
${drawClothing(a)}
<g fill="${skin}" stroke="#34333b" stroke-width="2"><ellipse cx="64" cy="109" rx="10" ry="17"/><ellipse cx="156" cy="109" rx="10" ry="17"/><ellipse cx="110" cy="109" rx="45" ry="58"/></g>
${drawHair(a, false)}
${wrinkles}
<g fill="#fffaf1" stroke="#34333b" stroke-width="1.5"><ellipse cx="90" cy="112" rx="11" ry="8"/><ellipse cx="130" cy="112" rx="11" ry="8"/></g>
<g fill="${eyes}" stroke="#34333b" stroke-width="1"><circle cx="90" cy="112" r="6"/><circle cx="130" cy="112" r="6"/></g>
<g fill="#20242c"><circle cx="90" cy="112" r="2"/><circle cx="130" cy="112" r="2"/></g>
<path d="M109 113 L105 129 L114 129 M99 141 Q110 147 121 141" fill="none" stroke="#34333b" stroke-width="2" stroke-linecap="round"/>
${drawFacialHair(a)}
${glasses}
${earrings}
${a.piercing ? '<circle cx="119" cy="126" r="4" fill="#dce3e7" stroke="#34333b" stroke-width="2"/>' : ''}
<text x="110" y="258" text-anchor="middle" font-family="sans-serif" font-size="18" font-weight="700" fill="#252937">${name}</text>
<text x="110" y="275" text-anchor="middle" font-family="sans-serif" font-size="12" fill="#45434a">${a.gender === 'femme' ? 'Femme' : 'Homme'} · ${a.ageGroup === 'jeune' ? 'Jeune' : 'Vieux'}</text>
</svg>
`;
}
