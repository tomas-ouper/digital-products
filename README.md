# Montessori Play

Plataforma web de juegos educativos (3 a 8 años) del Kit Caligrafía Montessori. Vite + TypeScript, Phaser 3 (2D) y Three.js (3D). Se abre desde el navegador (PWA), táctil primero.

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
- Local: copiar `.env.example` a `.env` y cambiar `VITE_ACCESS_CODE`.
- Vercel: Project → Settings → Environment Variables → `VITE_ACCESS_CODE` = el código nuevo → Redeploy.
El código no distingue mayúsculas/minúsculas. Quien ya entró en un dispositivo no lo vuelve a pedir.

## Deploy (Vercel)
El repo tiene `vercel.json` (framework Vite, salida `dist/`). Si el proyecto ya está conectado a Vercel, cada push a `main` publica. Si no: vercel.com → Add New Project → importar el repo → Deploy (no hace falta tocar nada más).

## Voces
Las consignas usan la voz del dispositivo (Web Speech API, es-MX). `voces.csv` lista cada frase con el nombre de mp3 esperado (`npm run voces` lo regenera). Para reemplazar una frase por una grabación: guardar el mp3 en `public/audio/` y agregar su nombre a `public/audio/available.json`.

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
