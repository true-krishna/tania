"use client";

import { Card } from "@/components/Card";
import { AddReviewForm } from "./AddReviewForm";
import type { IdpDetail } from "./types";

export function ReviewHistoryCard({ idp, managing }: { idp: IdpDetail; managing: boolean }) {
  return (
    <Card className="max-w-3xl">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500">
        Riwayat Review
      </h2>
      {idp.reviews.length === 0 ? (
        <p className="text-sm text-zinc-500">Belum ada catatan review.</p>
      ) : (
        <ul className="divide-y divide-zinc-100">
          {idp.reviews.map((review) => (
            <li className="py-2.5" key={review.id}>
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-zinc-900">
                  {review.reviewDate}
                  {review.createdBy ? ` · ${review.createdBy.fullName ?? "Chapter"}` : ""}
                </p>
              </div>
              <p className="mt-1 text-sm text-zinc-600">{review.summary}</p>
              {review.followUp ? (
                <p className="mt-1 text-xs text-zinc-500">Tindak lanjut: {review.followUp}</p>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      {managing ? <AddReviewForm idpId={idp.id} /> : null}
    </Card>
  );
}
