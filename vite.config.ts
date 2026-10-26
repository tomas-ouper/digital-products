import { defineConfig, type Connect, type Plugin } from 'vite';
import { resolve } from 'node:path';

// /en → /en/ (igual que la redirección de vercel.json), en dev y en preview.
const enSlash: Connect.NextHandleFunction = (req, res, next) => {
  const [path, query] = (req.url || '').split('?');
  if (path !== '/en') return next();
  res.statusCode = 302;
  res.setHeader('Location', '/en/' + (query ? '?' + query : ''));
  res.end();
};
const enRedirect: Plugin = {
  name: 'en-redirect',
  configureServer: (s) => void s.middlewares.use(enSlash),
  configurePreviewServer: (s) => void s.middlewares.use(enSlash),
};

export default defineConfig({
  // Rutas relativas: el build funciona en Vercel, en una subcarpeta o abierto desde un artifact.
  base: './',
  plugins: [enRedirect],
  build: {
    target: 'es2020',
    chunkSizeWarningLimit: 2000,
    // Dos entradas con el mismo código: / en español y /en/ en inglés (ver src/core/i18n.ts).
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        en: resolve(__dirname, 'en/index.html'),
      },
    },
  },
});
