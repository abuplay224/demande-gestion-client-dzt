import { revalidatePath } from "next/cache";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { deleteRequest } from "@/server/actions/delete-request";
import { insertRequest, prisma, resetDb } from "../support/db";
import { ADMIN, asUser } from "../support/session";

beforeEach(async () => {
  await resetDb();
  asUser(ADMIN);
  vi.clearAllMocks();
});

describe("deleteRequest", () => {
  it("supprime définitivement uniquement la demande ciblée et invalide la liste", async () => {
    const request = await insertRequest();
    const other = await insertRequest();

    expect(await deleteRequest(request.id)).toEqual({ ok: true, data: { id: request.id } });
    expect(await prisma.customerRequest.findUnique({ where: { id: request.id } })).toBeNull();
    expect(await prisma.customerRequest.findUnique({ where: { id: other.id } })).not.toBeNull();
    expect(revalidatePath).toHaveBeenCalledWith("/demandes");
  });

  it("refuse un identifiant invalide et signale une demande absente", async () => {
    expect(await deleteRequest("pas-un-uuid")).toMatchObject({ ok: false, code: "VALIDATION_ERROR" });
    const missingId = "8d2606c3-09e1-4f16-8fb2-8b9024741ffc";
    expect(await deleteRequest(missingId)).toMatchObject({
      ok: false,
      code: "NOT_FOUND",
    });
    expect(await prisma.customerRequest.count()).toBe(0);
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("une seconde suppression signale que la demande n’existe plus", async () => {
    const request = await insertRequest();

    await deleteRequest(request.id);

    expect(await deleteRequest(request.id)).toMatchObject({ ok: false, code: "NOT_FOUND" });
    expect(await prisma.customerRequest.count()).toBe(0);
  });

  it("renvoie une erreur contrôlée si la base échoue", async () => {
    const request = await insertRequest();
    const spy = vi.spyOn(prisma.customerRequest, "deleteMany").mockRejectedValueOnce(new Error("connexion perdue"));
    const log = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(await deleteRequest(request.id)).toEqual({
      ok: false,
      code: "INTERNAL_ERROR",
      message: "Impossible de supprimer la demande. Réessayez.",
    });
    expect(await prisma.customerRequest.findUnique({ where: { id: request.id } })).not.toBeNull();
    expect(revalidatePath).not.toHaveBeenCalled();
    spy.mockRestore();
    log.mockRestore();
  });
});
