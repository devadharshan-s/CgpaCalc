import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/me": { target: "http://localhost:8080", changeOrigin: true, secure: false },
      "/users": { target: "http://localhost:8080", changeOrigin: true, secure: false },
      "/createUser": { target: "http://localhost:8080", changeOrigin: true, secure: false },
      "/logout": { target: "http://localhost:8080", changeOrigin: true, secure: false },
      // NOTE: OAuth login itself goes directly to :8080 (browser redirect, not fetch)
      // so no proxy needed for /oauth2 — the browser handles it.
    },
  },
});
