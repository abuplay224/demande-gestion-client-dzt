import { PrismaMariaDb } from "@prisma/adapter-mariadb";

export function createMariaDbAdapter(connectionString: string) {
  const url = new URL(connectionString);
  if (url.protocol !== "mysql:") {
    throw new Error("DATABASE_URL doit utiliser le protocole mysql://.");
  }

  const database = decodeURIComponent(url.pathname.replace(/^\/+/, ""));
  if (!database) {
    throw new Error("DATABASE_URL doit préciser le nom de la base MySQL.");
  }

  return new PrismaMariaDb({
    host: url.hostname,
    port: Number(url.port || 3306),
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database,
    connectionLimit: 5,
  });
}
