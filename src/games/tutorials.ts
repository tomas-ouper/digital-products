// Tutorial "Cómo se juega" que aparece al entrar a cada juego.
export interface Tutorial {
  goal: string;
  steps: [string, string][];
  levels: string;
}

export const TUTORIALS: Record<string, Tutorial> = {
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
      ['🔊', 'Escucha qué letra hay que cortar (también está escrita arriba).'],
      ['✍️', 'Dibuja esa letra en cualquier parte de la pantalla, grande y clara.'],
      ['🔪', 'Si tu trazo es la letra correcta, la burbuja se corta: +1.'],
      ['❌', 'Si cortas otra letra, pierdes un punto.'],
      ['🎯', 'Llega a la meta de cortes para pasar de nivel.'],
    ],
    levels: 'Vocales, consonantes, sílabas y cursiva.',
  },
  crash: {
    goal: 'Junta letras iguales para tacharlas y forma palabras.',
    steps: [
      ['↔️', 'Desliza una ficha hacia su vecina para cambiarlas de lugar.'],
      ['✖️', 'Tres letras iguales en línea se tachan y caen fichas nuevas.'],
      ['🔤', 'En los niveles de palabras, toca letras vecinas en orden: S → O → L.'],
      ['👣', 'Mira tus movimientos: se terminan.'],
      ['💡', 'Si te quedas pensando, una ficha brilla para ayudarte.'],
    ],
    levels: '10 niveles: tachar letras, formar SOL, MESA, LUNA y palabras en cursiva.',
  },
  angry: {
    goal: 'Lanza formas con la resortera y derriba las que pide la voz.',
    steps: [
      ['🔊', 'Escucha la consigna: qué forma lanzar o cuáles derribar.'],
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
      ['👀', 'Arrastra el dedo para mirar a tu alrededor.'],
      ['🧱', 'Toca para poner un bloque. Mantén presionado para quitarlo.'],
      ['👻', 'Las sombras blancas muestran dónde va cada bloque: tócalas para llenarlas.'],
      ['🎨', 'Elige el bloque en la barra de abajo. El botón ▦ abre todos los bloques.'],
    ],
    levels: 'Letras con bloques, torre de 10, colores, tu inicial, tu nombre y modo libre.',
  },
};
