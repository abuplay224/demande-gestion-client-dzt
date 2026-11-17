import { describe, expect, it } from "vitest";
import { createMariaDbAdapter } from "@/lib/db-connection";

describe("connexion MySQL", () => {
  it("accepte une URL mysql avec un nom de base", () => {
    expect(() => createMariaDbAdapter("mysql://utilisateur:motdepasse@localhost:3306/doztra_dev")).not.toThrow();
  });

  it("refuse les protocoles non MySQL ou les URL sans base", () => {
    expect(() => createMariaDbAdapter("https://utilisateur:motdepasse@localhost:443/doztra_dev")).toThrow(
      "DATABASE_URL doit utiliser le protocole mysql://."
    );
    expect(() => createMariaDbAdapter("mysql://utilisateur:motdepasse@localhost:3306")).toThrow(
      "DATABASE_URL doit préciser le nom de la base MySQL."
    );
  });
});
