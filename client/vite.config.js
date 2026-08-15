import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Forwards to the Worker running under `wrangler dev` (npm run dev in worker/).
      // Only used when VITE_API_BASE_URL is unset; in production the client calls the
      // deployed Worker origin directly.
      "/api": {
        target: "http://127.0.0.1:8787",
        changeOrigin: true,
      },
    },
  },
});
