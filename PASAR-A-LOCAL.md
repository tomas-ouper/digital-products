# Pasar Montessori Play a tu compu

## 1. Requisitos (una sola vez)
- **Node 22** (o 20+): https://nodejs.org — comprobá con `node -v`.
- **Git** y **Claude Code** instalados.
- Solo para regrabar clips o el tráiler: **ffmpeg** (`brew install ffmpeg` en Mac) y el Chromium de Playwright (`npx playwright install chromium`, se hace en el paso 2).

## 2. Bajar el proyecto
```bash
mkdir -p ~/ads-caligrafia/montessori-play
cd ~/ads-caligrafia/montessori-play
git clone https://github.com/tomas-ouper/digital-products.git repo
cd repo
git checkout claude/relaxed-galileo-a6yu86
npm install
npm run dev
```
Abrí http://localhost:5173 y entrá con el código **CALIGRAFIA**.

> Si ya mergeaste el PR a `main`, saltá el `git checkout`: todo está en `main`.

Para probarlo en la tablet o el celular: con la compu y el dispositivo en la misma red Wi-Fi, abrí en el dispositivo la dirección "Network" que muestra `npm run dev` (por ejemplo `http://192.168.0.10:5173`).

## 3. Seguir con Claude Code
Dentro de la carpeta `repo`, abrí Claude Code (`claude`) y pegá:

```
Estás en el repo de Montessori Play (~/ads-caligrafia/montessori-play/repo), rama claude/relaxed-galileo-a6yu86.
Una sesión en la nube construyó el MVP completo (plataforma + 5 juegos + 29 planos 9:16 + tráiler).
1. git pull.
2. Leé CLAUDE.md, PROGRESS.md y PROMPT-NUBE.md (las reglas siguen valiendo, incluida la de propiedad intelectual y el español con "tú").
3. Corré npm install && npm run build y arreglá lo que esté roto antes de seguir.
4. Seguí desde el "Siguiente paso exacto" de PROGRESS.md, con commit + push y PROGRESS.md actualizado en cada tarea.
Pedime confirmación solo si algo requiere una credencial, gastar dinero o publicar en main.
```

## 4. Lo que queda pendiente (resumen)
- Probar en una **tablet y un celular reales**: voz es-MX, toques, rendimiento de Montecraft.
- Mergear el PR [tomas-ouper/digital-products#2](https://github.com/tomas-ouper/digital-products/pull/2) a `main` para que Vercel publique.
- En Vercel: cargar `VITE_ACCESS_CODE` si querés otro código que no sea CALIGRAFIA.

## 5. Dónde está cada cosa
| Qué | Dónde |
|---|---|
| Estado, decisiones y siguiente paso | `PROGRESS.md` |
| Guía técnica para Claude Code | `CLAUDE.md` |
| Brief original | `PROMPT-NUBE.md` |
| Planos 9:16 (1080x1920) | `media/clips/` |
| Tráiler 48 s con música | `media/trailer-montessori-play-9x16.mp4` |
| Qué planos y por qué | `media/PLANOS.md` |
| Frases de la voz para grabar en mp3 | `voces.csv` |
| Cómo correr y deployar | `README.md` |

## 6. Regrabar clips o tráiler (opcional)
```bash
npm run build
npm run preview          # terminal 1, dejar abierta
npm run planos           # terminal 2: todos los planos (~25 min)
node scripts/clips/planos.mjs ninja   # solo los de Ninja
npm run trailer          # vuelve a montar el tráiler
```
En una compu con placa de video, los scripts igual usan render por software (más lento pero idéntico). Para acelerar, en `scripts/clips/shot.mjs` se pueden sacar los argumentos `--use-angle=swiftshader`.
