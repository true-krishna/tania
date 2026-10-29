import { Card } from "@/components/Card";
import { DescriptionItem } from "@/components/DescriptionItem";
import type { IdpDetail } from "./types";

export function IdpComponentsCard({ idp }: { idp: IdpDetail }) {
  return (
    <Card className="max-w-3xl">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500">
        Komponen IDP
      </h2>
      <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <DescriptionItem
          label="Development Objective"
          value={idp.developmentObjective}
          variant="preline"
        />
        <DescriptionItem
          label="Penilaian Kondisi Saat Ini"
          value={idp.currentAssessment}
          variant="preline"
        />
        <DescriptionItem label="Identifikasi Gap" value={idp.gapAnalysis} variant="preline" />
        <DescriptionItem
          label="Success Indicators"
          value={idp.successIndicators}
          variant="preline"
        />
        <DescriptionItem
          label="Timeline & Milestone"
          value={`${idp.timelineStart} — ${idp.timelineEnd}`}
          variant="preline"
        />
      </dl>
    </Card>
  );
}
