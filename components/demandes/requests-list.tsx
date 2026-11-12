"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { CustomerRequest } from "@/lib/types";
import { deleteRequest } from "@/server/actions/delete-request";
import { setRequestPriority } from "@/server/actions/set-request-priority";
import { useDemandes } from "./demandes-provider";
import { RequestSheet } from "./request-sheet";
import { RequestsCards } from "./requests-cards";
import { RequestsTable } from "./requests-table";

/** Liste interactive de la page courante : bascule de priorité et panneau de détail. */
export function RequestsList({ items, canDelete }: { items: CustomerRequest[]; canDelete: boolean }) {
  const { freshId, notify } = useDemandes();
  const router = useRouter();
  const [pending, setPending] = useState<Record<string, boolean>>({});
  const [deletePending, setDeletePending] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const lastTrigger = useRef<HTMLElement | null>(null);

  const isPending = (id: string) => !!pending[id];
  const open = openId ? (items.find((i) => i.id === openId) ?? null) : null;

  async function toggle(r: CustomerRequest) {
    if (pending[r.id]) return;
    const target = !r.isPriority; // valeur souhaitée explicite (RG18)
    setPending((p) => ({ ...p, [r.id]: true }));
    try {
      const res = await setRequestPriority({ id: r.id, isPriority: target });
      if (res.ok) notify(res.data.isPriority ? "Demande marquée comme prioritaire" : "Priorité retirée");
      else notify(res.message, "err");
    } catch {
      notify("Impossible de modifier la priorité. L’état précédent est conservé.", "err");
    } finally {
      setPending((p) => {
        const next = { ...p };
        delete next[r.id];
        return next;
      });
    }
  }

  async function remove(r: CustomerRequest) {
    if (pending[r.id] || deletePending) return;
    const confirmed = window.confirm("Supprimer définitivement cette demande ? Cette action est irréversible.");
    if (!confirmed) return;

    setDeletePending(r.id);
    try {
      const res = await deleteRequest(r.id);
      if (!res.ok) {
        notify(res.message, "err");
        return;
      }
      notify("Demande supprimée");
      setOpenId(null);
      router.refresh();
    } catch {
      notify("Impossible de supprimer la demande. Réessayez.", "err");
    } finally {
      setDeletePending(null);
    }
  }

  function view(r: CustomerRequest, trigger: HTMLElement) {
    lastTrigger.current = trigger;
    setOpenId(r.id);
  }

  const actions = { freshId, isPending, onToggle: toggle, onView: view };

  return (
    <>
      <div className="hidden min-w-0 min-[960px]:block">
        <RequestsTable items={items} {...actions} />
      </div>
      <div className="min-[960px]:hidden">
        <RequestsCards items={items} {...actions} />
      </div>
      <RequestSheet
        request={open}
        pending={open ? isPending(open.id) || deletePending === open.id : false}
        deletePending={open ? deletePending === open.id : false}
        canDelete={canDelete}
        onToggle={toggle}
        onDelete={remove}
        onClose={() => setOpenId(null)}
        returnFocus={() => lastTrigger.current}
      />
    </>
  );
}
