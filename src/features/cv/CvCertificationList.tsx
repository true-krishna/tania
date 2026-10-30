import { Chip } from "@/components/Chip";
import type { CvFieldsFragment } from "@/generated/graphql";
import { formatProfileDate } from "@/features/profile/format";
import { CvEmptyValue } from "./CvEmptyValue";
import { certificationExpiry } from "./certificationExpiry";

function expiryLine(expiryDate: string | null | undefined): string | null {
  if (!expiryDate) return null;
  const formatted = formatProfileDate(expiryDate) ?? expiryDate;
  return `Berlaku s.d. ${formatted}`;
}

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
        const detail = [
          certification.issuer,
          certification.issuedDate
            ? `diterbitkan ${formatProfileDate(certification.issuedDate) ?? certification.issuedDate}`
            : null,
        ]
          .filter(Boolean)
          .join(" · ");
        const expiry = certificationExpiry(certification.expiryDate);

        return (
          <li
            className="min-w-0 border-t border-tp-line pt-3 first:border-t-0 first:pt-0"
            key={certification.id}
          >
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <p className="min-w-0 break-words text-sm font-semibold text-tp-text">
                {certification.name}
              </p>
              {expiry ? (
                <Chip size="small" variant={expiry.variant}>
                  {expiry.label}
                </Chip>
              ) : null}
            </div>
            <p className="text-[13px] text-tp-muted">{detail || "Penerbit belum diisi."}</p>
            <p className="text-[13px] text-tp-muted">
              {expiryLine(certification.expiryDate) ?? "Tanpa masa berlaku"}
            </p>
            {certification.credentialUrl ? (
              <a
                className="mt-1 inline-flex min-h-[44px] items-center text-[13px] font-semibold text-tp-brand-red-ink hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tp-brand-red"
                href={certification.credentialUrl}
                rel="noreferrer noopener"
                target="_blank"
              >
                Tautan kredensial
              </a>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
