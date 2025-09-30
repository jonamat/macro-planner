import path from "node:path";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import dotenv from "dotenv";

// Search for .env file recursively backward in directories
let envPath: string | undefined;
let currentDir = __dirname;

while (currentDir !== path.dirname(currentDir)) {
  const envFile = path.join(currentDir, ".env");
  try {
    require("fs").accessSync(envFile);
    envPath = envFile;
    break;
  } catch {
    currentDir = path.dirname(currentDir);
  }
}
const env = dotenv.config({
  path: envPath || path.resolve(__dirname, "../../../.env"),
});

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@macro-calculator/shared": path.resolve(
        __dirname,
        "../../packages/shared/src"
      ),
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: `http://localhost:${env.parsed?.SERVER_PORT ?? 4000}`,
        changeOrigin: true,
      },
    },
  },
});
