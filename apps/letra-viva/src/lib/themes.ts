// Biblioteca de temas. La mamá escribe lo que le gusta a su hijo con sus palabras
// ("delfines", "Toy Story", "Minecraft") y lo convertimos en palabras con dibujo.
// Las franquicias se traducen a palabras genéricas: no usamos nombres ni imágenes
// de personajes con marca registrada.

export type Word = { w: string; e: string; proper?: boolean; tag?: string }

export type Theme = {
  id: string
  label: string
  e: string
  keys: string[] // palabras clave normalizadas (sin tildes, en minúscula)
  mascots: string[]
  words: Word[]
}

const W = (list: string): Word[] =>
  list.trim().split(/\s*,\s*/).map((pair) => {
    const [w, e] = pair.split(':')
    return { w: w.trim(), e: e.trim() }
  })

export const THEMES: Theme[] = [
  { id: 'mar', label: 'El mar', e: '🐬', mascots: ['🐬', '🐋', '🐙', '🐢', '🧜‍♀️'],
    keys: ['mar', 'oceano', 'delfin', 'pez', 'peces', 'ballena', 'tiburon', 'sirena', 'sirenita', 'nemo', 'moana', 'pulpo', 'acuario', 'submarino'],
    words: W('delfín:🐬, ballena:🐋, pez:🐟, pulpo:🐙, tiburón:🦈, foca:🦭, ola:🌊, barco:⛵, isla:🏝️, cangrejo:🦀, tortuga:🐢, medusa:🪼, caracol:🐚, coral:🪸, sirena:🧜‍♀️, ancla:⚓') },
  { id: 'dinosaurios', label: 'Dinosaurios', e: '🦖', mascots: ['🦖', '🦕'],
    keys: ['dinosaurio', 'dinosaurios', 'dino', 'dinos', 'trex', 't rex', 'jurasico', 'fosil'],
    words: W('dino:🦖, huevo:🥚, hueso:🦴, volcán:🌋, roca:🪨, hoja:🍃, diente:🦷, selva:🌿, huella:🐾, lago:🏞️, meteoro:☄️, palmera:🌴, fósil:🦴, cueva:⛰️') },
  { id: 'espacio', label: 'El espacio', e: '🚀', mascots: ['🚀', '👽', '🧑‍🚀', '🪐'],
    keys: ['espacio', 'planeta', 'planetas', 'astronauta', 'astronautas', 'cohete', 'cohetes', 'estrellas', 'galaxia', 'nasa', 'universo', 'marciano', 'extraterrestre', 'alien', 'stitch'],
    words: W('luna:🌙, sol:☀️, cohete:🚀, nave:🛸, estrella:⭐, planeta:🪐, tierra:🌍, cometa:☄️, astronauta:🧑‍🚀, marciano:👽, telescopio:🔭, satélite:🛰️') },
  { id: 'granja', label: 'La granja', e: '🐮', mascots: ['🐮', '🐷', '🐴', '🐔'],
    keys: ['granja', 'campo', 'vaca', 'vacas', 'caballo', 'caballos', 'gallina', 'gallinas', 'poni', 'pony', 'tractor', 'chancho', 'cerdo'],
    words: W('vaca:🐮, cerdo:🐷, oveja:🐑, gallina:🐔, pollito:🐥, caballo:🐴, pato:🦆, cabra:🐐, conejo:🐰, tractor:🚜, huevo:🥚, maíz:🌽, leche:🥛, burro:🫏') },
  { id: 'selva', label: 'La selva', e: '🦁', mascots: ['🦁', '🐘', '🐵', '🦒'],
    keys: ['selva', 'safari', 'leon', 'leones', 'jirafa', 'elefante', 'elefantes', 'mono', 'monos', 'zoologico', 'zoo', 'tigre', 'rey leon', 'jungla', 'animales salvajes'],
    words: W('león:🦁, tigre:🐯, mono:🐵, jirafa:🦒, elefante:🐘, cebra:🦓, hipopótamo:🦛, loro:🦜, serpiente:🐍, cocodrilo:🐊, gorila:🦍, leopardo:🐆') },
  { id: 'mascotas', label: 'Mascotas', e: '🐶', mascots: ['🐶', '🐱', '🐹', '🐰'],
    keys: ['perro', 'perros', 'gato', 'gatos', 'mascota', 'mascotas', 'cachorro', 'perrito', 'perritos', 'gatito', 'gatitos', 'hamster', 'animales'],
    words: W('perro:🐶, gato:🐱, conejo:🐰, hámster:🐹, pez:🐟, loro:🦜, tortuga:🐢, hueso:🦴, ratón:🐭, pelota:🎾, cama:🛏️, plato:🥣') },
  { id: 'futbol', label: 'Fútbol', e: '⚽', mascots: ['⚽', '🏆'],
    keys: ['futbol', 'futbolista', 'messi', 'pelota', 'gol', 'mundial', 'soccer', 'cancha', 'boca', 'river', 'america', 'seleccion'],
    words: W('pelota:⚽, gol:🥅, copa:🏆, medalla:🏅, camiseta:👕, botín:👟, estadio:🏟️, silbato:📣, campeón:🥇, bandera:🚩, equipo:🧑‍🤝‍🧑, red:🥅') },
  { id: 'deportes', label: 'Deportes', e: '🏀', mascots: ['🏀', '🎾', '🚴'],
    keys: ['deporte', 'deportes', 'basquet', 'basket', 'tenis', 'natacion', 'nadar', 'correr', 'bici', 'bicicleta', 'patinar', 'gimnasia'],
    words: W('básquet:🏀, tenis:🎾, bici:🚲, nadar:🏊, patines:🛼, medalla:🏅, carrera:🏃, casco:⛑️, red:🏐, salto:🤸, meta:🏁') },
  { id: 'princesas', label: 'Princesas', e: '👑', mascots: ['👑', '👸', '🦄'],
    keys: ['princesa', 'princesas', 'reina', 'reinas', 'castillo', 'disney', 'barbie', 'cenicienta', 'rapunzel', 'bella', 'blancanieves'],
    words: W('corona:👑, princesa:👸, rey:🤴, castillo:🏰, vestido:👗, anillo:💍, varita:🪄, espejo:🪞, joya:💎, zapato:👠, rosa:🌹, moño:🎀') },
  { id: 'magia', label: 'Hadas y unicornios', e: '🦄', mascots: ['🦄', '🧚', '🌈'],
    keys: ['unicornio', 'unicornios', 'hada', 'hadas', 'magia', 'magico', 'arcoiris', 'brillo', 'brillos'],
    words: W('unicornio:🦄, hada:🧚, arcoíris:🌈, estrella:⭐, varita:🪄, nube:☁️, brillo:✨, mariposa:🦋, flor:🌸, luna:🌙, poción:🧪, corazón:❤️') },
  { id: 'heroes', label: 'Superhéroes', e: '🦸', mascots: ['🦸', '🕷️', '🦇'],
    keys: ['superheroe', 'superheroes', 'heroe', 'heroes', 'spiderman', 'hombre arana', 'batman', 'superman', 'avengers', 'vengadores', 'hulk', 'marvel', 'ironman', 'capitan america'],
    words: W('héroe:🦸, máscara:🎭, rayo:⚡, escudo:🛡️, araña:🕷️, murciélago:🦇, telaraña:🕸️, ciudad:🏙️, poder:💪, robot:🤖, villano:🦹, capa:🧣') },
  { id: 'autos', label: 'Autos', e: '🚗', mascots: ['🚗', '🏎️', '🚓'],
    keys: ['auto', 'autos', 'autito', 'autitos', 'carro', 'carros', 'carrito', 'carritos', 'coche', 'coches', 'cars', 'mcqueen', 'carrera', 'carreras', 'hot wheels'],
    words: W('auto:🚗, rueda:🛞, moto:🏍️, camión:🚚, bus:🚌, taxi:🚕, meta:🏁, semáforo:🚦, ambulancia:🚑, llave:🔧, mapa:🗺️, garaje:🏠') },
  { id: 'obra', label: 'Camiones y obras', e: '🚜', mascots: ['🚜', '🏗️', '🚚'],
    keys: ['camion', 'camiones', 'construccion', 'construir', 'excavadora', 'grua', 'gruas', 'obra', 'herramientas'],
    words: W('camión:🚚, grúa:🏗️, tractor:🚜, casco:⛑️, martillo:🔨, ladrillo:🧱, pico:⛏️, tornillo:🔩, casa:🏠, obra:🚧, llave:🔧, sierra:🪚') },
  { id: 'trenes', label: 'Trenes', e: '🚂', mascots: ['🚂'],
    keys: ['tren', 'trenes', 'thomas', 'locomotora', 'vias', 'trencito'],
    words: W('tren:🚂, vía:🛤️, vagón:🚃, estación:🚉, boleto:🎫, puente:🌉, humo:💨, reloj:⏰, mapa:🗺️, maleta:🧳') },
  { id: 'aviones', label: 'Aviones', e: '✈️', mascots: ['✈️', '🚁', '🎈'],
    keys: ['avion', 'aviones', 'volar', 'piloto', 'aeropuerto', 'helicoptero'],
    words: W('avión:✈️, piloto:🧑‍✈️, nube:☁️, maleta:🧳, cielo:🌤️, helicóptero:🚁, globo:🎈, paracaídas:🪂, mapa:🗺️, viento:🌬️') },
  { id: 'rescate', label: 'Bomberos y rescate', e: '🚒', mascots: ['🚒', '🐶', '🚓'],
    keys: ['bombero', 'bomberos', 'policia', 'policias', 'rescate', 'paw patrol', 'patrulla canina', 'ambulancia', 'patrulla'],
    words: W('bombero:🧑‍🚒, fuego:🔥, agua:💧, policía:👮, patrulla:🚓, sirena:🚨, perro:🐶, rescate:🛟, casco:⛑️, ambulancia:🚑, escalera:🪜, camión:🚒') },
  { id: 'piratas', label: 'Piratas', e: '🏴‍☠️', mascots: ['🏴‍☠️', '🦜'],
    keys: ['pirata', 'piratas', 'tesoro', 'tesoros', 'barco pirata', 'capitan garfio'],
    words: W('pirata:🏴‍☠️, barco:⛵, tesoro:💰, mapa:🗺️, isla:🏝️, loro:🦜, cofre:🧰, moneda:🪙, espada:🗡️, ancla:⚓, ola:🌊, catalejo:🔭') },
  { id: 'dragones', label: 'Dragones y caballeros', e: '🐉', mascots: ['🐉', '🛡️'],
    keys: ['dragon', 'dragones', 'caballero', 'caballeros', 'medieval', 'como entrenar a tu dragon'],
    words: W('dragón:🐉, caballero:🤺, castillo:🏰, espada:🗡️, fuego:🔥, rey:🤴, caballo:🐴, escudo:🛡️, huevo:🥚, torre:🗼, corona:👑') },
  { id: 'musica', label: 'Música', e: '🎸', mascots: ['🎸', '🎤', '🥁'],
    keys: ['musica', 'cantar', 'canciones', 'cancion', 'guitarra', 'piano', 'tambor', 'bateria', 'cantante'],
    words: W('guitarra:🎸, piano:🎹, tambor:🥁, violín:🎻, nota:🎵, micrófono:🎤, trompeta:🎺, radio:📻, canción:🎶, flauta:🪈') },
  { id: 'baile', label: 'Baile y ballet', e: '🩰', mascots: ['💃', '🩰'],
    keys: ['baile', 'bailar', 'ballet', 'danza', 'bailarina'],
    words: W('ballet:🩰, baile:💃, música:🎵, estrella:⭐, espejo:🪞, moño:🎀, aplauso:👏, vestido:👗, giro:🌀, flor:🌸') },
  { id: 'cocina', label: 'Cocina y postres', e: '🧁', mascots: ['🧁', '🍕', '👩‍🍳'],
    keys: ['cocina', 'cocinar', 'comida', 'postre', 'postres', 'torta', 'pastel', 'helado', 'chef', 'galletas', 'pizza', 'dulces'],
    words: W('torta:🎂, pastel:🍰, helado:🍦, galleta:🍪, pan:🍞, sopa:🍲, pizza:🍕, queso:🧀, huevo:🥚, leche:🥛, miel:🍯, chocolate:🍫, cuchara:🥄, dulce:🍬') },
  { id: 'frutas', label: 'Frutas', e: '🍓', mascots: ['🍓', '🍉', '🍌'],
    keys: ['fruta', 'frutas', 'verdura', 'verduras', 'frutilla', 'fresa', 'banana', 'platano', 'manzana'],
    words: W('manzana:🍎, pera:🍐, uva:🍇, banana:🍌, fresa:🍓, sandía:🍉, limón:🍋, naranja:🍊, piña:🍍, cereza:🍒, kiwi:🥝, coco:🥥, mango:🥭, papa:🥔') },
  { id: 'bichos', label: 'Bichitos', e: '🐞', mascots: ['🐞', '🦋', '🐝'],
    keys: ['bicho', 'bichos', 'bichitos', 'insecto', 'insectos', 'mariposa', 'mariposas', 'hormiga', 'hormigas', 'abeja', 'abejas', 'catarina', 'vaquita', 'mariquita', 'arana', 'aranas', 'caracol'],
    words: W('mariposa:🦋, abeja:🐝, hormiga:🐜, araña:🕷️, caracol:🐌, gusano:🪱, mosca:🪰, grillo:🦗, mariquita:🐞, escarabajo:🪲, flor:🌸, hoja:🍃') },
  { id: 'jardin', label: 'Plantas y flores', e: '🌻', mascots: ['🌻', '🌳', '🌷'],
    keys: ['jardin', 'flor', 'flores', 'planta', 'plantas', 'naturaleza', 'arbol', 'arboles', 'bosque'],
    words: W('flor:🌸, rosa:🌹, girasol:🌻, árbol:🌳, hoja:🍃, semilla:🌱, maceta:🪴, sol:☀️, lluvia:🌧️, tulipán:🌷, hongo:🍄, nube:☁️') },
  { id: 'aves', label: 'Pájaros', e: '🦉', mascots: ['🦉', '🐧', '🦜'],
    keys: ['pajaro', 'pajaros', 'ave', 'aves', 'loro', 'loros', 'buho', 'buhos', 'pinguino', 'pinguinos', 'flamenco'],
    words: W('pájaro:🐦, loro:🦜, búho:🦉, pingüino:🐧, pato:🦆, pollito:🐥, águila:🦅, flamenco:🦩, cisne:🦢, nido:🪺, pluma:🪶, huevo:🥚') },
  { id: 'nieve', label: 'Nieve y hielo', e: '⛄', mascots: ['⛄', '🐧', '❄️'],
    keys: ['nieve', 'invierno', 'frozen', 'hielo', 'elsa', 'olaf', 'ana y elsa'],
    words: W('nieve:❄️, hielo:🧊, muñeco:⛄, bufanda:🧣, guante:🧤, trineo:🛷, reno:🦌, pingüino:🐧, castillo:🏰, reina:👸, oso:🐻‍❄️, copo:❄️') },
  { id: 'playa', label: 'Playa y verano', e: '🏖️', mascots: ['🦀', '🏖️', '🐚'],
    keys: ['playa', 'verano', 'vacaciones', 'pileta', 'piscina', 'alberca', 'arena'],
    words: W('playa:🏖️, balde:🪣, sol:☀️, ola:🌊, helado:🍦, lentes:🕶️, concha:🐚, pelota:🏐, sombrilla:⛱️, nadar:🏊, cangrejo:🦀, barco:⛵') },
  { id: 'robots', label: 'Robots y ciencia', e: '🤖', mascots: ['🤖', '🔬'],
    keys: ['robot', 'robots', 'ciencia', 'cientifico', 'inventos', 'experimentos', 'tecnologia'],
    words: W('robot:🤖, imán:🧲, cohete:🚀, lupa:🔍, foco:💡, pila:🔋, tubo:🧪, engranaje:⚙️, átomo:⚛️, botón:🔘, rayo:⚡, antena:📡') },
  { id: 'bloques', label: 'Bloques y aventuras', e: '⛏️', mascots: ['🧱', '⛏️', '🐷'],
    keys: ['minecraft', 'bloques', 'bloque', 'roblox', 'lego', 'legos', 'videojuego', 'videojuegos', 'cubos'],
    words: W('bloque:🧱, pico:⛏️, espada:🗡️, diamante:💎, cerdo:🐷, oveja:🐑, zombi:🧟, árbol:🌳, casa:🏠, cofre:🧰, lava:🌋, mapa:🗺️, mina:⛏️, cueva:⛰️') },
  { id: 'juguetes', label: 'Juguetes', e: '🧸', mascots: ['🤠', '🧸', '🧑‍🚀'],
    keys: ['toy story', 'juguete', 'juguetes', 'woody', 'buzz', 'munecos', 'muneca', 'munecas', 'peluche', 'peluches'],
    words: W('vaquero:🤠, astronauta:🧑‍🚀, dino:🦖, cerdito:🐷, muñeca:🪆, osito:🧸, robot:🤖, caballo:🐴, cohete:🚀, bota:👢, estrella:⭐, pelota:🏀, yoyó:🪀') },
  { id: 'familia', label: 'La familia', e: '👪', mascots: ['🐷', '🐶', '👪'],
    keys: ['familia', 'peppa', 'peppa pig', 'bluey', 'cerdita', 'cerdito', 'hermanos', 'abuelos'],
    words: W('mamá:👩, papá:👨, bebé:👶, abuela:👵, abuelo:👴, hermano:👦, hermana:👧, casa:🏠, perro:🐶, bici:🚲, charco:💧, lluvia:🌧️, bota:👢') },
  { id: 'criaturas', label: 'Criaturas y poderes', e: '⚡', mascots: ['⚡', '🐉', '🐢'],
    keys: ['pokemon', 'pikachu', 'criaturas', 'monstruos', 'monstruo', 'poderes'],
    words: W('rayo:⚡, fuego:🔥, agua:💧, hoja:🍃, roca:🪨, ratón:🐭, dragón:🐉, tortuga:🐢, estrella:⭐, huevo:🥚, hielo:🧊, nube:☁️') },
  { id: 'aventura', label: 'Hongos y monedas', e: '🍄', mascots: ['🍄', '⭐', '🦔'],
    keys: ['mario', 'mario bros', 'nintendo', 'sonic', 'luigi'],
    words: W('hongo:🍄, estrella:⭐, moneda:🪙, castillo:🏰, tortuga:🐢, flor:🌸, bloque:🧱, princesa:👸, dragón:🐉, fuego:🔥, anillo:💍, erizo:🦔') },
  { id: 'circo', label: 'Circo y magia', e: '🎪', mascots: ['🤡', '🎩', '🐰'],
    keys: ['circo', 'payaso', 'payasos', 'malabares', 'mago', 'trucos'],
    words: W('payaso:🤡, carpa:🎪, globo:🎈, elefante:🐘, león:🦁, mago:🎩, conejo:🐰, aplauso:👏, pochoclo:🍿, nariz:🔴, cuerda:🪢') },
  { id: 'fiestas', label: 'Fiestas', e: '🎁', mascots: ['🎅', '🎁', '🎈'],
    keys: ['navidad', 'papa noel', 'santa', 'cumpleanos', 'cumple', 'fiesta', 'fiestas', 'halloween', 'pascua'],
    words: W('regalo:🎁, árbol:🎄, estrella:⭐, campana:🔔, reno:🦌, galleta:🍪, vela:🕯️, globo:🎈, torta:🎂, gorro:🎅, nieve:❄️, calabaza:🎃') },
  { id: 'arte', label: 'Dibujar y pintar', e: '🎨', mascots: ['🎨', '🖍️'],
    keys: ['dibujar', 'dibujo', 'pintar', 'arte', 'colores', 'manualidades', 'colorear'],
    words: W('lápiz:✏️, pincel:🖌️, pintura:🎨, tijera:✂️, papel:📄, crayón:🖍️, cuadro:🖼️, regla:📏, sello:📮, color:🌈') },
]

