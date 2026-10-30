"use client";

import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { EmptyState } from "@/components/DataState";

export function CvEmptyCard({ owner, onEdit }: { owner: boolean; onEdit: () => void }) {
  return (
    <Card className="min-w-0">
      <EmptyState message="Profil CV belum diisi. Tambahkan ringkasan, pendidikan, sertifikasi, keahlian, dan pengalaman kerja Anda." />
      {owner ? (
        <div className="mt-3">
          <Button onClick={onEdit} type="button">
            Mulai isi CV
          </Button>
        </div>
      ) : null}
    </Card>
  );
}
