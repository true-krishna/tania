import { PageHeader } from "@/components/PageHeader";
import { ChapterTalentTable } from "./ChapterTalentTable";

export function ChapterTalentList() {
  return (
    <section className="flex flex-col gap-4">
      <PageHeader
        subtitle="Talent dalam cakupan chapter Anda yang siap ditugaskan (hanya baca)."
        title="Data Karyawan"
      />
      <ChapterTalentTable />
    </section>
  );
}