// Palabras de la casa: siempre disponibles para completar.
export const HOME_WORDS: Word[] = W(
  'mamá:👩, papá:👨, casa:🏠, mesa:🍽️, sopa:🍲, mano:✋, pie:🦶, uva:🍇, manzana:🍎, pera:🍐, auto:🚗, tren:🚂, ' +
  'bebé:👶, cama:🛏️, taza:☕, nube:☁️, flor:🌸, ojo:👁️, dado:🎲, lápiz:✏️, libro:📖, pan:🍞, helado:🍦, tomate:🍅, ' +
  'abeja:🐝, avión:✈️, árbol:🌳, elefante:🐘, erizo:🦔, iguana:🦎, iglú:🛖, imán:🧲, oveja:🐑, oreja:👂, uno:1️⃣, uña:💅, ' +
  'fresa:🍓, galleta:🍪, jugo:🧃, zapato:👞, yoyó:🪀, kiwi:🥝, queso:🧀, sol:☀️, luna:🌙, gato:🐱, perro:🐶, pato:🦆, oso:🐻',
)

export function norm(s: string) {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9ñ ]/g, '').replace(/\s+/g, ' ').trim()
}

function singular(s: string) {
  if (s.endsWith('ces')) return s.slice(0, -3) + 'z'
  if (s.endsWith('es') && s.length > 4) return s.slice(0, -2)
  if (s.endsWith('s') && s.length > 3) return s.slice(0, -1)
  return s
}

