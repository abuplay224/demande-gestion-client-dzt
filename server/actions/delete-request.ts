"use server";

import { revalidatePath } from "next/cache";
import { type ActionResult, unauthorized } from "@/lib/errors";
import { requireAdmin } from "@/lib/session";
import { deleteRequestRecord } from "@/server/services/requests";

/** Adaptateur web : session → suppression métier → invalidation de la liste. */
export async function deleteRequest(input: unknown): Promise<ActionResult<{ id: string }>> {
  try {
    await requireAdmin();
  } catch (e) {
    return unauthorized(e);
  }

  const res = await deleteRequestRecord(input);
  if (res.ok) revalidatePath("/demandes");
  return res;
}
