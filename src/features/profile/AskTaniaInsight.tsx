"use client";

import * as React from "react";
import { IconSparkles } from "@tabler/icons-react";
import { Button } from "@/components/Button";
import type { CvFieldsFragment } from "@/generated/graphql";

type InsightPhase = "idle" | "loading" | "result";

const INSIGHT_DELAY_MS = 700;

function buildInsight(cv: CvFieldsFragment | undefined): string {
  if (!cv) {
    return "Profil CV belum diisi. Lengkapi keahlian dan sertifikasi agar ringkasan bisa disusun dari data Anda.";
  }

  const { certifications, educations, skills, workExperience } = cv;
  if (!skills.length && !certifications.length && !educations.length && !workExperience.length) {
    return "Profil CV belum memiliki data. Tambahkan keahlian, sertifikasi, atau pendidikan agar ringkasan bisa disusun.";
  }

  const counted = [
    `${skills.length} keahlian`,
    `${certifications.length} sertifikasi`,
    `${educations.length} pendidikan`,
    `${workExperience.length} pengalaman kerja`,
  ].join(", ");
  const topSkills = skills
    .slice(0, 3)
    .map((skill) => skill.name)
    .join(", ");
  const missing = [
    skills.length ? null : "keahlian",
    certifications.length ? null : "sertifikasi",
    educations.length ? null : "pendidikan",
  ].filter(Boolean);
  const detail = topSkills ? ` Keahlian tercatat: ${topSkills}.` : "";
  const gap = missing.length ? ` Bagian yang belum diisi: ${missing.join(", ")}.` : "";

  return `Profil Anda memuat ${counted}.${detail}${gap} Analisis gap otomatis belum tersedia; ringkasan ini hanya merangkum data profil.`;
}

export function AskTaniaInsight({ cv }: { cv: CvFieldsFragment | undefined }) {
  const [phase, setPhase] = React.useState<InsightPhase>("idle");
  const timer = React.useRef<number | undefined>(undefined);

  React.useEffect(() => () => window.clearTimeout(timer.current), []);

  function startInsight() {
    setPhase("loading");
    timer.current = window.setTimeout(() => setPhase("result"), INSIGHT_DELAY_MS);
  }

  function closeInsight() {
    window.clearTimeout(timer.current);
    setPhase("idle");
  }

  return (
    <div aria-busy={phase === "loading"} className="tp-ai flex min-w-0 flex-col gap-3">
      <div className="flex min-w-0 gap-2">
        <IconSparkles aria-hidden className="mt-0.5 h-5 w-5 shrink-0 text-tp-brand-red-ink" />
        <div className="min-w-0">
          <p className="text-sm font-bold text-tp-text">Ask TANIA</p>
          <p className="text-[13px] leading-5 text-tp-muted">
            Ringkasan keahlian dan rekomendasi dari data profil ini, dibuat hanya saat Anda meminta.
          </p>
        </div>
      </div>
      <div aria-live="polite" className="min-w-0 text-sm text-tp-text" role="status">
        {phase === "idle" ? (
          <p>
            Insight belum dibuat. Tekan tombol di bawah untuk menyusun ringkasan dari data profil.
          </p>
        ) : null}
        {phase === "loading" ? (
          <div aria-hidden className="flex animate-pulse flex-col gap-2">
            <div className="h-3 w-3/4 rounded-tp-sm bg-tp-surface" />
            <div className="h-3 w-full rounded-tp-sm bg-tp-surface" />
            <div className="h-3 w-1/2 rounded-tp-sm bg-tp-surface" />
          </div>
        ) : null}
        {phase === "result" ? <p>{buildInsight(cv)}</p> : null}
      </div>
      <div>
        {phase === "result" ? (
          <Button onClick={closeInsight} type="button" variant="secondary">
            Tutup insight
          </Button>
        ) : (
          <Button
            disabled={phase === "loading"}
            onClick={startInsight}
            type="button"
            variant="secondary"
          >
            {phase === "loading" ? "Menyusun…" : "Buat insight"}
          </Button>
        )}
      </div>
    </div>
  );
}