// Diccionario palabra → dibujo, armado con todas las palabras de la biblioteca.
const DICT = new Map<string, Word>()
for (const t of THEMES) for (const w of t.words) if (!DICT.has(norm(w.w))) DICT.set(norm(w.w), { ...w, tag: t.id })
for (const w of HOME_WORDS) if (!DICT.has(norm(w.w))) DICT.set(norm(w.w), w)

/** Busca el dibujo de una palabra cualquiera ("delfines" → 🐬). */
export function lookupWord(text: string): Word | undefined {
  const n = norm(text)
  return DICT.get(n) ?? DICT.get(singular(n))
}

export type Match = { input: string; themes: Theme[]; word?: Word }

/** Interpreta lo que escribió la mamá: qué temas abre y si además es una palabra conocida. */
export function matchInterest(input: string): Match {
  const n = norm(input)
  const tokens = n.split(' ').flatMap((t) => [t, singular(t)])
  const themes = THEMES.filter((t) =>
    t.keys.some((k) => (k.includes(' ') ? n.includes(k) : tokens.includes(k) || tokens.includes(singular(k)))),
  )
  const word = lookupWord(input) ?? tokens.map((t) => DICT.get(t)).find(Boolean)
  if (!themes.length && word?.tag) {
    const t = THEMES.find((x) => x.id === word.tag)
    if (t) themes.push(t)
  }
  return { input, themes, word }
}

