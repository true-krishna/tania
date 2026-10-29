import type { CvFieldsFragment } from "@/generated/graphql";
import type { MyIdp } from "@/features/idp/talent/useMyIdp";
import type { RefetchableQueryState } from "@/lib/apollo/toQueryState";
import type { ProfileMetric } from "./ProfileMetrics";
import type { ProfileHistory } from "./useProfile";

interface ProfileMetricsInput {
  assignmentsCanRead: boolean;
  cv: RefetchableQueryState<CvFieldsFragment | undefined>;
  history: RefetchableQueryState<ProfileHistory>;
  idp: RefetchableQueryState<MyIdp | undefined>;
  idpCanRead: boolean;
}

function assignmentMetric(
  canRead: boolean,
  history: RefetchableQueryState<ProfileHistory>,
): ProfileMetric {
  const base = { id: "assignment", label: "Assignment aktif" };
  if (!canRead) {
    return { ...base, hint: "Butuh akses modul Assignment.", state: "unavailable" };
  }
  if (history.status === "loading") {
    return { ...base, hint: "Memuat data assignment…", state: "loading" };
  }
  if (history.status === "error") {
    return {
      ...base,
      hint: "Gagal memuat data assignment.",
      onRetry: history.refetch,
      state: "error",
    };
  }

  const assignments = history.data?.assignments ?? [];
  const active = assignments.filter((assignment) => assignment.status === "ACTIVE").length;
  return {
    ...base,
    hint: `${assignments.length} assignment tercatat.`,
    state: "ready",
    value: active,
  };
}

function certificationMetric(
  cv: RefetchableQueryState<CvFieldsFragment | undefined>,
): ProfileMetric {
  const base = { id: "certification", label: "Sertifikasi" };
  if (cv.status === "loading") {
    return { ...base, hint: "Memuat profil CV…", state: "loading" };
  }
  if (cv.status === "error") {
    return { ...base, hint: "Gagal memuat profil CV.", onRetry: cv.refetch, state: "error" };
  }
  if (!cv.data) {
    return { ...base, hint: "Profil CV belum diisi.", state: "unavailable" };
  }

  const total = cv.data.certifications.length;
  return {
    ...base,
    hint: total ? "Terdata di profil CV." : "Belum ada sertifikasi tercatat.",
    state: "ready",
    value: total,
  };
}

function idpMetric(canRead: boolean, idp: RefetchableQueryState<MyIdp | undefined>): ProfileMetric {
  const base = { id: "idp", label: "IDP berjalan" };
  if (!canRead) {
    return { ...base, hint: "Butuh akses modul IDP.", state: "unavailable" };
  }
  if (idp.status === "loading") {
    return { ...base, hint: "Memuat IDP…", state: "loading" };
  }
  if (idp.status === "error") {
    return { ...base, hint: "Gagal memuat IDP.", onRetry: idp.refetch, state: "error" };
  }
  if (!idp.data) {
    return { ...base, hint: "Belum ada IDP dari Chapter.", state: "unavailable" };
  }

  const completed = idp.data.actions.filter((action) => action.status === "COMPLETED").length;
  return {
    ...base,
    hint: `${completed}/${idp.data.actions.length} aksi selesai.`,
    state: "ready",
    value: idp.data.actions.length - completed,
  };
}

export function buildProfileMetrics({
  assignmentsCanRead,
  cv,
  history,
  idp,
  idpCanRead,
}: ProfileMetricsInput): ProfileMetric[] {
  return [
    assignmentMetric(assignmentsCanRead, history),
    {
      id: "utilization",
      label: "Utilisasi 6 bulan",
      hint: "Belum ada sumber data utilisasi (menunggu agregat WAD).",
      state: "unavailable",
    },
    certificationMetric(cv),
    idpMetric(idpCanRead, idp),
  ];
}
