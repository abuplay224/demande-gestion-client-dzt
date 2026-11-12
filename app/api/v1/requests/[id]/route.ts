import { revalidatePath } from "next/cache";
import { requireApiUser } from "@/lib/api/auth";
import { ApiError, fromResult, noContent, withApi } from "@/lib/api/http";
import { requestJson } from "@/lib/api/serialize";
import { deleteRequestRecord, getRequest } from "@/server/services/requests";

export async function GET(req: Request, { params }: RouteContext<"/api/v1/requests/[id]">) {
  const { id } = await params;
  return withApi("GET /requests/{id}", async (r, ctx) => {
    await requireApiUser(r, ctx);
    return fromResult(await getRequest(id), requestJson);
  })(req);
}

export async function DELETE(req: Request, { params }: RouteContext<"/api/v1/requests/[id]">) {
  const { id } = await params;
  return withApi("DELETE /requests/{id}", async (r, ctx) => {
    const user = await requireApiUser(r, ctx);
    if (user.role !== "admin") {
      throw new ApiError(403, "FORBIDDEN", "Action réservée aux administrateurs.");
    }
    const res = await deleteRequestRecord(id);
    if (!res.ok) return fromResult(res, (data) => data);
    revalidatePath("/demandes");
    return noContent();
  })(req);
}
