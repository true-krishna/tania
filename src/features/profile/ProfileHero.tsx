import { Avatar } from "@/components/Avatar";
import { Card } from "@/components/Card";
import { Chip } from "@/components/Chip";
import { BAND_POSITION_LABEL, WORK_LOCATION_LABEL } from "@/features/contracts/labels";
import { EMPLOYEE_STATUS_LABEL, EMPLOYEE_STATUS_VARIANT } from "@/features/employees/labels";
import type { RefetchableQueryState } from "@/lib/apollo/toQueryState";
import { formatProfileDate } from "./format";
import { ProfileErrorState } from "./ProfileErrorState";
import { ProfileField } from "./ProfileField";
import { ProfileHeroSkeleton } from "./ProfileHeroSkeleton";
import type { ProfileContract, ProfileEmployee, ProfileSession } from "./useProfile";

function missingContractHint(hasContract: boolean, hint: string): string {
  if (hasContract) return "Belum tercatat.";
  return hint;
}

export function ProfileHero({
  contract,
  contractHint,
  employee,
  error,
  onRetry,
  session,
  status,
}: {
  contract: ProfileContract | undefined;
  contractHint: string;
  employee: ProfileEmployee | undefined;
  error: string | null;
  onRetry: () => void;
  session: ProfileSession | undefined;
  status: RefetchableQueryState<ProfileEmployee | undefined>["status"];
}) {
  if (status === "loading") return <ProfileHeroSkeleton />;
  if (status === "error") {
    return <ProfileErrorState message={error ?? "Gagal memuat profil."} onRetry={onRetry} />;
  }

  const fullName = employee?.fullName ?? session?.fullName ?? "Profil saya";

  if (!employee) {
    return (
      <Card className="flex min-w-0 flex-col gap-2">
        <h1 className="tp-h1 break-words">{fullName}</h1>
        <p className="tp-empty">
          <strong>Data karyawan belum tersedia</strong>
          Akun ini belum tertaut ke record karyawan, jadi detail kepegawaian dan kontrak tidak dapat
          ditampilkan.
        </p>
      </Card>
    );
  }

  const unitName = employee.unit?.name ?? contract?.unit.name;
  const chapterName = employee.chapter?.name;
  const orgLine = [unitName, chapterName].filter(Boolean).join(" · ") || "Unit belum tercatat";
  const position = employee.jobRole?.name ?? contract?.jobTitle;
  const fallbackHint = missingContractHint(Boolean(contract), contractHint);

  const fields: { label: string; reason?: string; value?: string }[] = [
    {
      label: "Nomor induk",
      reason: "Belum tercatat.",
      value: employee.nomorInduk ?? contract?.nomorInduk,
    },
    { label: "Unit", reason: "Belum tercatat.", value: unitName },
    {
      label: "Band",
      reason: fallbackHint,
      value: contract ? BAND_POSITION_LABEL[contract.bandPosition] : undefined,
    },
    { label: "Chapter", reason: "Belum ada chapter.", value: chapterName },
    { label: "Bergabung", reason: "Belum tercatat.", value: formatProfileDate(employee.joinedAt) },
    {
      label: "Lokasi kerja",
      reason: fallbackHint,
      value: contract ? WORK_LOCATION_LABEL[contract.workLocation] : undefined,
    },
    {
      label: "Email kantor",
      reason: "Belum diisi.",
      value: contract?.officeEmail ?? employee.email,
    },
    { label: "NIK", reason: "Belum tercatat.", value: employee.nikMasked },
  ];

  return (
    <Card className="min-w-0 overflow-hidden" padded={false}>
      <div aria-hidden className="h-20 border-b border-tp-line bg-tp-bg" />
      <div className="min-w-0 px-5 pb-5">
        <Avatar
          className="-mt-10 h-20 w-20 border-4 border-tp-surface bg-tp-nav text-2xl text-tp-on-nav"
          name={fullName}
        />
        <div className="mt-3 flex min-w-0 flex-wrap items-center gap-2">
          <h1 className="tp-h1 min-w-0 break-words">{fullName}</h1>
          {position ? <Chip variant="info">{position}</Chip> : null}
          <Chip variant={EMPLOYEE_STATUS_VARIANT[employee.status]}>
            {EMPLOYEE_STATUS_LABEL[employee.status]}
          </Chip>
        </div>
        <p className="tp-label mt-1 break-words text-sm">{orgLine}</p>
        <dl className="mt-5 grid grid-cols-1 gap-x-5 gap-y-4 min-[860px]:grid-cols-2 xl:grid-cols-4">
          {fields.map((field) => (
            <ProfileField
              key={field.label}
              label={field.label}
              reason={field.reason}
              value={field.value}
            />
          ))}
        </dl>
      </div>
    </Card>
  );
}
