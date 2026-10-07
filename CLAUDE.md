# Montessori Play — guía para Claude Code

Plataforma web de 5 juegos educativos (3 a 8 años) que se vende como OTO 2 del Kit Caligrafía Montessori.
Antes de tocar nada: leé `PROGRESS.md` (estado, decisiones, siguiente paso) y `PROMPT-NUBE.md` (brief original).

## Reglas que no se negocian
- Todo texto y voz del juego en **español neutro con "tú"**. Los comentarios del código y los docs, en español.
- **Propiedad intelectual**: nada de texturas, sonidos, modelos, logos ni nombres de Minecraft, Candy Crush, Fruit Ninja, Angry Birds u otros. Se copia mecánica y lenguaje de cámara, nunca el arte. Assets procedurales (SVG, canvas, WebAudio).
- La página de venta dice solo lo que existe: si algo no está hecho, `PROGRESS.md` lo dice.
- Botones de 64 px mínimo, táctil primero. En celular se juega en **horizontal**.
- `PROGRESS.md` se actualiza en cada commit (checklist, siguiente paso exacto, decisiones, problemas).

## Comandos
```bash
npm install
npm run dev        # http://localhost:5173 — código de acceso: CALIGRAFIA
npm run build      # tsc --noEmit + vite build → dist/ (correrlo antes de cada commit)
npm run preview    # sirve dist/ en :4173 (lo usan los scripts de clips)
npm run voces      # regenera voces.csv desde src/data/frases.json
npm run planos     # graba los planos 9:16 en media/clips/ (necesita preview corriendo)
npm run trailer    # monta media/trailer-montessori-play-9x16.mp4
```

## Mapa del código
- `src/main.ts` registra pantallas; `src/core/nav.ts` router + reloj del límite diario.
- `src/core/`: `state.ts` (perfiles, progreso, ajustes en localStorage), `voice.ts` (Web Speech es-MX + mp3 opcionales), `sound.ts` (efectos WebAudio), `letters.ts` (plantillas de trazo de letras, claves `a`, `A`, `c:a` = cursiva), `recognizer.ts` (reconocedor de trazos $P).
- `src/screens/`: acceso, dispositivo, perfiles, hub, niveles, juego (`play.ts`: tutorial, cartel de nivel, "Gira tu teléfono", overlay de estrellas), misión del día, padres.
- `src/games/<juego>/`: `levels.ts` (datos, sin dependencias) + módulo principal con `start(ctx) → {destroy}`. Registro en `src/games/registry.ts`, tutoriales en `tutorials.ts`, portadas SVG en `art.ts`.
  - `snake` (Phaser), `ninja` (Phaser), `crash` (Phaser), `angry` (Phaser + Matter), `craft` (Three.js, `world.ts` = vóxeles, texturas 16x16 y mallado con AO).
- `src/data/`: `frases.json` (todo lo que dice la voz), `missions.json` (30), `letras.json`.

## Pruebas
No hay suite de tests: se prueba jugando con bots en Chromium (Playwright).
- Con `?debug` en la URL: `window.mpGo(pantalla, params)` navega y la escena activa queda en `window.__scene` (Phaser) o `window.__craft` (Montecraft).
- Tamaños a revisar: 390x844, 844x390, 1024x768, 1440x900.
- Los bots de `scripts/clips/planos.mjs` muestran cómo jugar cada juego por código.

## Clips y tráiler (`scripts/clips/`)
- `vt.js`: reloj virtual inyectado en la página (performance.now, Date.now, rAF, timers y animaciones CSS avanzan cuadro a cuadro) → 30 fps exactos y cámara lenta real aunque la máquina sea lenta.
- `shot.mjs`: clase `Shot` (abrir, `skip`, `roll`, `frame`, `tap`, cámara, `finish` con ffmpeg). Formato 9:16, 540x960 a escala 2.
- `planos.mjs`: guion de los 29 planos; `node scripts/clips/planos.mjs angry` graba solo los que contienen "angry".
- `trailer.mjs` (montaje), `placas.html` (intro, rótulos, cierre), `musica.mjs` (música sintetizada), `galeria.mjs` (página con todos los clips).
- Trampas conocidas: con el reloj virtual **no usar `page.click()`** (se cuelga: Playwright espera rAF); usar `sh.tap()`. No recompilar `dist/` mientras se graba. `?rec` desactiva "Gira tu teléfono"; la clase `rec-clean` oculta HUD y dedo. Con zoom de cámara de Phaser, el input del mouse queda desfasado: los bots manejan el juego por código.

## Deploy
Vercel con `vercel.json` (Vite → `dist/`). Cada push a `main` publica. Código de acceso: variable `VITE_ACCESS_CODE` (por defecto `CALIGRAFIA`).
