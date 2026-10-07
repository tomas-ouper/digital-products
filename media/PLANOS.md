# Planos para tráiler / anuncios (9:16)

Formato: **1080x1920, 30 fps, 4-5 s por plano**, sin audio (la voz y la música se ponen en edición).
Grabados con el juego real (sin animaciones falsas): reloj virtual cuadro a cuadro, así la cámara lenta es real y no hay saltos.

## Qué tipo de planos usan los tráilers de referencia

> Nota honesta: desde el entorno de trabajo no se pueden reproducir videos de YouTube (sin reproducción de video y con sitios bloqueados por la red). La lista sale de la guía oficial de Apple para videos de vista previa de apps (https://developer.apple.com/support/app-previews/) y de la gramática conocida de esos tráilers. Ningún plano copia arte ni personajes de esos juegos: solo el lenguaje de cámara.

| Referencia | Planos típicos | Cómo lo usamos |
|---|---|---|
| Minecraft (tráilers oficiales) | Sobrevuelo aéreo lento del mundo; primera persona poniendo bloques; *time-lapse* de una construcción; contrapicado (cámara baja) de la obra terminada; paneo lento por el paisaje | Montecraft: vuelo aéreo, primera persona, torre en *time-lapse*, contrapicado del nombre |
| Fruit Ninja | Cámara lenta extrema en el corte; primer plano del jugo/salpicadura; texto de combo que "salta"; cortes rápidos al ritmo | Trazo Ninja: corte en cámara lenta x4 con zoom, salpicadura, "+1" / "−1" |
| Angry Birds | Primer plano de la tensión de la gomera; plano de seguimiento del proyectil; impacto en cámara lenta; plano general del derrumbe | Angry Forms: tensión con zoom, seguimiento, impacto lento, derrumbe con ✓ |
| Candy Crush | Tablero completo; acercamiento a la cascada y al texto de combo ("¡Genial!"); celebración de nivel superado | CaliCrash: tablero, empuje al combo, palabra formada, cursiva |
| Guía de Apple para vistas previas | Mostrar juego real (no escenas armadas); ningún plano de más de ~4 s; cada video muestra algo nuevo; texto en pantalla corto (se ve sin sonido) | Todos los planos son juego real de 4-5 s, cada uno muestra un tipo de nivel distinto |

## Lista de planos grabados (`media/clips/`)

Ver `media/clips/LISTA.md` (se genera al grabar) con el nombre de cada archivo y qué muestra.
Para volver a grabar: `npm run build && npm run preview` y en otra terminal `node scripts/clips/planos.mjs [filtro]`.
