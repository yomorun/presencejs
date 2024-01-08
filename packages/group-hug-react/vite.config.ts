import react from '@vitejs/plugin-react-swc';
import { resolve } from 'path';
import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
  base: './',
  plugins: [react()],
  resolve: { alias: { '@': resolve(__dirname, './src') } },
  build: {
    lib: {
      entry: './src/index.tsx',
      name: '@yomo/group-hug-react',

      fileName: 'index',
      formats: ['es', 'cjs'],
    },
    sourcemap: true,
    rollupOptions: {
      external: ['react', 'react-dom'],
    },
  },
});
