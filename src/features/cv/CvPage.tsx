"use client";

import { PageHeader } from "@/components/PageHeader";
import { useSessionRole } from "@/lib/auth/guard";
import { CvRosterViewer } from "./CvRosterViewer";
import { TalentCvEditor } from "./TalentCvEditor";

export default function CvPage() {
  const role = useSessionRole();

  if (role === "TALENT") return <TalentCvEditor />;
  if (role === "CHAPTER") return <CvRosterViewer audience="CHAPTER" />;
  if (role === "OPERATION" || role === "ADMIN") {
    return <CvRosterViewer audience={role} />;
  }

  return (
    <section className="flex flex-col gap-4">
      <PageHeader
        subtitle="Fitur CV hanya untuk peran Talent, Chapter, Operation, dan Admin (FR-13)."
        title="Profil CV"
      />
    </section>
  );
}
