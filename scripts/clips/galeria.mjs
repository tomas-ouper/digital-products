// Genera una página HTML con el tráiler y todos los planos (para publicar o abrir local).
// Uso: node scripts/clips/galeria.mjs <carpeta-salida>
import { readdirSync, mkdirSync, writeFileSync, copyFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const out = process.argv[2] || 'media/galeria';
mkdirSync(join(out, 'clips'), { recursive: true });
const files = readdirSync('media/clips').filter((f) => f.endsWith('.mp4')).sort();
for (const f of files) copyFileSync(join('media/clips', f), join(out, 'clips', f));
const trailer = existsSync('media/trailer-montessori-play-9x16.mp4');
if (trailer) copyFileSync('media/trailer-montessori-play-9x16.mp4', join(out, 'trailer.mp4'));

const GROUPS = [
  ['plataforma', 'Plataforma', 'Inicio, tutorial, perfiles, misión del día y estrellas'],
  ['snake', 'Snake Lecto', 'Trazo de letras: imprenta, mayúscula y cursiva'],
  ['ninja', 'Trazo Ninja', 'Cortar la letra dibujándola con el dedo'],
  ['calicrash', 'CaliCrash', 'Match-3 de letras y palabras'],
  ['angry', 'Angry Forms', 'Formas geométricas con física'],
  ['montecraft', 'Montecraft', 'Bloques en 3D, primera persona'],
];
const label = (f) =>
  f
    .replace(/\.mp4$/, '')
    .replace(/^[a-z]+-\d+-/, '')
    .replace(/-/g, ' ')
    .replace(/^\w/, (c) => c.toUpperCase());

const sections = GROUPS.map(([key, name, sub]) => {
  const list = files.filter((f) => f.startsWith(key));
  if (!list.length) return '';
  return `<section class="group">
  <header><h2>${name}</h2><p>${sub} · ${list.length} planos</p></header>
  <div class="grid">${list
    .map(
      (f) => `<figure><video src="clips/${f}" muted loop playsinline preload="metadata" controls></video><figcaption><span>${label(f)}</span><code>${f}</code></figcaption></figure>`
    )
    .join('')}</div>
</section>`;
}).join('\n');

const html = `<title>Clips Montessori Play</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@500;600;700&family=Nunito+Sans:wght@400;600&display=swap" rel="stylesheet">
<style>
/* Layout: tráiler vertical a la izquierda como "teléfono", planos agrupados por juego en grilla vertical */
:root {
  --bg: #fbf6ee; --surface: #ffffff; --fg: #2f3360; --muted: #6a6e93; --accent: #ff7a45; --line: #eadfce;
  --display: 'Fredoka', 'Arial Rounded MT Bold', system-ui, sans-serif;
  --body: 'Nunito Sans', system-ui, -apple-system, sans-serif;
}
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { --bg: #171a2e; --surface: #22264080; --fg: #f2efe8; --muted: #a9acc8; --accent: #ff9a6b; --line: #33385a; color-scheme: dark; } }
:root[data-theme="dark"] { --bg: #171a2e; --surface: #22264080; --fg: #f2efe8; --muted: #a9acc8; --accent: #ff9a6b; --line: #33385a; color-scheme: dark; }
* { box-sizing: border-box; }
body { background: var(--bg); color: var(--fg); font: 16px/1.5 var(--body); padding-inline: 16px; padding-block: 28px 60px; }
.wrap { max-width: 1180px; margin: 0 auto; display: flex; flex-direction: column; gap: 40px; }
.hero { display: grid; grid-template-columns: minmax(0, 340px) minmax(0, 1fr); gap: 36px; align-items: center; }
.phone { border-radius: 34px; padding: 10px; background: var(--fg); box-shadow: 0 24px 60px rgba(30, 30, 60, .25); }
.phone video { width: 100%; aspect-ratio: 9 / 16; border-radius: 26px; display: block; background: #000; }
h1 { font: 700 clamp(34px, 5vw, 58px)/1.02 var(--display); margin: 0 0 14px; text-wrap: balance; }
h1 em { font-style: normal; color: var(--accent); }
.lead { font-size: 18px; color: var(--muted); max-width: 58ch; margin: 0 0 18px; }
.facts { display: flex; flex-wrap: wrap; gap: 8px; padding: 0; margin: 0; list-style: none; }
.facts li { border: 1.5px solid var(--line); border-radius: 999px; padding: 6px 14px; font-weight: 600; font-size: 14px; }
.group header { display: flex; flex-wrap: wrap; align-items: baseline; gap: 6px 14px; border-bottom: 2px solid var(--line); padding-bottom: 10px; margin-bottom: 16px; }
.group h2 { font: 600 28px/1.1 var(--display); margin: 0; }
.group p { margin: 0; color: var(--muted); }
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 170px), 1fr)); gap: 16px; }
figure { margin: 0; display: flex; flex-direction: column; gap: 8px; min-width: 0; }
figure video { width: 100%; aspect-ratio: 9 / 16; border-radius: 16px; background: #000; display: block; }
figcaption { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
figcaption span { font-weight: 600; }
figcaption code { font-size: 12px; color: var(--muted); overflow-wrap: anywhere; }
@media (max-width: 720px) { .hero { grid-template-columns: 1fr; } .phone { max-width: 320px; margin: 0 auto; } }
</style>
<div class="wrap">
  <div class="hero">
    ${trailer ? '<div class="phone"><video src="trailer.mp4" controls playsinline preload="metadata"></video></div>' : ''}
    <div>
      <h1>Montessori Play <em>en acción</em></h1>
      <p class="lead">Tráiler vertical y planos de 4-5 segundos grabados del juego real, listos para Reels, TikTok y el VSL. Formato 9:16, 1080×1920, 30 fps. Los planos no tienen audio; el tráiler trae música original.</p>
      <ul class="facts"><li>${files.length} planos</li><li>5 juegos + plataforma</li><li>Cámara lenta real</li><li>9:16 · 1080×1920</li></ul>
    </div>
  </div>
  ${sections}
</div>
<script>
// reproducir solo los planos visibles
const io = new IntersectionObserver((es) => es.forEach((e) => { const v = e.target; if (v.closest('.grid')) { e.isIntersecting ? v.play().catch(() => {}) : v.pause(); } }), { threshold: 0.4 });
document.querySelectorAll('.grid video').forEach((v) => io.observe(v));
</script>
`;
writeFileSync(join(out, 'index.html'), html);
console.log('galería:', join(out, 'index.html'), files.length, 'planos');
