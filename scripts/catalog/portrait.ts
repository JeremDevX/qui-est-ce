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

function drawHair(a: AttributeValues, back: boolean, variant: number): string {
  const color = hairColors[a.hairColor];
  if (a.hairLength === 'aucun') return '';
  if (back) {
    if (a.hairLength !== 'long') return '';
    const shape = a.gender === 'femme'
      ? variant % 2 === 0
        ? 'M54 86 Q52 32 110 32 Q168 32 166 86 L177 201 Q154 213 142 195 L78 195 Q62 213 43 201Z'
        : 'M56 88 Q50 29 110 32 Q170 29 164 88 Q178 118 168 143 Q182 173 171 197 Q151 207 139 192 L81 192 Q69 207 49 197 Q38 173 52 143 Q42 118 56 88Z'
      : 'M60 86 Q55 33 110 33 Q165 33 160 86 Q165 131 145 164 L135 178 L85 178 L75 164 Q55 131 60 86Z';
    return `<path d="${shape}" fill="${color}" stroke="#34333b" stroke-width="2"/>`;
  }
  const femaleShort = [
    'M61 102 Q54 34 105 34 Q163 32 159 102 L151 113 L145 78 Q127 72 120 51 Q102 75 77 73 L70 112Z',
    'M61 100 Q51 38 104 34 Q166 30 159 100 L150 113 L146 81 Q130 74 124 54 Q109 78 76 77 L69 111Z',
    'M62 102 Q50 40 103 34 Q164 28 158 103 L151 112 L146 78 Q133 79 116 54 Q103 72 76 72 L70 111Z',
    'M61 100 Q53 33 110 34 Q165 34 159 100 L151 112 L147 77 Q129 68 120 53 Q102 80 75 76 L69 111Z',
  ];
  const maleLong = [
    'M65 94 Q58 36 110 35 Q160 34 155 94 L149 83 Q142 69 138 58 Q116 73 79 68 L72 95Z',
    'M65 94 Q56 35 108 34 Q160 34 155 94 L149 82 Q143 60 131 55 Q110 68 77 70 L72 96Z',
    'M65 94 Q57 37 108 34 Q162 36 155 94 L148 83 Q143 65 136 59 Q115 72 76 68 L72 94Z',
    'M65 94 Q57 34 108 34 Q162 32 155 94 L148 82 Q140 60 128 54 Q108 71 76 70 L72 95Z',
  ];
  const shapes = a.hairLength === 'long' && a.gender === 'homme' ? maleLong : a.hairLength === 'court' && a.gender === 'femme' ? femaleShort : a.hairLength === 'long' ? [
    'M65 97 Q57 36 108 35 Q159 35 155 97 L148 89 Q146 70 139 61 Q115 83 78 70 L73 98Z',
    'M65 96 Q56 35 108 34 Q163 35 155 96 L148 83 Q145 58 126 52 Q105 76 76 66 L72 96Z',
    'M64 96 Q58 34 110 33 Q164 34 156 96 L149 93 Q145 73 137 59 Q121 75 109 61 Q96 78 76 70 L72 96Z',
    'M65 97 Q56 37 107 34 Q162 33 155 97 L148 85 Q145 61 132 54 Q115 65 99 56 Q88 73 74 73 L72 97Z',
  ] : [
    'M65 91 Q62 36 110 36 Q158 36 155 91 L143 76 L138 58 Q111 82 78 70 L76 91Z',
    'M64 99 Q55 40 107 36 Q162 35 157 99 L150 106 L145 79 Q131 69 124 55 Q108 78 77 75 L72 105Z',
    'M65 93 Q57 46 84 43 Q96 26 114 37 Q138 29 150 48 Q160 63 155 93 L145 78 Q130 74 120 57 Q101 72 76 68 L74 93Z',
    'M65 94 Q58 41 104 36 Q154 30 155 94 L147 85 Q142 60 130 56 Q112 72 94 59 Q87 72 75 75 L73 94Z',
  ];
  return `<path d="${shapes[variant % shapes.length]}" fill="${color}" stroke="#34333b" stroke-width="2"/><path d="M79 59 Q91 45 108 44" fill="none" stroke="#fff" stroke-opacity=".25" stroke-width="3" stroke-linecap="round"/>`;
}

