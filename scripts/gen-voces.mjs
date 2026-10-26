// Genera voces.csv (español) y voces-en.csv (inglés): una fila por cada frase que dice el juego,
// con el nombre de mp3 esperado.
// Uso: npm run voces
// Para reemplazar la voz sintética: grabar el mp3, guardarlo en public/audio/<archivo> (inglés:
// public/en/audio/<archivo>) y agregar el nombre del archivo al available.json de esa carpeta.
import { readFileSync, writeFileSync } from 'node:fs';

const read = (f) => JSON.parse(readFileSync(f, 'utf8'));

const VALUES_ES = {
  letra: Object.values(read('src/data/letras.json')),
  forma: ['círculo', 'cuadrado', 'triángulo', 'rectángulo', 'rombo', 'estrella'],
  formas: ['círculos', 'cuadrados', 'triángulos', 'rectángulos', 'rombos', 'estrellas'],
  n: ['3', '4', '5', '6', '9', '12'],
  palabra: ['SOL', 'MESA', 'LUNA', 'sol', 'casa'],
  silaba: ['ma', 'me', 'lo', 'lu', 'sa', 'te', 'no', 'pa'],
};

const VALUES_EN = {
  letra: ['A', 'C', 'E', 'I', 'L', 'M', 'N', 'O', 'S', 'T', 'U', 'V'],
  forma: ['circle', 'square', 'triangle', 'rectangle', 'diamond', 'star'],
  formas: ['circles', 'triangles'],
  n: ['4', '6', '9', '12'],
  palabra: ['SUN', 'STAR', 'LION', 'sun', 'cake'],
  silaba: ['cat', 'dog', 'sun', 'hat', 'pig', 'ten', 'mop', 'fan'],
};

const esc = (s) => '"' + String(s).replace(/"/g, '""') + '"';

function generate(dir, VALUES, out) {
const frases = read(`src/data/${dir}frases.json`);
const missions = read(`src/data/${dir}missions.json`);
const rows = [['archivo_mp3', 'texto', 'notas']];

for (const [key, text] of Object.entries(frases)) {
  const vars = [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]);
  if (vars.length === 0) {
    rows.push([key + '.mp3', text, '']);
    continue;
  }
  if (vars.includes('nombre')) {
    rows.push(['(solo voz sintética)', text, 'incluye el nombre del niño']);
    continue;
  }
  // Combinaciones (las frases tienen una o dos variables)
  let combos = [{}];
  for (const v of vars) {
    const vals = VALUES[v] || [];
    combos = combos.flatMap((c) => vals.map((x) => ({ ...c, [v]: x })));
  }
  for (const c of combos) {
    let t = text;
    for (const [k, v] of Object.entries(c)) t = t.split('{' + k + '}').join(v);
    const file = [key, ...vars.map((v) => String(c[v]).toLowerCase())].join('_') + '.mp3';
    rows.push([file, t, '']);
  }
}
for (const m of missions) rows.push(['(solo voz sintética)', m.texto, 'misión ' + m.id]);

writeFileSync(out, rows.map((r) => r.map(esc).join(',')).join('\n') + '\n');
console.log(out + ':', rows.length - 1, 'frases');
}

generate('', VALUES_ES, 'voces.csv');
generate('en/', VALUES_EN, 'voces-en.csv');
