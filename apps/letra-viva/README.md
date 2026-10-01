# Letra Viva

Web app del Upsell 1 del Kit Caligrafía Montessori®: fichas personalizadas con el nombre del chico
y juegos interactivos de lectoescritura, organizados en un camino de 21 días.

## Qué hace (versión 2)

- **Acceso**: bienvenida post-compra ("¡Felicitaciones por tu compra!"), registro con el correo de la compra y contraseña, ingreso, recuperar contraseña y vista del correo de bienvenida (`emails/bienvenida.html`). En esta versión las cuentas viven en el navegador (`src/lib/auth.ts`); la interfaz `AuthAdapter` es la que se reemplaza por Supabase.
- **Quiz de 8 pasos**: nombre, edad y nivel (empezando / conoce letras / lee palabras), mano y tipo de letra, letras que ya reconoce, **lo que le encanta escrito en texto libre** ("delfines", "Toy Story", "Minecraft"), su gente (mamá, hermanos, mascota…), palabras propias con dibujo y un compañero que lo acompaña en los juegos.
- **Biblioteca de temas** (`src/lib/themes.ts`): 36 temas y más de 400 palabras con dibujo. Reconoce sinónimos, plurales y franquicias (Toy Story → juguetes, Paw Patrol → rescate, Minecraft → bloques) y las traduce a palabras genéricas, sin usar nombres ni imágenes con marca. Lo que no conoce se agrega como palabra propia eligiendo un dibujo.
- **Editor de fichas**: renglón por renglón con tus propias palabras o frases; por renglón eliges modelo y repaso, gris, punteada, contorno, modelo y copia, o vacío; en toda la ficha, letra (imprenta, cursiva por país, mayúsculas), tamaño, pauta (Montessori, doble línea, una línea, cuadrícula) y dibujos. Si no entra en una hoja, pasa a la siguiente.
- **8 fichas listas**: su nombre, letra del día, palabras de su mundo, frases con su gente (nivel 2+), completa la palabra, une dibujo y palabra, diploma y cartel.
- **7 juegos con voz**, todos con sus palabras y su compañero: trazar, caza la letra, ¿con qué empieza?, lee y elige, completa la palabra, arma la palabra (empieza por su nombre) y memoria. La dificultad cambia según el nivel.
- **Camino de 21 días** y **panel de padres** con progreso, racha, letras dominadas, juegos favoritos y varios hijos por cuenta.

Tipografías con licencia OFL (uso comercial permitido): Andika para imprenta y Playwrite (AR, MX, CO, PE, CL, ES) para cursiva.

## Desarrollo

```bash
cd apps/letra-viva
npm install
npm run dev      # http://localhost:5173
npm run build
```

## Deploy en Vercel

1. En Vercel: **Add New → Project**, importar `tomas-ouper/digital-products`.
2. **Root Directory**: `apps/letra-viva`. Vercel detecta Vite solo (`vercel.json` ya está).

## Supabase (próximo paso)

1. Tablas `purchases` (email, producto, estado, fecha), `children` (perfil completo en JSON) y `progress`, con políticas RLS por usuario.
2. Webhook de Hotmart o Impultienda → función que inserta en `purchases` y envía `emails/bienvenida.html` con el link a la app.
3. `AuthAdapter` de Supabase: `signUp` sólo si el correo tiene una compra aprobada; `signIn` con email y contraseña; `requestReset` con el correo de recuperación de Supabase.

## Temas con IA (opcional, para más adelante)

La biblioteca cubre lo más pedido sin costo. Para cualquier otro tema ("Bluey", "camiones de basura"), una función en Vercel puede pedirle a Claude Haiku 4.5 un paquete de 30 palabras con dibujo y guardarlo en Supabase por tema: se genera una sola vez para todas las compradoras. Con precios de USD 1 por millón de tokens de entrada y USD 5 por millón de salida, un paquete cuesta menos de USD 0,01.
