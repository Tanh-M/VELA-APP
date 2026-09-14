import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Configuration Vite pour le projet Vela
export default defineConfig({
  plugins: [react()],
  server: {
    // Port fixe : Vite utilisera toujours 5173, jamais un autre
    port: 5173,
    // strictPort empêche Vite de basculer automatiquement sur un autre port
    // si 5173 est déjà occupé — il affichera une erreur claire à la place,
    // ce qui nous permet de le remarquer et de fermer l'ancien processus
    strictPort: true,
  },
});