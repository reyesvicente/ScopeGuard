import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  // Django container's published port; the SPA itself only calls /api/.
  const target = env.VITE_DJANGO_URL ?? "http://localhost:8000";
  const toDjango = { target, changeOrigin: false };

  return {
    // Vercel serves the build from the site root (VERCEL=1 during its builds).
    // The Docker image instead has Django + whitenoise serve it from /static/spa/.
    base: command === "build" && !env.VERCEL ? "/static/spa/" : "/",
    plugins: [react(), tailwindcss()],
    server: {
      port: 5173,
      proxy: {
        "/api": toDjango,
        // allauth's headless JSON API (login, signup, logout, email, password).
        "/_allauth": toDjango,
        // allauth login/logout pages and their static assets, so the session
        // cookie is issued on the same origin as the SPA.
        "/accounts": toDjango,
        "/static": toDjango,
      },
    },
  };
});
