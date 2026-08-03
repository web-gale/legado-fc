import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  // Relative assets work on both username.github.io and project subpaths.
  base: "./",
  plugins: [react()],
  build: {
    outDir: "dist",
    emptyOutDir: true,
    sourcemap: false,
    rollupOptions: {
      // The repository root contains GitHub Pages' compiled index.html.
      // Keep a separate source entry so repeated builds always compile React.
      input: "app.html",
    },
  },
});
