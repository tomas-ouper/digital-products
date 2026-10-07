# PROGRESS · Montessori Play

> Para quien retoma: `git pull`, leé este archivo y `CLAUDE.md`, y seguí desde **Siguiente paso exacto**. Para pasar a una compu local: `PASAR-A-LOCAL.md`.
> Rama de trabajo: `claude/relaxed-galileo-a6yu86` (PR draft hacia `main`). Ver "Decisiones".

## Hitos
- [x] **H1 · Plataforma** — acceso con código, perfiles (3, 6 avatares, edad), "¿Desde dónde juegas?", hub con 5 tarjetas + contador, límite diario + Misión del día (30 misiones), panel de padres con suma, voz es-MX + `voces.csv`, estrellas/progreso/pantalla de nivel superado/sonido on-off.
- [x] **H2 · Snake Lecto** — 17 letras: l o i c a u m (minúscula) · L T O E M A (mayúscula) · l e o a (cursiva). La víbora sigue el dedo (o flechas del teclado), come los puntos en orden; si sale del camino, reinicia la letra. Estrellas según reintentos. 3-5 años: camino más ancho y víbora más lenta. Probado con trazado automático en 390/1024/1440.
- [x] **H3 · Trazo Ninja** — 6 niveles: vocales mayúsculas, vocales minúsculas, consonantes mayúsculas, consonantes minúsculas, sílabas (se dibuja la primera letra) y cursiva. Burbujas con letras vuelan; la voz dice cuál cortar; se reconoce el gesto (uno o varios trazos) contra las plantillas de las letras que están en pantalla. Equivocada: −1. 3-5 años: más lento, menos burbujas, aro brillante en la correcta, más tolerancia.
- [x] **H4 · CaliCrash** — 10 niveles: tacha A/O/M/L, forma SOL/MESA/LUNA, y en cursiva: tacha a, forma sol y casa. Fichas con relieve (sombra, degradé, brillo). Intercambio deslizando (o tocando dos fichas); palabras tocando letras adyacentes (incluye diagonales) en orden. Las letras tachadas muestran una cruz. El tablero siempre tiene la palabra formable y algún movimiento posible. Sin movimientos: "Intentar otra vez". 3-5 años: +6 movimientos y pista a los 5 s.
- [x] **H5 · Angry Forms** — 8 niveles con física Matter: lanza el círculo / el cuadrado, elige el triángulo / la estrella / el rombo (bandeja de formas; la equivocada se nombra en voz alta), derriba solo los círculos / triángulos, formas de 4 lados. Las 6 formas con carita. Gomera con línea de puntería (más larga en 3-5 años, +2 tiros). Sin tiros: "Intentar otra vez".
- [x] **H6 · Montecraft** — 3D en **primera persona** (Three.js): mundo 32x32x16 con plaza, lomas, nieve y árboles; 20 bloques con texturas 16x16 propias; sombreado por cara + oclusión ambiental; nubes, sol, piso infinito con niebla. Mira central con contorno del bloque, mano con el bloque elegido, partículas al romper. Táctil: joystick (mitad izquierda), arrastrar para mirar, tocar = poner, mantener = quitar, botón saltar, subida automática de escalones. PC: WASD/flechas, espacio, 1-9, rueda, clic derecho = quitar, E = inventario. 6 niveles + modo libre: letra L, torre de 10 (cuenta en voz alta), colores (rojo/azul/amarillo; color equivocado no se pone), letra T, tu inicial, tu nombre (hasta 5 letras). Tocar una "sombra" la llena directamente (para los más chicos).
- [ ] **H7 · Pulido y entrega** — hecho: tutorial "Cómo se juega" por juego, cartel "Nivel N", pasada visual de los 5 juegos y el hub, celular en horizontal (pantalla "Gira tu teléfono" + bloqueo de orientación en Android), diseño compacto para celular acostado. Hecho también: **29 planos 9:16** (1080x1920, 30 fps, 4-5 s) en `media/clips/` (5 de plataforma, 4 Snake, 5 Ninja, 4 CaliCrash, 5 Angry Forms, 6 Montecraft) y **tráiler 9:16 de 48 s** con música original en `media/trailer-montessori-play-9x16.mp4`. Guía de planos: `media/PLANOS.md`.

## Retomado en local (07/10/2026)
- Clonado en `~/ads-caligrafia/montessori-play/repo` (Mac M3, Node 25). `npm install && npm run build`: sin errores.
- Nueva prueba de humo `npm run smoke` (`scripts/smoke.mjs`): 5 pantallas + 48 niveles × 4 tamaños → **0 errores, 0 desbordes, todos los juegos arrancan**.
- Montecraft con GPU real (Apple M3, Chromium/Metal, 1024x768, modo libre): **60 fps**, reconstrucción del mundo 19 ms.

## Siguiente paso exacto
Probar en una tablet y un celular reales (voz es-MX, táctil, rendimiento de Montecraft) y mergear el PR a `main` para que Vercel publique. Para regrabar planos: `npm run build && npm run preview` y `node scripts/clips/planos.mjs [filtro]`; tráiler: `node scripts/clips/trailer.mjs`.

## Esfuerzo restante (estimado)
- H2-H6: hecho · H7: S (prueba en dispositivos reales)

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
- **Montecraft**: malla única con caras ocultas eliminadas + oclusión ambiental (mejor rendimiento y look que instanced meshes para el terreno); las "sombras" de las plantillas sí son InstancedMesh. Sin pointer lock (no anda en iframes ni en tablets): se mira arrastrando.
- **Grabación de clips**: reloj virtual propio (`scripts/clips/vt.js`) que reemplaza performance.now/Date.now/rAF/timers y anima el CSS cuadro a cuadro → 30 fps exactos y cámara lenta real aunque la máquina sea lenta (sin GPU). Formato 9:16 1080x1920 (pedido de Tomás). `?rec` desactiva la pantalla "Gira tu teléfono"; la clase `rec-clean` oculta HUD/dedo en planos de cine. Cámaras de cine: Phaser `cameras.main` (zoom/seguimiento), Montecraft `window.__cine`.
- **Guardado**: localStorage con fallback a memoria (`src/core/storage.ts`).

## Problemas abiertos
- No se probó en dispositivos reales (solo Chromium automatizado a 390x844, 844x390, 1024x768, 1440x900 y 540x960). Montecraft: ~25 fps sin GPU (nube), 60 fps con GPU de una Mac M3; falta una tablet media.
- El aviso "Gira tu teléfono" en iOS no puede forzar la orientación (Safari no lo permite): solo lo pide.
- La voz depende de las voces instaladas en el dispositivo (iOS/Android suelen tener es-MX; algunas PC solo es-ES).

## Cómo probar
`npm install && npm run dev` → abrir la URL. Código: `CALIGRAFIA` (o el de `.env`).
