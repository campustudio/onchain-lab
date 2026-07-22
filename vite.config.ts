import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";

// Deployed under https://<user>.github.io/onchain-lab/ on GitHub Pages,
// but served from "/" locally and in preview. Override with BASE_PATH if the
// repo is ever renamed or hosted elsewhere.
const base = process.env.BASE_PATH ?? (process.env.GITHUB_ACTIONS ? "/onchain-lab/" : "/");

export default defineConfig({
  base,
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
