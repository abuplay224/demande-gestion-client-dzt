
import "dotenv/config";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "@prisma/client";
import { buildSeed } from "./seed-data";

async function main() {
  const url = process.env.DATABASE_URL;

  if (!url) {
    throw new Error("DATABASE_URL n’est pas défini");
  }

  const databaseUrl = new URL(url);

  const adapter = new PrismaMariaDb({
    host: databaseUrl.hostname,
    port: Number(databaseUrl.port || 3306),
    user: decodeURIComponent(databaseUrl.username),
    password: decodeURIComponent(databaseUrl.password),
    database: decodeURIComponent(
      databaseUrl.pathname.replace(/^\/+/, "")
    ),
    connectionLimit: 5,
  });

  const prisma = new PrismaClient({ adapter });

  try {
    const { count } = await prisma.customerRequest.createMany({
      data: buildSeed(),
      skipDuplicates: true,
    });

    console.log(`${count} demande(s) fictive(s) ajoutée(s).`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
