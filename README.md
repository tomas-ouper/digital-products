# Montessori Play

Plataforma web de juegos educativos (3 a 8 años) del Kit Caligrafía Montessori. Vite + TypeScript, Phaser 3 (2D) y Three.js (3D). Se abre desde el navegador (PWA), táctil primero.

**Jugar online:** https://montessoriplay.vercel.app · Palabra clave: **CALIGRAFIA**.
**En inglés:** https://montessoriplay.vercel.app/en/ · Palabra clave: **HANDWRITING** (para el Kit en inglés, «Montessori Handwriting»).

MVP gratuito, sin registro de cuentas. Los perfiles y el progreso se guardan en el navegador de cada dispositivo. En **Padres → Soporte y sugerencias** hay un enlace directo a WhatsApp de Tomás para dudas, problemas y propuestas.

## Correr en tu compu
Guía completa para pasar el proyecto a tu compu y seguir con Claude Code: `PASAR-A-LOCAL.md`.

```bash
npm install
npm run dev        # abre http://localhost:5173
npm run build      # genera dist/
npm run preview    # sirve dist/
```
Código de acceso por defecto: **CALIGRAFIA**.

## Cambiar el código de acceso
- Local: copiar `.env.example` a `.env` y cambiar `VITE_ACCESS_CODE` (español) o `VITE_ACCESS_CODE_EN` (inglés).
- Vercel: Project → Settings → Environment Variables → `VITE_ACCESS_CODE` / `VITE_ACCESS_CODE_EN` = el código nuevo → Redeploy.
El código no distingue mayúsculas/minúsculas. Quien ya entró en un dispositivo no lo vuelve a pedir.

## Deploy (Vercel)
Proyecto `montessoriplay` en el equipo `tomas-ouper-s-projects`, plan **Hobby**. Conectado a `tomas-ouper/digital-products`: cada push a `main` publica automáticamente en la misma dirección. Las otras ramas generan vistas previas. El repo tiene `vercel.json` (Vite, salida `dist/`). Antes de subir cambios: `npm run build` y las pruebas que correspondan. No requiere servidor, base de datos ni plan pago para este MVP.

## Versión en inglés (`/en/`)
Mismo código, segunda entrada `en/index.html` (`lang="en"`). `src/core/i18n.ts` lee el idioma del HTML; los textos de la interfaz usan `tr('español', 'english')` y los datos que cambian de contenido (no solo de idioma) usan `pick(ES, EN)`.
- Datos en inglés: `src/data/en/` (frases de la voz, letras, 30 misiones), niveles en `src/games/*/levels.ts`, tutoriales en `src/games/tutorials.ts`.
- Contenido propio del inglés: CaliCrash forma SUN, STAR, LION y en cursiva sun y cake; Trace Ninja cambia «Sílabas» por «First words» (CAT, DOG, SUN…); cursiva con la fuente Playwrite US Trad.
- Nombres: Letter Snake, Trace Ninja, CaliCrash, Angry Shapes, Montecraft.
- Cada idioma guarda aparte en el navegador (`mp:` y `mp-en:`): perfiles, progreso y palabra clave no se mezclan.
- `vercel.json` redirige `/en` → `/en/` (en local lo hace `vite.config.ts`).

## Voces
Las consignas usan la voz del dispositivo (Web Speech API: es-MX en español; en inglés, la variante del navegador o en-US). `voces.csv` y `voces-en.csv` listan cada frase con el nombre de mp3 esperado (`npm run voces` los regenera). Para reemplazar una frase por una grabación: guardar el mp3 en `public/audio/` (inglés: `public/en/audio/`) y agregar su nombre al `available.json` de esa carpeta.

## Juegos
| Juego | Qué enseña | Niveles |
|---|---|---|
| Snake Lecto | trazo de letras en orden y dirección (imprenta minúscula → mayúscula → cursiva) | 17 letras |
| Trazo Ninja | reconocer letras y dibujarlas (reconocimiento de trazo) | 6 |
| CaliCrash | identificar letras y formar palabras (match-3 7x7) | 10 |
| Angry Forms | formas geométricas y contar lados (física) | 8 |
| Montecraft | letras, conteo, colores y su nombre con bloques (3D primera persona) | 6 + modo libre |

En celular se juega en horizontal (la app lo pide y en Android bloquea la orientación).

## Clips para tráiler / anuncios (9:16)
```bash
npm run build && npm run preview          # terminal 1
node scripts/clips/planos.mjs             # terminal 2: graba todos los planos en media/clips/
node scripts/clips/planos.mjs angry       # solo los que contengan "angry"
```
Usa Playwright + ffmpeg. Graba con un reloj virtual (30 fps exactos y cámara lenta real). Guía de planos: `media/PLANOS.md`.

## Estructura
- `src/core/` estado, guardado, voz, sonido, letras (plantillas de trazo), navegación.
- `src/screens/` acceso, perfiles, hub, niveles, juego, misión del día, panel de padres.
- `src/games/<juego>/` cada juego (`levels.ts` + módulo principal).
- `src/data/` frases, misiones (30), nombres de letras.

Ver `PROGRESS.md` para el estado de cada juego.
