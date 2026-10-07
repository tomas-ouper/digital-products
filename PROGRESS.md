# PROGRESS · Montessori Play

> Para quien retoma: `git pull`, leé este archivo y seguí desde **Siguiente paso exacto**.
> Rama de trabajo: `claude/relaxed-galileo-a6yu86` (PR draft hacia `main`). Ver "Decisiones".

## Hitos
- [x] **H1 · Plataforma** — acceso con código, perfiles (3, 6 avatares, edad), "¿Desde dónde juegas?", hub con 5 tarjetas + contador, límite diario + Misión del día (30 misiones), panel de padres con suma, voz es-MX + `voces.csv`, estrellas/progreso/pantalla de nivel superado/sonido on-off.
- [x] **H2 · Snake Lecto** — 17 letras: l o i c a u m (minúscula) · L T O E M A (mayúscula) · l e o a (cursiva). La víbora sigue el dedo (o flechas del teclado), come los puntos en orden; si sale del camino, reinicia la letra. Estrellas según reintentos. 3-5 años: camino más ancho y víbora más lenta. Probado con trazado automático en 390/1024/1440.
- [x] **H3 · Trazo Ninja** — 6 niveles: vocales mayúsculas, vocales minúsculas, consonantes mayúsculas, consonantes minúsculas, sílabas (se dibuja la primera letra) y cursiva. Burbujas con letras vuelan; la voz dice cuál cortar; se reconoce el gesto (uno o varios trazos) contra las plantillas de las letras que están en pantalla. Equivocada: −1. 3-5 años: más lento, menos burbujas, aro brillante en la correcta, más tolerancia.
- [x] **H4 · CaliCrash** — 10 niveles: tacha A/O/M/L, forma SOL/MESA/LUNA, y en cursiva: tacha a, forma sol y casa. Fichas con relieve (sombra, degradé, brillo). Intercambio deslizando (o tocando dos fichas); palabras tocando letras adyacentes (incluye diagonales) en orden. Las letras tachadas muestran una cruz. El tablero siempre tiene la palabra formable y algún movimiento posible. Sin movimientos: "Intentar otra vez". 3-5 años: +6 movimientos y pista a los 5 s.
- [ ] **H5 · Angry Forms**
- [ ] **H6 · Montecraft**
- [ ] **H7 · Pulido y entrega**

## Siguiente paso exacto
`src/games/angry/angry.ts`: implementar Angry Forms con Phaser + Matter (niveles ya definidos en `src/games/angry/levels.ts`). Después `ready: true` en `src/games/registry.ts`.

## Esfuerzo restante (estimado)
- H2: hecho · H3: hecho · H4: hecho · H5: M · H6: L · H7: M

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
- **Snake**: la víbora va hacia donde está el dedo y, al soltar, termina de llegar (más amable para chicos). "Salirse" = alejarse de cualquier trazo de la letra más que la tolerancia.
- **Ninja**: el reconocedor ($P, `src/core/recognizer.ts`) solo compara contra las letras que están en pantalla → mucho más preciso. Un toque corto cuenta como punto (la i). En sílabas se dibuja la primera letra (dibujar la sílaba entera era demasiado para 6 años).
- **Tests**: con `?debug` en la URL, la escena activa queda en `window.__scene` y `window.mpGo(pantalla, params)` navega (útil para pruebas automáticas con Playwright).
- **Guardado**: localStorage con fallback a memoria (`src/core/storage.ts`).

## Problemas abiertos
- La voz depende de las voces instaladas en el dispositivo (iOS/Android suelen tener es-MX; algunas PC solo es-ES).
- Íconos PNG para PWA (192/512) pendientes; por ahora el SVG.

## Cómo probar
`npm install && npm run dev` → abrir la URL. Código: `CALIGRAFIA` (o el de `.env`).
