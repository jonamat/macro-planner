import dotenv from "dotenv";
import path from "node:path";

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

dotenv.config({
  path: envPath || path.resolve(__dirname, "../../../.env"),
});


const env = {
  port: Number(process.env.SERVER_PORT ?? 4000),
  jwtSecret: process.env.JWT_SECRET ?? "change-me-in-prod",
  databaseUrl: process.env.DATABASE_URL || "file:./prisma/data/dev.db",
};

export default env;
