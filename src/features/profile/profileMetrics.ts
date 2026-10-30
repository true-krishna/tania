import { ASSIGNMENT_MY, CV, IDP_MY, WORKLOAD } from "@/lib/constants/routes";
import type { RefetchableQueryState } from "@/lib/apollo/toQueryState";
import type { ProfileMetric } from "./ProfileMetrics";
import type { SelfProfileMetrics } from "./useSelfProfile";

interface ProfileMetricsInput {
  metrics: RefetchableQueryState<SelfProfileMetrics>;
}

type MetricsQuery = RefetchableQueryState<SelfProfileMetrics>;

interface MetricLink {
  href?: string;
  linkLabel?: string;
}

const ASSIGNMENT_LINK: MetricLink = { href: ASSIGNMENT_MY, linkLabel: "Buka Assignment saya" };
const UTILIZATION_LINK: MetricLink = { href: WORKLOAD, linkLabel: "Buka Workload saya" };
const CERTIFICATION_LINK: MetricLink = { href: CV, linkLabel: "Buka CV saya" };
const IDP_LINK: MetricLink = { href: IDP_MY, linkLabel: "Buka IDP saya" };

/**
 * State that stops a metric before it reads a value: loading and error. `ready`
 * returns null so the caller can resolve the value (including a null source).
 */
function pendingMetric(
  id: string,
  label: string,
  query: MetricsQuery,
  link: MetricLink,
): ProfileMetric | null {
  if (query.status === "loading") {
    return { ...link, id, label, hint: "Memuat metrik…", state: "loading" };
  }
  if (query.status === "error") {
    return {
      ...link,
      id,
      label,
      hint: "Gagal memuat metrik profil.",
      onRetry: query.refetch,
      state: "error",
    };
  }
  return null;
}

function assignmentMetric(query: MetricsQuery): ProfileMetric {
  const pending = pendingMetric("assignment", "Assignment aktif", query, ASSIGNMENT_LINK);
  if (pending) return pending;
  const count = query.data?.activeAssignmentCount ?? null;
  if (count === null) {
    return {
      ...ASSIGNMENT_LINK,
      id: "assignment",
      label: "Assignment aktif",
      hint: "Belum ada assignment aktif untuk akun ini.",
      state: "unavailable",
    };
  }
  return {
    ...ASSIGNMENT_LINK,
    id: "assignment",
    label: "Assignment aktif",
    hint: `${count} assignment berstatus aktif.`,
    state: "ready",
    value: count,
  };
}

function utilizationMetric(query: MetricsQuery): ProfileMetric {
  const pending = pendingMetric("utilization", "Utilisasi 6 bulan", query, UTILIZATION_LINK);
  if (pending) return pending;
  const percent = query.data?.utilizationPercent ?? null;
  if (percent === null) {
    return {
      ...UTILIZATION_LINK,
      id: "utilization",
      label: "Utilisasi 6 bulan",
      hint: "Belum ada assignment pada enam bulan terakhir.",
      state: "unavailable",
    };
  }
  return {
    ...UTILIZATION_LINK,
    id: "utilization",
    label: "Utilisasi 6 bulan",
    hint: "Rata-rata 6 bulan terakhir · rentang sehat 70–85%.",
    state: "ready",
    value: `${percent}%`,
  };
}

function certificationMetric(query: MetricsQuery): ProfileMetric {
  const pending = pendingMetric("certification", "Sertifikasi", query, CERTIFICATION_LINK);
  if (pending) return pending;
  const count = query.data?.certificationCount ?? null;
  if (count === null) {
    return {
      ...CERTIFICATION_LINK,
      id: "certification",
      label: "Sertifikasi",
      hint: "Profil CV belum pernah diisi.",
      state: "unavailable",
    };
  }
  return {
    ...CERTIFICATION_LINK,
    id: "certification",
    label: "Sertifikasi",
    hint: count ? "Terdata di profil CV." : "Belum ada sertifikasi tercatat.",
    state: "ready",
    value: count,
  };
}

function idpMetric(query: MetricsQuery): ProfileMetric {
  const pending = pendingMetric("idp", "IDP berjalan", query, IDP_LINK);
  if (pending) return pending;
  const running = query.data?.runningIdpCount ?? null;
  if (running === null) {
    return {
      ...IDP_LINK,
      id: "idp",
      label: "IDP berjalan",
      hint: "Chapter belum membuat IDP untuk Anda.",
      state: "unavailable",
    };
  }
  const completed = query.data?.completedIdpCount ?? 0;
  return {
    ...IDP_LINK,
    id: "idp",
    label: "IDP berjalan",
    hint: `${completed} IDP selesai.`,
    state: "ready",
    value: running,
  };
}

export function buildProfileMetrics({ metrics }: ProfileMetricsInput): ProfileMetric[] {
  return [
    assignmentMetric(metrics),
    utilizationMetric(metrics),
    certificationMetric(metrics),
    idpMetric(metrics),
  ];
}
