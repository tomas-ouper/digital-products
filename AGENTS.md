# AGENTS.md

Instrucciones para agentes de código (Codex, Claude Code, etc.) que trabajen en este repo.

## Qué es

Repositorio de productos digitales. Hoy tiene un solo producto:

- `apps/letra-viva`: **Letra Viva**, la web app que se vende como Upsell 1 (USD 24,90; downsell USD 12,47) después de comprar el *Kit Caligrafía Montessori®*. Es para mamás de chicos de 3 a 8 años: arma fichas imprimibles y juegos de lectoescritura con el nombre del chico y con lo que le gusta.

La promesa de venta es la personalización: todo tiene que hablar del mundo del chico (su nombre, su gente, sus temas). Cualquier cambio tiene que reforzar eso.

## Stack y comandos

- Vite 7 + React 19 + TypeScript (strict). Sin router ni librería de estado: ruteo por hash (`#/...`) y un store propio con `useSyncExternalStore`.
- Sin backend todavía. Todo se guarda en `localStorage` (claves `letra-viva:v2` y `letra-viva:accounts`).

```bash
cd apps/letra-viva
npm install
npm run dev      # http://localhost:5173
npm run build    # tsc -b && vite build; tiene que pasar sin errores antes de cada commit
```

No hay tests automáticos ni linter. Verificá a mano en el navegador (o con Playwright) el recorrido que tocaste.

## Mapa del código (`apps/letra-viva/src`)

| Archivo | Qué tiene |
| --- | --- |
| `App.tsx` | Rutas, pestañas (Camino, Juegos, Fichas, Padres), vista del día, fichas listas, panel de padres. Registro de juegos (`GAMES`) y de fichas (`SHEETS`). |
| `lib/store.ts` | Estado: sesión, familias por email, hijos (`Child`), progreso. Acciones en `actions`. |
| `lib/auth.ts` | `AuthAdapter` (signUp, signIn, requestReset). Implementación local `localAuth`. **Acá se enchufa Supabase.** |
| `lib/themes.ts` | Biblioteca de 36 temas (+400 palabras con emoji), `matchInterest` (texto libre → temas), `lookupWord`, sugerencias, relaciones. |
| `lib/content.ts` | `bankFor(child)` (palabras del chico por prioridad y nivel), frases, sílabas, plan de 21 días, utilidades. |
| `lib/fonts.ts` | Tipografías: Andika (imprenta) y Playwrite por país (cursiva). |
| `lib/speech.ts` | Voz del navegador (Web Speech API) y sonidos de letras. |
| `components/Sheet.tsx` | Motor de fichas A4 en SVG (mm): renglones, pautas, paginado, fichas prearmadas y especiales. |
| `pages/Auth.tsx` | Bienvenida post-compra, registro, ingreso, recuperar, vista del mail. |
| `pages/ProfileForm.tsx` | Quiz de 8 pasos (nombre, nivel, escritura, letras, gustos libres, su gente, palabras propias, compañero). |
| `pages/SheetEditor.tsx` | Editor de fichas renglón por renglón (estilo Olesur). |
| `games/GameShell.tsx` | `useGame` (rondas fijas al montar + bloqueo con ref), `usePlayer`, marco con compañero. |
| `games/*.tsx` | 7 juegos: trazar, caza, sonido, leer, completa, armar, memoria. |
| `emails/bienvenida.html` | Mail de bienvenida post-compra (variables `{{EMAIL}}`, `{{LINK}}`). |

## Reglas

- **Idioma**: todo el texto de la app en español con **tuteo neutro** (toca, escucha, elige), nunca voseo, porque se vende en México, Perú, Chile y Ecuador. Comentarios de código en español.
- **Juegos**: armá las rondas con `useGame(() => ...)` y leé el chico con `usePlayer()`. Nunca generes contenido aleatorio en el render ni en un `useMemo` que dependa de props que cambian: ese fue el bug que hacía que los juegos se trabaran al sumar estrellas. Respuestas con `g.right()` / `g.wrong()`.
- **Palabras**: siempre desde `bankFor(child)` / `personalWords(child)`; nada de listas fijas dentro de los juegos.
- **Marcas**: los temas de franquicias (Toy Story, Paw Patrol, Minecraft…) se traducen a palabras genéricas. No agregues nombres de personajes ni imágenes con marca al contenido.
- **Fichas**: todo en SVG con unidades en mm (A4 = 210×297). Medí el texto con `measure()`; no estimes anchos.
- **Tipografías**: sólo con licencia OFL (Google Fonts). Usá `ff(font)` para tener respaldo.
- Mantené los atributos `data-ok`, `data-key` y `data-c` de los juegos: los usan las pruebas automáticas.
- Cambios chicos y enfocados. Corré `npm run build` antes de commitear.

## Pendiente (en orden)

1. **Supabase**: tablas `purchases`, `children`, `progress` con RLS; `AuthAdapter` de Supabase (signUp sólo si el email tiene compra aprobada); mover el store a la base.
2. **Webhook de pago** (Hotmart o Impultienda) en una función de Vercel: registra la compra y envía `emails/bienvenida.html`.
3. **Deploy en Vercel** con Root Directory `apps/letra-viva` (plan Pro: el plan Hobby no permite uso comercial).
4. **Temas con IA** (opcional): función que pide a Claude Haiku 4.5 un paquete de 30 palabras con emoji para un tema desconocido y lo cachea en Supabase por tema.
5. **Contenido**: más juegos (dictado, cuentos cortos con sus palabras), audios grabados en lugar de la voz del navegador, PWA sin conexión.
