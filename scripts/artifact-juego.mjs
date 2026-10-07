// Prepara dist/ para publicarlo como página única (sin <html>/<head>): escribe <dir>/index.html
// con el título, la fuente y los assets relativos. Uso: node scripts/artifact-juego.mjs <dir>
import { readFileSync, writeFileSync, mkdirSync, cpSync } from 'node:fs';
import { join } from 'node:path';
const out = process.argv[2];
mkdirSync(out, { recursive: true });
cpSync('dist', out, { recursive: true });
const src = readFileSync('dist/index.html', 'utf8');
const js = src.match(/src="\.\/(assets\/index-[^"]+\.js)"/)[1];
const css = src.match(/href="\.\/(assets\/index-[^"]+\.css)"/)[1];
writeFileSync(
  join(out, 'index.html'),
  `<title>Montessori Play</title>
<link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&family=Playwrite+MX:wght@400&display=swap" rel="stylesheet">
<link rel="stylesheet" href="${css}">
<div id="app"></div>
<script type="module" src="${js}"></script>
`
);
console.log('listo', out, js, css);