export const themeById = (id: string) => THEMES.find((t) => t.id === id)

// Sugerencias rápidas para el quiz (lo más pedido).
export const SUGGESTED = ['dinosaurios', 'el mar', 'princesas', 'fútbol', 'Minecraft', 'Toy Story', 'unicornios', 'autos', 'superhéroes', 'perros', 'Frozen', 'el espacio', 'Paw Patrol', 'Peppa Pig', 'Pokémon', 'bichitos']

// Paleta para elegir un dibujo cuando la palabra no está en la biblioteca.
export const EMOJI_PALETTE = '🐶 🐱 🐰 🐻 🐼 🦊 🐸 🐵 🦁 🐯 🐮 🐷 🐔 🐧 🦄 🐬 🐟 🦖 🐢 🦋 🐞 🌸 🌳 🌈 ⭐ 🌙 ☀️ ❄️ 🔥 💧 🍎 🍓 🍌 🍕 🍦 🎂 🍪 ⚽ 🏀 🎸 🎨 🚗 🚂 ✈️ 🚀 🏠 🏰 👑 🎁 🎈 ❤️ 🧸 🤖 📚 ✏️ 👧 👦 👩 👨 👵 👴'.split(' ')

export const RELATIONS: { id: string; label: string; e: string }[] = [
  { id: 'mama', label: 'Mamá', e: '👩' }, { id: 'papa', label: 'Papá', e: '👨' },
  { id: 'hermana', label: 'Hermana', e: '👧' }, { id: 'hermano', label: 'Hermano', e: '👦' },
  { id: 'abuela', label: 'Abuela', e: '👵' }, { id: 'abuelo', label: 'Abuelo', e: '👴' },
  { id: 'perro', label: 'Su perro', e: '🐶' }, { id: 'gato', label: 'Su gato', e: '🐱' },
  { id: 'mascota', label: 'Otra mascota', e: '🐰' }, { id: 'amigo', label: 'Amigo o amiga', e: '🧒' },
  { id: 'maestra', label: 'Su maestra', e: '👩‍🏫' }, { id: 'otro', label: 'Otra persona', e: '🙂' },
]
