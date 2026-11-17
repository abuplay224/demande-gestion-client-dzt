
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { createMariaDbAdapter } from "../lib/db-connection";
import { buildSeed } from "./seed-data";

async function main() {
  const url = process.env.DATABASE_URL;

  if (!url) {
    throw new Error("DATABASE_URL n’est pas défini");
  }

  const prisma = new PrismaClient({ adapter: createMariaDbAdapter(url) });

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
