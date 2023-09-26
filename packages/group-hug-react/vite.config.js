import { resolve } from "path";
import { defineConfig } from "vite";

export default defineConfig ({
  build: {
    lib: {
      entry: resolve(__dirname, "./index.tsx"),
      name: "@yomo/group-hug-react",
   		 
      fileName: "index",
    },
    rollupOptions: {
      external: ["react"],
    },
  },
});
