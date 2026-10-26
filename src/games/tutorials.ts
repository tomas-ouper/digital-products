// Tutorial "Cómo se juega" que aparece al entrar a cada juego.
import { pick } from '../core/i18n';

export interface Tutorial {
  goal: string;
  steps: [string, string][];
  levels: string;
}

const TUTORIALS_ES: Record<string, Tutorial> = {
  snake: {
    goal: 'Escribe letras llevando a la viborita por el trazo de cada letra.',
    steps: [
      ['👆', 'Arrastra a la viborita con tu dedo. En la compu también puedes usar las flechas.'],
      ['⭐', 'Empieza siempre en la estrella y sigue la flecha azul.'],
      ['🟠', 'Come los puntos naranjas en orden: así escribes la letra en la dirección correcta.'],
      ['⚠️', 'Si te sales del camino blanco, la letra empieza otra vez.'],
      ['🏆', 'Sin salirte ganas 3 estrellas.'],
    ],
    levels: '17 letras: minúsculas → mayúsculas → cursiva.',
  },
  ninja: {
    goal: 'Corta la letra que dice la voz dibujándola con tu dedo.',
    steps: [
      ['🔊', 'Empieza con una sola letra y una guía para practicar sin apuro.'],
      ['✍️', 'Dibuja la letra, no solo una raya sobre ella. Mientras trazas, las letras esperan.'],
      ['🔪', 'Si tu trazo es la letra correcta, la burbuja se corta: +1.'],
      ['❌', 'Si cortas otra letra, pierdes un punto.'],
      ['🎯', 'Llega a la meta de cortes para pasar de nivel.'],
    ],
    levels: 'Vocales, consonantes, sílabas y cursiva.',
  },
  crash: {
    goal: 'Junta letras iguales para tacharlas y forma palabras.',
    steps: [
      ['↔️', 'Cambia dos fichas vecinas para dejar TRES letras iguales en una fila o columna.'],
      ['✖️', 'Tres letras iguales en línea se tachan y caen fichas nuevas.'],
      ['🔤', 'En palabras, toca o arrastra por letras vecinas en orden: S → O → L.'],
      ['👣', 'Mira tus movimientos: se terminan.'],
      ['💡', 'Si te quedas pensando, una ficha brilla para ayudarte.'],
    ],
    levels: '10 niveles: tachar letras, formar SOL, MESA, LUNA y palabras en cursiva.',
  },
  angry: {
    goal: 'Lanza formas con la resortera y derriba las que pide la voz.',
    steps: [
      ['🔊', 'Derriba las formas marcadas con aro dorado y flecha. El contador muestra cuántas faltan.'],
      ['🔺', 'Si aparecen formas abajo, elige la que te piden.'],
      ['🎯', 'Jala la forma hacia atrás y suéltala. Los puntitos muestran el camino.'],
      ['✅', 'Cada forma derribada se marca con un ✓.'],
      ['🧠', 'En "derriba solo…", intenta no tirar las otras formas.'],
    ],
    levels: '8 niveles: círculo, cuadrado, triángulo, rectángulo, rombo y estrella; contar lados.',
  },
  craft: {
    goal: 'Construye con bloques en un mundo 3D que recorres en primera persona.',
    steps: [
      ['🕹️', 'Camina con el joystick (mitad izquierda). En la compu: W A S D o flechas.'],
      ['👀', 'En la compu, haz clic para capturar el mouse y muévelo para mirar. Escape libera el cursor. En táctil, arrastra.'],
      ['🕊️', 'Doble clic o doble espacio activa el vuelo. Espacio sube y Shift baja. En táctil usa Volar y las flechas.'],
      ['🧱', 'Con mouse capturado: clic quita, clic derecho pone. En táctil: toca para poner y mantén para quitar.'],
      ['👻', 'Las sombras blancas muestran dónde va cada bloque: tócalas para llenarlas.'],
      ['🎨', 'Elige el bloque en la barra de abajo. El botón ▦ abre todos los bloques.'],
    ],
    levels: 'Letras con bloques, torre de 10, colores, tu inicial, tu nombre y modo libre.',
  },
};

const TUTORIALS_EN: Record<string, Tutorial> = {
  snake: {
    goal: 'Write letters by guiding the little snake along each letter.',
    steps: [
      ['👆', 'Drag the little snake with your finger. On a computer you can also use the arrow keys.'],
      ['⭐', 'Always start at the star and follow the blue arrow.'],
      ['🟠', 'Eat the orange dots in order: that is how you write the letter in the right direction.'],
      ['⚠️', 'If you leave the white path, the letter starts over.'],
      ['🏆', 'Stay on the path to win 3 stars.'],
    ],
    levels: '17 letters: lowercase → uppercase → cursive.',
  },
  ninja: {
    goal: 'Cut the letter the voice says by drawing it with your finger.',
    steps: [
      ['🔊', 'Start with just one letter and a guide, so you can practice without rushing.'],
      ['✍️', 'Draw the letter, not just a line over it. Letters wait while you trace.'],
      ['🔪', 'If your stroke is the right letter, the bubble is cut: +1.'],
      ['❌', 'If you cut a different letter, you lose a point.'],
      ['🎯', 'Reach the goal number of cuts to finish the level.'],
    ],
    levels: 'Vowels, consonants, first words and cursive.',
  },
  crash: {
    goal: 'Match letters to cross them out and make words.',
    steps: [
      ['↔️', 'Swap two neighboring tiles to get THREE matching letters in a row or column.'],
      ['✖️', 'Three matching letters in a line get crossed out and new tiles fall in.'],
      ['🔤', 'For words, tap or drag across neighboring letters in order: S → U → N.'],
      ['👣', 'Watch your moves: they run out.'],
      ['💡', 'If you get stuck, a tile will glow to help you.'],
    ],
    levels: '10 levels: cross out letters, make SUN, STAR, LION and words in cursive.',
  },
  angry: {
    goal: 'Throw shapes with the slingshot and knock down the ones the voice asks for.',
    steps: [
      ['🔊', 'Knock down the shapes with a gold ring and an arrow. The counter shows how many are left.'],
      ['🔺', 'If there are shapes at the bottom, pick the one you are asked for.'],
      ['🎯', 'Pull the shape back and let go. The little dots show the path.'],
      ['✅', 'Every shape you knock down gets a ✓.'],
      ['🧠', 'In "knock down only…", try not to hit the other shapes.'],
    ],
    levels: '8 levels: circle, square, triangle, rectangle, diamond and star; counting sides.',
  },
  craft: {
    goal: 'Build with blocks in a 3D world you explore in first person.',
    steps: [
      ['🕹️', 'Walk with the joystick (left half of the screen). On a computer: W A S D or the arrow keys.'],
      ['👀', 'On a computer, click to capture the mouse and move it to look around. Escape releases the cursor. On touch screens, drag.'],
      ['🕊️', 'Double click or double space turns on flying. Space goes up and Shift goes down. On touch screens, use Fly and the arrows.'],
      ['🧱', 'With the mouse captured: click removes, right click places. On touch screens: tap to place, press and hold to remove.'],
      ['👻', 'White shadows show where each block goes: tap them to fill them in.'],
      ['🎨', 'Pick a block in the bar at the bottom. The ▦ button opens all the blocks.'],
    ],
    levels: 'Letters with blocks, a tower of 10, colors, your initial, your name and free mode.',
  },
};

export const TUTORIALS: Record<string, Tutorial> = pick(TUTORIALS_ES, TUTORIALS_EN);
