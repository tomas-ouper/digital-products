// Genera voces.csv: una fila por cada frase que dice el juego, con el nombre de mp3 esperado.
// Uso: npm run voces
// Para reemplazar la voz sintética: grabar el mp3, guardarlo en public/audio/<archivo> y
// agregar el nombre del archivo a public/audio/available.json.
import { readFileSync, writeFileSync } from 'node:fs';

const frases = JSON.parse(readFileSync('src/data/frases.json', 'utf8'));
const letras = JSON.parse(readFileSync('src/data/letras.json', 'utf8'));
const missions = JSON.parse(readFileSync('src/data/missions.json', 'utf8'));

const VALUES = {
  letra: Object.values(letras),
  forma: ['círculo', 'cuadrado', 'triángulo', 'rectángulo', 'rombo', 'estrella'],
  formas: ['círculos', 'cuadrados', 'triángulos', 'rectángulos', 'rombos', 'estrellas'],
  n: ['3', '4', '5', '6', '9', '12'],
  palabra: ['SOL', 'MESA', 'LUNA', 'sol', 'casa'],
  silaba: ['ma', 'me', 'lo', 'lu', 'sa', 'te', 'no', 'pa'],
};

const rows = [['archivo_mp3', 'texto', 'notas']];
const esc = (s) => '"' + String(s).replace(/"/g, '""') + '"';

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

writeFileSync('voces.csv', rows.map((r) => r.map(esc).join(',')).join('\n') + '\n');
console.log('voces.csv:', rows.length - 1, 'frases');
