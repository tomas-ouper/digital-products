# Auditoría de Montessori Play · 7 de octubre de 2026

## Diagnóstico

El MVP tiene una base razonable: juegos separados, importación diferida de Phaser/Three, recursos gráficos originales, guardado por perfil y niveles definidos como datos. El problema principal no es el modelo con el que se escribió: es la distancia entre «el juego carga» y «un niño entiende qué hacer y puede hacerlo». El smoke anterior cubría carga y overflow del DOM, pero no intercambios, trazos, tiros, vuelo, pausas ni legibilidad dentro del canvas.

Se revisaron los cinco juegos, los controles, plantillas/reconocimiento, navegación, persistencia, voz, caché, pantallas y herramientas de prueba. No se sustituyeron los motores ni se añadieron dependencias.

## Hallazgos y cambios

| Área | Problema observado en el código | Cambio |
|---|---|---|
| Montecraft | No existía vuelo; para mirar había que mantener el mouse arrastrando. | Captura del mouse al hacer clic, cámara por movimiento relativo, Escape para liberarlo, inventario con E, vuelo por doble espacio/doble clic o botón. Espacio sube y Shift baja; controles táctiles conservados. |
| Montecraft | El doble clic comparte entrada con quitar/poner bloques. | La acción de clic se demora 300 ms y se cancela ante doble clic. Es una decisión deliberada para evitar romper bloques al activar vuelo. |
| Montecraft | Al salir se liberaban geometrías visibles, pero faltaban materiales, texturas y geometrías almacenadas en mapas; había callbacks que podían sobrevivir a la partida. | Liberación deduplicada de recursos, cancelación de temporizadores/entradas y limpieza de referencias de depuración. |
| Montecraft | Cada raycast asignaba vectores; un rayo paralelo y situado justo en una frontera podía producir NaN por 0 × Infinity. | Vectores reutilizados y manejo explícito de componentes de dirección cero. |
| Ninja | Iniciaba con 2–3 letras en fácil y 3–4 en normal, sin práctica inicial. | Primeros dos aciertos con una sola letra, guía visible y vuelo más lento; después 2 y como máximo 3, espaciadas. |
| Ninja | Las piezas podían desaparecer mientras se dibujaba o se esperaba el reconocimiento. | Movimiento suspendido mientras hay un trazo o reconocimiento pendiente. |
| Ninja | Timers de oleadas anteriores podían seguir activos después de un acierto. | Identificación de ronda y descarte de callbacks obsoletos. |
| Ninja | Se registraba como dominado todo el conjunto del nivel aunque algunas letras nunca hubieran sido dibujadas. | Solo se registran letras realmente acertadas durante la partida. Sigue siendo un indicador de juego, no una evaluación pedagógica. |
| CaliCrash | Dos modos con controles mezclados: arrastrar siempre intentaba intercambiar incluso en palabras. | En palabras, tocar o arrastrar encadena letras; el intercambio se reserva al modo de tres iguales. |
| CaliCrash | Un intercambio sin tres coincidencias volvía atrás con un sonido, sin explicación. | Instrucción persistente y explicación específica de que hacen falta tres iguales. El intento inválido no consume movimientos. |
| CaliCrash | Los colores dependían del orden del conjunto del nivel y cambiaban de significado. | Color estable por letra, cara más uniforme y letras oscuras con borde claro. Las letras siguen identificando cada ficha sin depender solo del color. |
| CaliCrash | El modo palabras resolvía cascadas de match-3, removiendo fichas ajenas a la palabra. | Relleno y garantía de palabra disponible, sin cascadas automáticas de tres iguales en ese modo. |
| Angry Forms | Muchos niveles decían qué lanzar, pero no identificaban visualmente lo que había que derribar. | Aros dorados y flechas sobre objetivos, consigna persistente, contador de objetivos y tiros. |
| Angry Forms | Los movimientos del asentamiento podían contarse como derribos sin disparar. | No se contabilizan derribos antes del primer tiro; referencia de posición tomada al lanzar. |
| Angry Forms | Se penalizaban soportes rectangulares que era necesario tumbar. | Los soportes quedan fuera de esa penalización; las otras formas protegidas dan aviso visible. |
| Angry Forms | La dirección del arrastre podía lanzar hacia atrás. | Arrastre hacia atrás limitado, guía visual, trayectoria y explicación al tirar demasiado poco. |
| Plataforma | Abrir ayuda no pausaba el juego; una pantalla de orientación podía tapar una partida que seguía corriendo. | Pausa compartida para ayuda, orientación, pestaña oculta y final de nivel. |
| Tiempo por perfil | Los segundos aún sin guardar se asignaban al perfil activo, aunque pertenecieran al anterior. | El tramo pendiente conserva su perfil de origen y se vacía al navegar. |
| Voz | Cancelar un MP3 no resolvía su promesa; seguían existiendo callbacks de pantallas abandonadas. | Resolución explícita al cancelar, limpieza del timeout y verificación de que la pantalla sigue conectada. |
| Service worker | Podía cachear HTTP 404/500 y devolver index.html por un JS no disponible. | Solo cachea respuestas válidas; reserva el fallback HTML para navegación. |

