import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

/**
 * Vite configuration for CloudDrop client.
 *
 * In development, the /api proxy forwards requests to the Express backend
 * running on localhost:5000. This avoids CORS issues during local dev.
 *
 * In production, Nginx handles the /api forwarding to the backend.
 * The React build is served as static files by Nginx.
 */
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: "dist",
    sourcemap: false,
  },
});
