
// Recrée les comptes de test E2E sur la base de test.
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { createAuth, createCredentialUser } from "../../lib/auth-config";
import { createMariaDbAdapter } from "../../lib/db-connection";
import { E2E_ADMIN, E2E_AGENT, PASSWORD } from "./users";

async function main() {
  const url = process.env.DATABASE_URL;

  if (!url || !/test/i.test(new URL(url).pathname)) {
    throw new Error("Base de test attendue");
  }

  const prisma = new PrismaClient({ adapter: createMariaDbAdapter(url) });

  try {
    await prisma.$transaction([
      prisma.apiSession.deleteMany(),
      prisma.session.deleteMany(),
      prisma.account.deleteMany(),
      prisma.user.deleteMany(),
    ]);

    const auth = createAuth(prisma);

    for (const u of [E2E_ADMIN, E2E_AGENT]) {
      await createCredentialUser(auth, {
        ...u,
        password: PASSWORD,
      });
    }

    console.log("Comptes de test E2E créés.");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