## Decisiones conservadas

- Español neutro con tú, nombres y assets propios. No se incorporaron recursos de juegos comerciales.
- Se conserva la modalidad educativa de Ninja: dibujar la letra, no cortar frutas con una raya. La interfaz lo explica explícitamente.
- El match-3 requiere tres iguales; juntar dos por sí solo no basta. Se explica en la partida y en la ayuda.
- Se mantienen Vite + TypeScript, Phaser para 2D y Three para 3D. Separar los motores en cargas diferidas ya era una buena optimización.
- Sin publicación en main: los cambios se preparan en la rama de trabajo del PR existente.

## Limitaciones y próximos pasos, por prioridad

1. **Acceso comercial real:** el código compartido se valida en el cliente; no existe registro de compra ni vencimiento de los 12 meses. Para controlar acceso por comprador hace falta un backend. No se modificó esta arquitectura ni se incorporó un servicio pago.
2. **Prueba humana:** los controles y la comprensión necesitan pruebas con niños y una tablet real. La automatización verifica acciones y errores, pero no certifica facilidad de uso ni voces instaladas en iOS/Android.
3. **Reconocimiento de letras:** faltan muestras reales de trazos infantiles para calibrar tolerancia y distinguir formas parecidas. Conviene medir falsos rechazos y aceptaciones antes de atribuir aprendizaje al contador de letras.
4. **Tamaños táctiles:** una grilla 7×7 no puede mantener celdas de 64 px en todas las pantallas pequeñas. Una adaptación futura puede usar tablero menor por edad o más espacio útil. No se cambió la cantidad de fichas ni los niveles originales.
5. **Persistencia:** perfiles y progreso siguen siendo locales al dispositivo; no hay sincronización ni recuperación si se borra el almacenamiento. El mundo de construcción libre tampoco se guarda.
6. **Motor de CaliCrash:** la generación del tablero y las cascadas siguen siendo aleatorias; conviene extraer las reglas a un módulo puro y agregar un corpus de tableros límite. No se reescribió todo el motor para esta iteración.
7. **Angry Forms:** al cambiar de orientación reinicia el nivel. Falta preservar la partida durante un resize; requiere separar coordenadas de mundo y presentación.
8. **Contenido de venta:** «+15 para fin de año» expresa un compromiso futuro; hoy existen cinco juegos. Los clips/tráiler anteriores muestran la versión previa y deben regrabarse si se usan para mostrar estos cambios.
9. **Rendimiento:** medir Montecraft en una tablet media antes de invertir en chunks o mallado incremental. El terreno actual es pequeño; no se justificó cambiar toda esa estructura sin medición.

## Fuentes técnicas

- [MDN: Pointer Lock API](https://developer.mozilla.org/en-US/docs/Web/API/Pointer_Lock_API): captura por gesto, movimiento relativo y eventos de salida/error. Se conserva arrastre como alternativa si el navegador o un iframe no permite capturar el mouse.
- [Three.js: liberación de objetos](https://threejs.org/manual/pages/how-to-dispose-of-objects.html): geometrías, materiales y texturas tienen ciclos de vida separados.

## Verificación

Los resultados y capturas de esta iteración se guardan en `reports/qa-2026-10-07/`. Los comandos reproducibles son `npm run build`, `node scripts/qa-core.mjs`, `node scripts/qa-interactions.mjs` y `npm run smoke` (los dos últimos necesitan preview en el puerto 4173). Resultados: build correcto; pruebas de reloj/voz/caché aprobadas; nueve comprobaciones de interacción aprobadas sin errores JavaScript; vuelo táctil, inicio fácil y pausa por orientación verificados con eventos táctiles emulados; smoke de los 48 niveles en cuatro tamaños sin errores. Se revisaron capturas de escritorio, tablet y celular horizontal/vertical. La última corrección de ubicación de la consigna de Angry Forms en vertical se verificó después del smoke mediante `npm run qa:touch`.

La captura nativa de mouse fue rechazada en ambos modos headless de Chromium de esta Mac. La alternativa de arrastre y el doble clic sí pasaron. Captura nativa, voz audible y rendimiento en hardware móvil real quedan pendientes de prueba; no se declara una aprobación de iOS/Android a partir de emulación.

Los clips anteriores no se regeneraron. El informe y las capturas documentan esta iteración; el código permanece en el PR en borrador.
