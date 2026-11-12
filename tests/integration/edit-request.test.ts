import { revalidatePath } from "next/cache";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { editRequest } from "@/server/actions/edit-request";
import { insertRequest, prisma, resetDb } from "../support/db";

beforeEach(async () => {
  await resetDb();
  vi.clearAllMocks();
});

describe("editRequest", () => {
  it("valide et enregistre le contenu, sans changer l’identifiant, la création ni la priorité", async () => {
    const createdAt = new Date("2026-10-01T10:00:00.000Z");
    const request = await insertRequest({
      customerEmail: "ancien@exemple.gn",
      customerPhone: "+224 0622 45 78 90",
      createdAt,
      isPriority: true,
    });

    const res = await editRequest({
      id: request.id,
      customerName: "  Hôtel Kaloum  ",
      customerEmail: "   ",
      customerPhone: "+224 0622 45 78 90",
      subject: "Objet corrigé",
      description: "Description corrigée et suffisamment longue.",
    });

    expect(res).toMatchObject({ ok: true, data: { updated: true, request: { id: request.id } } });
    const row = await prisma.customerRequest.findUniqueOrThrow({ where: { id: request.id } });
    expect(row).toMatchObject({
      customerName: "Hôtel Kaloum",
      customerEmail: null,
      customerPhone: "+224 0622 45 78 90",
      subject: "Objet corrigé",
      description: "Description corrigée et suffisamment longue.",
      isPriority: true,
      createdAt,
    });
    expect(row.updatedAt.getTime()).toBeGreaterThan(request.updatedAt.getTime());
    expect(revalidatePath).toHaveBeenCalledWith("/demandes");
  });

  it("ne met pas à jour updatedAt ni ne revalide quand le contenu est inchangé", async () => {
    const request = await insertRequest();

    const res = await editRequest({
      id: request.id,
      customerName: request.customerName,
      customerEmail: "",
      customerPhone: "",
      subject: request.subject,
      description: request.description,
    });

    expect(res).toMatchObject({ ok: true, data: { updated: false } });
    expect((await prisma.customerRequest.findUniqueOrThrow({ where: { id: request.id } })).updatedAt).toEqual(
      request.updatedAt
    );
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("détecte le passage de coordonnées nulles à des valeurs renseignées", async () => {
    const request = await insertRequest();

    const res = await editRequest({
      id: request.id,
      customerName: request.customerName,
      customerEmail: "contact@exemple.gn",
      customerPhone: "+224 0622 45 78 90",
      subject: request.subject,
      description: request.description,
    });

    expect(res).toMatchObject({
      ok: true,
      data: { updated: true, request: { customerEmail: "contact@exemple.gn", customerPhone: "+224 0622 45 78 90" } },
    });
  });

  it("renvoie une erreur contrôlée pour une entrée invalide ou une demande absente", async () => {
    expect(await editRequest({ id: "pas-un-uuid" })).toMatchObject({
      ok: false,
      code: "VALIDATION_ERROR",
    });
    expect(
      await editRequest({
        id: "8d2606c3-09e1-4f16-8fb2-8b9024741ffc",
        customerName: "Nouveau client",
        customerEmail: "",
        customerPhone: "",
        subject: "Objet corrigé",
        description: "Description corrigée et suffisamment longue.",
      })
    ).toMatchObject({ ok: false, code: "NOT_FOUND" });
    expect(await prisma.customerRequest.count()).toBe(0);
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("conserve l’ancienne demande si la base échoue et n’expose pas les données dans les journaux", async () => {
    const request = await insertRequest();
    const spy = vi.spyOn(prisma.customerRequest, "updateMany").mockRejectedValueOnce(new Error("connexion perdue"));
    const log = vi.spyOn(console, "error").mockImplementation(() => {});

    const res = await editRequest({
      id: request.id,
      customerName: "Nouveau client",
      customerEmail: "secret@exemple.gn",
      customerPhone: "",
      subject: "Nouvel objet",
      description: "Nouvelle description suffisamment longue.",
    });

    expect(res).toMatchObject({ ok: false, code: "INTERNAL_ERROR" });
    expect(await prisma.customerRequest.findUniqueOrThrow({ where: { id: request.id } })).toEqual(request);
    expect(revalidatePath).not.toHaveBeenCalled();
    expect(JSON.stringify(log.mock.calls)).not.toContain("secret@exemple.gn");
    spy.mockRestore();
    log.mockRestore();
  });
});
