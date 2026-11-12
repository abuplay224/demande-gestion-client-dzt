"use server";

import { revalidatePath } from "next/cache";
import { type ActionResult, unauthorized } from "@/lib/errors";
import { requireUser } from "@/lib/session";
import { type EditRequestResult, editRequestRecord } from "@/server/services/requests";

/** Adaptateur web : session → modification métier → invalidation de la liste. */
export async function editRequest(input: unknown): Promise<ActionResult<EditRequestResult>> {
  try {
    await requireUser();
  } catch (e) {
    return unauthorized(e);
  }

  const res = await editRequestRecord(input);
  if (res.ok && res.data.updated) revalidatePath("/demandes");
  return res;
}
