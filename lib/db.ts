

import "server-only";
import { PrismaClient } from "@prisma/client";
import { createMariaDbAdapter } from "./db-connection";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL est introuvable dans le fichier .env");
}

export const db =
  globalForPrisma.prisma ?? new PrismaClient({ adapter: createMariaDbAdapter(databaseUrl) });

export const prisma = db;

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
