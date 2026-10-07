import { defineConfig } from 'vite';

export default defineConfig({
  // Rutas relativas: el build funciona en Vercel, en una subcarpeta o abierto desde un artifact.
  base: './',
  build: {
    target: 'es2020',
    chunkSizeWarningLimit: 2000,
  },
});
