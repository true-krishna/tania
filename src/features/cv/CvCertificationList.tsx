import type { CvFieldsFragment } from "@/generated/graphql";
import { CvEmptyValue } from "./CvEmptyValue";

export function CvCertificationList({
  certifications,
}: {
  certifications: CvFieldsFragment["certifications"];
}) {
  if (!certifications.length) {
    return <CvEmptyValue reason="Belum ada sertifikasi di profil CV." />;
  }

  return (
    <ul className="flex flex-col gap-3">
      {certifications.map((certification) => {
        const detail = [certification.issuer, certification.issuedDate].filter(Boolean).join(" · ");

        return (
          <li
            className="min-w-0 border-t border-tp-line pt-3 first:border-t-0 first:pt-0"
            key={certification.id}
          >
            <p className="text-sm font-semibold text-tp-text">{certification.name}</p>
            <p className="text-[13px] text-tp-muted">{detail || "Penerbit belum diisi."}</p>
          </li>
        );
      })}
    </ul>
  );
}