function drawClothing(a: AttributeValues, variant: number): string {
  const colors = ['#6894c8', '#b86c67', '#6d9884', '#a97da8', '#c68c50', '#657aab'];
  const color = colors[variant % colors.length];
  const outline = 'stroke="#34333b" stroke-width="2" stroke-linejoin="round"';
  const body = 'M83 181 L63 185 L29 204 L23 239 L197 239 L191 204 L157 185 L137 181Z';
  switch (a.clothing) {
    case 'tshirt': return `<path d="${body}" fill="${color}" ${outline}/><path d="M84 182 Q110 207 136 182 M44 197 L54 218 M176 197 L166 218" fill="none" ${outline}/>`;
    case 'chemise': return `<path d="${body}" fill="${['#fff9eb', '#e8f0f4', '#f5e4dc', '#e5eee3', '#f1e8f5', '#f2eddb'][variant % 6]}" ${outline}/><path d="M83 181 L110 197 L91 207 L76 185 M137 181 L110 197 L129 207 L144 185 M110 197 V239" fill="#f0dfbb" ${outline}/><circle cx="115" cy="214" r="2"/><circle cx="115" cy="229" r="2"/>`;
    case 'pull': return `<path d="${body}" fill="${color}" ${outline}/><rect x="83" y="175" width="54" height="23" rx="5" fill="${color}" ${outline}/><path d="M89 179 V193 M99 179 V193 M109 179 V193 M119 179 V193 M129 179 V193 M70 210 L79 217 L70 224 L79 231 M141 210 L150 217 L141 224 L150 231" fill="none" stroke="${a.gender === 'femme' ? '#71374f' : '#245a4b'}" stroke-width="2"/>`;
    case 'veste': return `<path d="${body}" fill="${color}" ${outline}/><path d="M91 182 L110 197 L129 182 L136 239 L84 239Z" fill="#f6ecdd" ${outline}/><path d="M83 181 L69 201 L93 211 L87 221 L107 239 M137 181 L151 201 L127 211 L133 221 L113 239" fill="none" ${outline}/>${a.gender === 'femme' ? '<path d="M94 200 Q110 212 126 200" fill="none" stroke="#b68b43" stroke-width="1.5"/><circle cx="110" cy="206" r="2" fill="#b68b43"/>' : '<path d="M151 223 H174" ' + outline + '/>'}`;
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
  const number = Number.parseInt(character.id.replace(/\D/g, ''), 10) || 1;
  const variant = number * 7 + Math.floor((number - 1) / 4);
  const faces = [
    'M110 51 C80 51 65 72 65 108 Q65 150 110 167 Q155 150 155 108 C155 72 140 51 110 51Z',
    'M110 51 C83 51 70 73 70 109 Q70 151 110 173 Q150 151 150 109 C150 73 137 51 110 51Z',
    'M110 51 C78 51 62 72 63 108 Q63 150 110 164 Q157 150 157 108 C158 72 142 51 110 51Z',
    'M110 51 C81 51 65 72 66 108 Q65 143 96 163 Q110 170 124 163 Q155 143 154 108 C155 72 139 51 110 51Z',
  ];
  const noses = ['M109 113 L105 129 L114 129', 'M110 113 Q103 127 107 129 L115 129', 'M109 113 L107 127 Q110 131 115 128', 'M110 113 Q108 123 104 128 Q109 131 115 128'];
  const mouths = ['M99 141 Q110 147 121 141', 'M100 142 Q110 150 120 142', 'M99 142 Q110 145 121 142', 'M100 140 Q110 147 120 140'];
  const eyebrows = ['M79 98 Q90 93 100 98 M120 98 Q130 93 141 98', 'M79 97 Q89 91 101 96 M119 96 Q131 91 141 97', 'M79 98 Q90 95 101 97 M119 97 Q130 95 141 98', 'M79 97 Q89 94 100 95 M120 95 Q131 94 141 97'];
  const eyeHeight = [8, 7, 8.5, 7.5][variant % 4];
  const wrinkles = a.ageGroup === 'vieux'
    ? '<path d="M91 81 Q110 76 129 81 M94 87 Q110 83 126 87 M77 119 L85 121 M143 119 L135 121 M90 146 L94 140 M130 146 L126 140" fill="none" stroke="#493c36" stroke-width="1.5"/>' : '';
  const earrings = !a.earrings ? '' : a.gender === 'femme'
    ? variant % 2 === 0
      ? '<g fill="none" stroke="#765827" stroke-width="2"><circle cx="58" cy="128" r="4"/><circle cx="162" cy="128" r="4"/></g>'
      : '<g fill="#f1c866" stroke="#765827" stroke-width="1"><circle cx="58" cy="124" r="2.5"/><circle cx="162" cy="124" r="2.5"/><path d="M58 127v3 M162 127v3"/><circle cx="58" cy="132" r="2.5"/><circle cx="162" cy="132" r="2.5"/></g>'
    : '<g fill="#d4dce1" stroke="#55626b" stroke-width="1"><circle cx="58" cy="124" r="2.5"/><circle cx="162" cy="124" r="2.5"/></g>';
  const glasses = a.glasses
    ? `<g fill="none" stroke="#252937" stroke-width="3"><rect x="76" y="101" width="28" height="22" rx="${variant % 2 ? 10 : 5}"/><rect x="116" y="101" width="28" height="22" rx="${variant % 2 ? 10 : 5}"/><path d="M104 109 Q110 105 116 109 M76 108 L65 103 M144 108 L155 103"/></g>` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 280" role="img" aria-labelledby="title-${character.id} desc-${character.id}">
<title id="title-${character.id}">${name} — ${character.id}</title>
<desc id="desc-${character.id}">${escapeXml(describeCharacter(character))}</desc>
<defs><linearGradient id="fond-${character.id}" x2="1" y2="1"><stop stop-color="#e4eef2"/><stop offset="1" stop-color="#f6e3d2"/></linearGradient></defs>
<rect width="220" height="280" rx="18" fill="url(#fond-${character.id})"/>
<circle cx="110" cy="112" r="91" fill="#fff" opacity=".38"/>
<path d="M0 240 H220 V280 H0Z" fill="#fff" opacity=".72"/>
${drawHair(a, true, variant)}
<path d="M92 153 V186 Q110 203 128 186 V153" fill="${skin}" stroke="#34333b" stroke-width="2"/>
${drawClothing(a, variant)}
<g fill="${skin}" stroke="#34333b" stroke-width="2"><ellipse cx="64" cy="109" rx="10" ry="17"/><ellipse cx="156" cy="109" rx="10" ry="17"/><path d="${faces[variant % faces.length]}"/></g>
${drawHair(a, false, variant)}
${wrinkles}
<g fill="#fffaf1" stroke="#34333b" stroke-width="1.5"><ellipse cx="90" cy="112" rx="11" ry="${eyeHeight}"/><ellipse cx="130" cy="112" rx="11" ry="${eyeHeight}"/></g>
<g fill="${eyes}" stroke="#34333b" stroke-width="1"><circle cx="90" cy="112" r="6"/><circle cx="130" cy="112" r="6"/></g>
<g fill="#20242c"><circle cx="90" cy="112" r="2"/><circle cx="130" cy="112" r="2"/></g>
<path d="${eyebrows[variant % eyebrows.length]}" fill="none" stroke="#493c36" stroke-width="2" stroke-linecap="round"/>
<path d="${noses[variant % noses.length]} ${mouths[variant % mouths.length]}" fill="none" stroke="#34333b" stroke-width="2" stroke-linecap="round"/>
${a.gender === 'femme' ? `<path d="${mouths[variant % mouths.length]}" fill="none" stroke="#a95262" stroke-width="2.3" stroke-linecap="round"/><path d="M78 105 L74 102 M142 105 L146 102" fill="none" stroke="#34333b" stroke-width="1.5" stroke-linecap="round"/>` : ''}
${drawFacialHair(a)}
${glasses}
${earrings}
${a.piercing ? '<circle cx="119" cy="126" r="2.5" fill="#dce3e7" stroke="#34333b" stroke-width="1.2"/>' : ''}
<text x="110" y="258" text-anchor="middle" font-family="sans-serif" font-size="18" font-weight="700" fill="#252937">${name}</text>
<text x="110" y="275" text-anchor="middle" font-family="sans-serif" font-size="12" fill="#45434a">${a.gender === 'femme' ? 'Femme' : 'Homme'} · ${a.ageGroup === 'jeune' ? 'Jeune' : 'Vieux'}</text>
</svg>
`;
}
