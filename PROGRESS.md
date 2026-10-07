# PROGRESS · Montessori Play

> Para quien retoma: `git pull`, leé este archivo y seguí desde **Siguiente paso exacto**.
> Rama de trabajo: `claude/relaxed-galileo-a6yu86` (PR draft hacia `main`). Ver "Decisiones".

## Hitos
- [x] **H1 · Plataforma** — acceso con código, perfiles (3, 6 avatares, edad), "¿Desde dónde juegas?", hub con 5 tarjetas + contador, límite diario + Misión del día (30 misiones), panel de padres con suma, voz es-MX + `voces.csv`, estrellas/progreso/pantalla de nivel superado/sonido on-off.
- [ ] **H2 · Snake Lecto**
- [ ] **H3 · Trazo Ninja**
- [ ] **H4 · CaliCrash**
- [ ] **H5 · Angry Forms**
- [ ] **H6 · Montecraft**
- [ ] **H7 · Pulido y entrega**

## Siguiente paso exacto
`src/games/snake/snake.ts`: implementar Snake Lecto con Phaser (la víbora sigue el dedo, recorre los trazos de `src/core/letters.ts` comiendo puntos en orden; si se aleja del trazo, reinicia la letra). Después poner `ready: true` en `src/games/registry.ts`.

## Esfuerzo restante (estimado)
- H2: M · H3: M · H4: M · H5: M · H6: L · H7: M

## Decisiones
- **Proyecto en la raíz del repo** (el repo estaba vacío). Vercel lo detecta como Vite; `vercel.json` ya está listo.
- **Rama**: la sesión en la nube solo puede pushear a `claude/relaxed-galileo-a6yu86`; se abre un PR draft a `main`. Al mergearlo, Vercel publica.
- **Código de acceso**: `VITE_ACCESS_CODE` (en `.env` local o en Vercel → Environment Variables). Si no está definido, el código es `CALIGRAFIA`. Es una validación del lado del cliente (alcanza para un MVP; no es seguridad fuerte).
- **Navegación**: TS plano con pantallas en `src/screens/*` y router simple `src/core/nav.ts`. Cada juego se carga con `import()` dinámico (Phaser/Three solo se descargan al entrar al juego).
- **Interfaz de juego común**: `src/games/types.ts` (`start(ctx)` → `{destroy}`; `ctx.complete(estrellas, letras)`). Niveles de cada juego en `src/games/<juego>/levels.ts` (sin dependencias, los usa el hub).
- **Plantillas de letras** compartidas en `src/core/letters.ts` (trazos en orden y dirección; claves `a`, `A`, `c:a` = cursiva). Las usan Snake (camino) y Ninja (reconocimiento).
- **Cursiva**: fuente Google "Playwrite MX" (letra escolar mexicana, licencia OFL).
- **Voz**: `src/core/voice.ts` usa Web Speech (prefiere es-MX → es-US → es-*). Las frases están en `src/data/frases.json`; `npm run voces` regenera `voces.csv` con el nombre de mp3 de cada frase. Para usar un mp3: copiarlo a `public/audio/` y agregarlo en `public/audio/available.json`.
- **Sonidos**: sintetizados con WebAudio (`src/core/sound.ts`), sin archivos → 100 % originales.
- **Tiempo diario**: un solo valor de límite para todos los perfiles (panel de padres, 0 = sin límite), pero se cuenta por perfil. Cuenta en hub, selector de niveles y juego, solo con la pestaña visible. Los padres pueden dar "+10 min solo hoy".
- **Letras dominadas**: se marcan cuando el niño completa una letra en Snake/Ninja con 2+ estrellas.
- **Guardado**: localStorage con fallback a memoria (`src/core/storage.ts`).

## Problemas abiertos
- La voz depende de las voces instaladas en el dispositivo (iOS/Android suelen tener es-MX; algunas PC solo es-ES).
- Íconos PNG para PWA (192/512) pendientes; por ahora el SVG.

## Cómo probar
`npm install && npm run dev` → abrir la URL. Código: `CALIGRAFIA` (o el de `.env`).
