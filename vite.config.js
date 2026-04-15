import { defineConfig } from "vite";

export default defineConfig(({ command }) => ({
  base: command === "build" ? "/FruitMarket/" : "/",
  server: {
    port: 3000,
    proxy: {
      "/api": {
        target: "http://localhost:4000",
        changeOrigin: true,
      },
    },
  },
}));
