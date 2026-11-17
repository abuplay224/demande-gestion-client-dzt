
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { createInterface } from "node:readline";
import { parseArgs } from "node:util";
import { createAuth, createCredentialUser } from "../lib/auth-config";
import { createMariaDbAdapter } from "../lib/db-connection";

function askHidden(question: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: true,
    });

    const out = rl as unknown as {
      _writeToOutput: (s: string) => void;
      output: NodeJS.WriteStream;
    };

    let muted = false;

    out._writeToOutput = (s) => {
      if (!muted || s.includes("\n")) {
        out.output.write(muted ? "\n" : s);
      }
    };

    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });

    muted = true;
  });
}

async function main() {
  const { values } = parseArgs({
    options: {
      email: { type: "string" },
      name: { type: "string" },
    },
  });

  if (!values.email || !values.name) {
    throw new Error(
      'Usage : npm run admin:create -- --email adresse@doztra.com --name "Prenom Nom"'
    );
  }

  const password =
    process.env.ADMIN_PASSWORD ??
    (await askHidden("Mot de passe (10 caractères minimum) : "));

  if (
    !process.env.ADMIN_PASSWORD &&
    password !== (await askHidden("Confirmez le mot de passe : "))
  ) {
    throw new Error("Les deux mots de passe ne correspondent pas.");
  }

  if (password.length < 10) {
    throw new Error("Le mot de passe doit contenir au moins 10 caractères.");
  }

  const url = process.env.DATABASE_URL;

  if (!url) {
    throw new Error("DATABASE_URL n'est pas défini.");
  }

  const prisma = new PrismaClient({ adapter: createMariaDbAdapter(url) });

  try {
    const auth = createAuth(prisma);

    const user = await createCredentialUser(auth, {
      name: values.name,
      email: values.email,
      password,
      role: "admin",
    });

    console.log(`Administrateur créé : ${user.email}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
