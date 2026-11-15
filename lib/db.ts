

import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL est introuvable dans le fichier .env");
}

const url = new URL(databaseUrl);

const adapter = new PrismaMariaDb({
  host: url.hostname,
  port: Number(url.port || 3306),
  user: decodeURIComponent(url.username),
  password: decodeURIComponent(url.password),
  database: decodeURIComponent(url.pathname.replace(/^\/+/, "")),
  connectionLimit: 5,
});

export const db =
  globalForPrisma.prisma ?? new PrismaClient({ adapter });

export const prisma = db;

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}




// import "server-only";
// import { PrismaPg } from "@prisma/adapter-pg";
// import { PrismaClient } from "@/generated/prisma/client";

// // Client Prisma partagé, serveur uniquement (survit au rechargement à chaud en développement).
// const g = globalThis as unknown as { __doztraPrisma?: PrismaClient };

// function createClient() {
//   const url = process.env.DATABASE_URL;
//   if (!url) throw new Error("DATABASE_URL n’est pas défini");
//   return new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });
// }

// export const prisma = g.__doztraPrisma ?? createClient();
// if (process.env.NODE_ENV !== "production") g.__doztraPrisma = prisma;
