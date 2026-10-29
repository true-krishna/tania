import { Card } from "@/components/Card";
import type { IdpDetail } from "./types";

export function RevisionHistoryCard({ idp }: { idp: IdpDetail }) {
  return (
    <Card className="max-w-3xl">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500">
        Riwayat Revisi
      </h2>
      {idp.revisions.length === 0 ? (
        <p className="text-sm text-zinc-500">Belum ada revisi dokumen.</p>
      ) : (
        <ul className="divide-y divide-zinc-100">
          {idp.revisions.map((rev) => (
            <li className="py-2.5" key={rev.id}>
              <p className="text-sm text-zinc-900">
                Revisi #{rev.revisionNo}
                <span className="text-xs text-zinc-500"> · {rev.createdAt}</span>
              </p>
              {rev.changeNote ? (
                <p className="mt-0.5 text-sm text-zinc-600">{rev.changeNote}</p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
