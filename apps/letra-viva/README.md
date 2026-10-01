# Letra Viva

Web app del Upsell 1 del Kit Caligrafía Montessori®: fichas personalizadas con el nombre del chico
y juegos interactivos de lectoescritura, organizados en un camino de 21 días.

## Qué hace

- **Perfil en 6 preguntas**: nombre, edad, mano, letras que ya reconoce, intereses, imprenta o cursiva (con el modelo escolar del país).
- **Camino de 21 días**: vocales primero, después las letras de su nombre y luego el orden fonético-silábico. Cada día: 2 fichas y 2–3 juegos, unos 15 minutos.
- **Generador de fichas A4** (SVG, se imprime o se guarda como PDF desde el navegador): su nombre, letra del día, palabras de su mundo, completar la sílaba, unir dibujo y palabra, diploma y cartel para la puerta.
- **5 juegos con voz** (Web Speech API, sin costo): trazar la letra con el dedo, ¿con qué letra empieza?, armar la palabra (empieza por su nombre), memoria y sílabas.
- **Panel de padres**: días completados, racha, estrellas y letras dominadas. Varios hijos por cuenta.

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
3. Opcional: variable `VITE_ACCESS_CODES` con uno o más códigos separados por coma. Si existe, la app pide el código una vez (va en el mail de entrega del upsell).

## Estado y próximos pasos

El MVP guarda todo en el navegador (`localStorage`), así que el progreso no pasa de un dispositivo a otro.
Para producción:

- Login por link mágico y base de datos (Supabase), con alta automática por webhook de Hotmart / Impultienda al aprobarse el pago del upsell o el downsell.
- Más juegos (dictado, leer y elegir el dibujo, cuentos cortos con sus palabras) y audios grabados en lugar de la voz del navegador.
- Instalable como PWA y funcionando sin conexión.
