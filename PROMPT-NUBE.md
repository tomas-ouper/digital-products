# Montessori Play: construir el MVP (prompt original)

Sos el desarrollador único de **Montessori Play**, una plataforma web de juegos educativos para chicos de 3 a 8 años. Se vende como OTO 2 (USD 47, un pago = 12 meses de acceso a todos los juegos) del Kit Caligrafía Montessori, a mamás de México, Perú, Chile y Ecuador. Todo texto y voz dentro del juego va en **español neutro con "tú"**.

## Presupuesto y forma de trabajo (leer primero)
- Trabajás con un saldo limitado y no podés ver cuánto queda. Por eso trabajás por **hitos en orden de prioridad**: cada hito termina con algo jugable, commiteado y pusheado. Si la sesión se corta en cualquier momento, lo hecho tiene que servir.
- **Nunca** dejes `main` roto. Commit + push al terminar cada tarea chica (no acumules).
- Mantené `PROGRESS.md` en la raíz, actualizado en **cada commit**:
  - Checklist de hitos con [x] / [ ].
  - "Siguiente paso exacto" (archivo y tarea).
  - Decisiones tomadas y por qué.
  - Problemas abiertos.
  - Estimación de esfuerzo restante por hito (S/M/L).
- Gastá poco en exploración: no leas archivos grandes sin necesidad, no generes assets pesados, no instales dependencias que no uses. Assets: SVG/canvas procedural, texturas de 16x16 generadas por código.
- Si un hito se complica más de lo previsto, cerralo en su versión mínima jugable, anotá lo pendiente en PROGRESS.md y pasá al siguiente. Un MVP con 5 juegos simples vale más que 1 juego perfecto.
- Al llegar a ~80% de lo que estimás que podés hacer, dejá de agregar cosas: pulí, probá, actualizá PROGRESS.md y README con cómo correr y deployar.

## Stack
- Vite + TypeScript. Hub y navegación en TS simple (sin framework pesado).
- Juegos 2D: **Phaser 3** (Matter.js de Phaser para la física de Angry Forms).
- Juego 3D: **Three.js**.
- PWA, sin descargas: se abre desde el navegador con internet, en tablet, celular o computadora. Táctil primero; mouse/teclado como alternativa. Probar a 390x844, 1024x768 y 1440x900.
- Deploy: el repo está conectado a Vercel (cada push a `main` se publica). Si no lo está, dejá `vercel.json` listo y anotalo.

## Propiedad intelectual (obligatorio)
Todo original: no uses texturas, sonidos, modelos, logos ni nombres de Minecraft, Candy Crush, Fruit Ninja, Angry Birds ni otros juegos. Se inspira en sus mecánicas, nada más. Texturas tipo voxel de 16x16 generadas por código con paleta propia.

## Hitos (en este orden)

### H1 · Plataforma (shell)
1. Pantalla de acceso con código (variable en `.env`, uno solo por ahora).
2. Perfiles: nombre, 6 avatares SVG, edad (3-5 / 6-8: cambia la dificultad). Hasta 3 perfiles en localStorage.
3. "¿Desde dónde juegas?": celular, tablet o computadora. Recomendar tablet.
4. Hub con las tarjetas de los 5 juegos (los no terminados: "Muy pronto") y un contador "5 juegos hoy · +15 para fin de año".
5. Límite diario de 20 min por perfil (configurable). Al cortarse: pantalla "Misión del día" sin pantalla, con 30 misiones en `missions.json` (ej.: "Imprime una ficha de tu Kit y traza la letra M").
6. Panel de padres detrás de una suma (ej. 7 + 5): minutos jugados, racha, letras dominadas, ajuste del límite.
7. Voz: Web Speech API (es-MX) como base + `voces.csv` con cada frase para reemplazar por mp3 después. Los de 3-5 años no leen: toda consigna se dice en voz alta.
8. Sistema común: estrellas por nivel, guardado de progreso por perfil, pantalla de nivel superado, sonido on/off.

Estética: infantil, colores vivos no chillones, tipografía Fredoka, botones grandes (mín. 64 px).

### H2 · Snake Lecto (2D, el más simple)
Viborita. Se muestra una letra grande como camino. La víbora tiene que recorrer el trazo de la letra en la dirección correcta comiendo puntos; si se sale de la forma, pierde y vuelve a empezar esa letra. Imprenta minúscula → mayúscula → cursiva. Mínimo 10 letras jugables.

### H3 · Trazo Ninja (2D)
Tipo "cortar con el dedo": aparecen letras/sílabas volando; la voz dice una y hay que cortarla haciendo **el trazo de esa letra** (motor de reconocimiento de trazo: comparar el gesto con una plantilla de la letra, con tolerancia). Letras equivocadas restan. Mínimo 3 niveles (vocales, consonantes, cursiva).

### H4 · CaliCrash (2D con look 3D)
Match-3 en grilla 7x7 con fichas de letras con relieve (sombras y brillos, look 3D). Objetivos por nivel: "tacha 5 letras A", "forma la palabra SOL" uniendo letras adyacentes, en cursiva en niveles altos. Mínimo 10 niveles.

### H5 · Angry Forms (2D con física)
Catapulta: se lanza una forma geométrica para derribar estructuras hechas de formas. Consigna por voz: "lanza el triángulo", "derriba solo los círculos", contar lados. Formas: círculo, cuadrado, triángulo, rectángulo, rombo, estrella. Mínimo 8 niveles.

### H6 · Montecraft (3D, versión MVP)
Mundo voxel en Three.js con modo creativo: colocar y quitar bloques, inventario de bloques con texturas originales de 16x16, cámara orbital apta para tablet (no primera persona: tocar para poner, mantener para quitar). Niveles Montessori: construir la forma de una letra sobre una plantilla, apilar 10 bloques contando en voz alta, ordenar por colores, escribir su nombre con bloques. Mínimo 5 niveles + modo libre. Rendimiento: mundo chico (32x32x16), instanced meshes, apuntar a 30 fps en una tablet media.

### H7 · Pulido y entrega
- Probar cada juego en los 3 tamaños, sin overflow ni bloqueos táctiles.
- Grabar o capturar GIF de cada juego (para el VSL) en `/media`.
- README: cómo correr, cómo deployar, cómo cambiar el código de acceso.
- PROGRESS.md final con lo que quedó incompleto. **La página de venta va a decir solo lo que exista**, así que sé exacto.

## Si se corta
Lo retoma otra sesión en la compu de Tomás con: "git pull, leé PROGRESS.md y seguí desde el siguiente paso exacto". Escribí PROGRESS.md pensando en esa persona.

---

## Prompt para seguir en la compu local si se frena

Cloná el repo en `~/ads-caligrafia/montessori-play/repo`, abrí Claude Code ahí y pegá:

```
Estás en el repo de Montessori Play (~/ads-caligrafia/montessori-play/repo). Una sesión anterior en la nube lo construyó y se cortó.
1. git pull (rama: claude/relaxed-galileo-a6yu86, o main si ya se mergeó).
2. Leé CLAUDE.md, PROGRESS.md y PROMPT-NUBE.md (las reglas siguen valiendo, incluida la de propiedad intelectual).
3. Corré npm install && npm run build y arreglá lo que esté roto antes de seguir.
4. Seguí desde el "Siguiente paso exacto", hito por hito, con commit + push y PROGRESS.md actualizado en cada tarea.
Trabajá en forma autónoma hasta terminar H7 sin pedirme confirmación, salvo que algo requiera una credencial o gastar dinero.
```
