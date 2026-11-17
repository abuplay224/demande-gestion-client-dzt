// Exécute une commande en pointant DATABASE_URL sur la base de test (DATABASE_URL_TEST).
// Usage : node scripts/with-test-db.mjs <commande> [arguments…]
import "dotenv/config";
import { spawnSync } from "node:child_process";

const url = process.env.DATABASE_URL_TEST;
if (!url) {
  console.error("DATABASE_URL_TEST est absent du fichier .env");
  process.exit(1);
}

const testUrl = new URL(url);
if (
  testUrl.protocol !== "mysql:" ||
  url === process.env.DATABASE_URL ||
  !/test/i.test(testUrl.pathname)
) {
  console.error("DATABASE_URL_TEST doit désigner une base MySQL distincte dont le nom contient « test »");
  process.exit(1);
}

// Les arguments contenant des espaces sont remis entre guillemets (exécution via le shell).
const quote = (a) => (/[\s"]/.test(a) ? `"${a.replace(/"/g, '\\"')}"` : a);
const command = process.argv.slice(2).map(quote).join(" ");
const result = spawnSync(command, {
  stdio: "inherit",
  shell: true,
  env: { ...process.env, DATABASE_URL: url },
});
process.exit(result.status ?? 1);
