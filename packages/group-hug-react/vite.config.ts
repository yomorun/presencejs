import react from '@vitejs/plugin-react-swc';
import { resolve } from "path";
import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [react()],
	resolve: { alias: { '@': resolve(__dirname, './src') } },
	build: {
		lib: {
			entry: resolve(__dirname, "./src/index.tsx"),
			name: "@yomo/group-hug-react",

			fileName: "index",
		},
		rollupOptions: {
			external: ["react"],
		},
	},
});
