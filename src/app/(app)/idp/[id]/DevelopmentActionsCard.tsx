"use client";

import { useMutation } from "@apollo/client";
import { Card } from "@/components/Card";
import { Chip } from "@/components/Chip";
import { Select } from "@/components/Select";
import { useToast } from "@/components/Toast";
import { IdpDocument, UpdateDevelopmentActionStatusDocument } from "@/generated/graphql";
import type { DevelopmentActionStatus } from "@/generated/graphql/types";
import { errorText } from "@/lib/errors";
import { AddDevelopmentActionForm } from "./AddDevelopmentActionForm";
import { ACTION_STATUS_LABEL, METHOD_LABEL } from "./labels";
import type { IdpDetail } from "./types";

export function DevelopmentActionsCard({
  idp,
  managing,
  canUpdateStatus,
}: {
  idp: IdpDetail;
  managing: boolean;
  canUpdateStatus: boolean;
}) {
  const [updateActionStatus] = useMutation(UpdateDevelopmentActionStatusDocument, {
    refetchQueries: [{ query: IdpDocument, variables: { id: idp.id } }],
  });
  const { pushToast } = useToast();
  const completedActions = idp.actions.filter((a) => a.status === "COMPLETED").length;

  return (
    <Card className="max-w-3xl">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Aksi Pengembangan ({completedActions}/{idp.actions.length})
        </h2>
      </div>

      {idp.actions.length === 0 ? (
        <p className="text-sm text-zinc-500">Belum ada aksi pengembangan.</p>
      ) : (
        <ul className="divide-y divide-zinc-100">
          {idp.actions.map((action) => (
            <li className="flex items-center justify-between gap-3 py-2.5" key={action.id}>
              <div className="flex-1">
                <p className="text-sm text-zinc-900">{action.description}</p>
                <p className="text-xs text-zinc-500">
                  {METHOD_LABEL[action.method]}
                  {action.dueDate ? ` · tenggat ${action.dueDate}` : ""}
                </p>
              </div>
              {canUpdateStatus ? (
                <Select
                  aria-label={`Status aksi ${action.description}`}
                  className="w-fit h-8 text-xs"
                  onChange={(e) => {
                    const status = e.target.value as DevelopmentActionStatus;
                    updateActionStatus({ variables: { id: action.id, status } }).catch(
                      (err: unknown) => {
                        pushToast("error", errorText(err, "Gagal memperbarui status aksi."));
                      },
                    );
                  }}
                  options={(["TODO", "IN_PROGRESS", "COMPLETED"] as DevelopmentActionStatus[]).map(
                    (s) => ({ value: s, label: ACTION_STATUS_LABEL[s] }),
                  )}
                  value={action.status}
                />
              ) : (
                <Chip size="small">{ACTION_STATUS_LABEL[action.status]}</Chip>
              )}
            </li>
          ))}
        </ul>
      )}

      {managing ? <AddDevelopmentActionForm idpId={idp.id} /> : null}
    </Card>
  );
}
