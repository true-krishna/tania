"use client";

import * as React from "react";
import { AccessDenied } from "@/components/AccessDenied";
import { Button } from "@/components/Button";
import { Chip } from "@/components/Chip";
import { ErrorState, LoadingState } from "@/components/DataState";
import { PageHeader } from "@/components/PageHeader";
import { useSessionRole } from "@/lib/auth/guard";
import { CvDocumentSheet } from "./CvDocumentSheet";
import { CvEmptyCard } from "./CvEmptyCard";
import { CvEditorSections } from "./CvEditorSections";
import { CvReadSections } from "./CvReadSections";
import { useMyCvProfile } from "./useMyCvProfile";

type ViewMode = "baca" | "ubah" | "dokumen";

function headerActions(mode: ViewMode, setMode: (mode: ViewMode) => void) {
  if (mode === "dokumen") {
    return (
      <Button onClick={() => setMode("baca")} type="button" variant="secondary">
        Kembali
      </Button>
    );
  }
  if (mode === "ubah") {
    return (
      <Button onClick={() => setMode("baca")} type="button" variant="secondary">
        Selesai
      </Button>
    );
  }
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button onClick={() => setMode("dokumen")} type="button" variant="secondary">
        Pratinjau dokumen
      </Button>
      <Button onClick={() => setMode("ubah")} type="button">
        Ubah CV
      </Button>
    </div>
  );
}

export function CvSelfPage() {
  const role = useSessionRole();
  const cv = useMyCvProfile();
  const [mode, setMode] = React.useState<ViewMode>("baca");

  const owner = role === "TALENT";

  if (role && !owner) return <AccessDenied />;

  return (
    <section className="flex min-w-0 flex-col gap-4">
      <PageHeader
        actions={owner ? headerActions(mode, setMode) : undefined}
        subtitle="Ringkasan, pendidikan, sertifikasi, keahlian, dan pengalaman kerja Anda."
        title="CV saya"
      />
      {owner ? (
        <div>
          <Chip size="small" variant="neutral">
            Tulis hanya untuk pemilik (FR-13)
          </Chip>
        </div>
      ) : null}

      {cv.status === "loading" ? <LoadingState label="Memuat profil CV…" /> : null}
      {cv.status === "error" ? (
        <ErrorState message={cv.error ?? "Gagal memuat profil CV. Coba muat ulang halaman."} />
      ) : null}

      {cv.status === "ready" && mode === "dokumen" ? <CvDocumentSheet cv={cv.data} /> : null}
      {cv.status === "ready" && mode === "ubah" ? <CvEditorSections cv={cv.data} /> : null}

      {cv.status === "ready" && mode === "baca" && cv.data ? (
        <div className="flex flex-col gap-3">
          <CvReadSections cv={cv.data} />
        </div>
      ) : null}
      {cv.status === "ready" && mode === "baca" && !cv.data ? (
        <CvEmptyCard onEdit={() => setMode("ubah")} owner={owner} />
      ) : null}
    </section>
  );
}
