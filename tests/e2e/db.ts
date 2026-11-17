import "dotenv/config";
import { PrismaClient, type Prisma } from "@prisma/client";
import { createMariaDbAdapter } from "../../lib/db-connection";
import { buildSeed } from "../../prisma/seed-data";

export function testUrl() {
  const url = process.env.DATABASE_URL_TEST;
  if (!url) {
    throw new Error("DATABASE_URL_TEST est absent du fichier .env");
  }
  const parsedUrl = new URL(url);
  if (parsedUrl.protocol !== "mysql:" || url === process.env.DATABASE_URL || !/test/i.test(parsedUrl.pathname)) {
    throw new Error("DATABASE_URL_TEST doit désigner une base MySQL distincte dont le nom contient « test »");
  }
  return url;
}

async function withPrisma<T>(fn: (prisma: PrismaClient) => Promise<T>) {
  const prisma = new PrismaClient({ adapter: createMariaDbAdapter(testUrl()) });
  try {
    return await fn(prisma);
  } finally {
    await prisma.$disconnect();
  }
}

/** Vide la base de test puis, si demandé, recharge les 26 demandes du prototype. */
export function resetDb({ seed = true } = {}) {
  return withPrisma(async (prisma) => {
    await prisma.customerRequest.deleteMany();
    if (!seed) return;
    await prisma.customerRequest.createMany({ data: buildSeed() });
  });
}

export function countRows(where: Prisma.CustomerRequestWhereInput = {}) {
  return withPrisma((prisma) => prisma.customerRequest.count({ where }));
}
