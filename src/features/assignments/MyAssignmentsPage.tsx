"use client";

import { AccessDenied } from "@/components/AccessDenied";
import { Card } from "@/components/Card";
import { Chip } from "@/components/Chip";
import { EmptyState, LoadingState } from "@/components/DataState";
import { PageHeader } from "@/components/PageHeader";
import { Table } from "@/components/Table";
import { useMyCvProfile } from "@/features/cv/useMyCvProfile";
import { ProfileErrorState } from "@/features/profile/ProfileErrorState";
import { formatProfileDate } from "@/features/profile/format";
import { useSessionRole } from "@/lib/auth/guard";
import { AssignmentStatusBadge } from "./AssignmentStatusBadge";

type OwnAssignment = NonNullable<
  ReturnType<typeof useMyCvProfile>["data"]
>["workExperience"][number];

function periodLabel(assignment: OwnAssignment): string {
  const start = formatProfileDate(assignment.periodStart) ?? assignment.periodStart;
  if (!assignment.periodEnd) return `sejak ${start}`;
  const end = formatProfileDate(assignment.periodEnd) ?? assignment.periodEnd;
  return `${start} s.d. ${end}`;
}

export function MyAssignmentsPage() {
  const role = useSessionRole();
  const cv = useMyCvProfile();

  if (role && role !== "TALENT") return <AccessDenied />;

  const assignments = cv.data?.workExperience ?? [];
  const active = assignments.filter((assignment) => assignment.status === "ACTIVE");
  const history = assignments.filter((assignment) => assignment.status !== "ACTIVE");

  return (
    <section className="flex min-w-0 flex-col gap-4">
      <PageHeader
        actions={
          <Chip size="small" variant="neutral">
            Hanya baca · ditetapkan Chapter / Operation
          </Chip>
        }
        subtitle="Proyek yang sedang dan pernah Anda kerjakan."
        title="Assignment saya"
      />

      {cv.status === "loading" ? <LoadingState label="Memuat assignment…" /> : null}
      {cv.status === "error" ? (
        <ProfileErrorState
          message={cv.error ?? "Gagal memuat assignment. Coba lagi."}
          onRetry={cv.refetch}
        />
      ) : null}

      {cv.status === "ready" && assignments.length === 0 ? (
        <EmptyState message="Belum ada assignment untuk Anda. Assignment ditetapkan oleh Chapter atau Operation." />
      ) : null}

      {cv.status === "ready" && active.length > 0 ? (
        <div className="grid grid-cols-1 gap-3 min-[860px]:grid-cols-2">
          {active.map((assignment) => (
            <Card className="flex min-w-0 flex-col gap-2" key={assignment.id}>
              <div className="flex min-w-0 flex-wrap items-center justify-between gap-2">
                <h2 className="tp-h3 min-w-0 break-words">{assignment.project.name}</h2>
                <AssignmentStatusBadge status={assignment.status} />
              </div>
              <p className="text-sm text-tp-text">{`Periode: ${periodLabel(assignment)}`}</p>
            </Card>
          ))}
        </div>
      ) : null}

      {cv.status === "ready" && assignments.length > 0 && active.length === 0 ? (
        <Card className="min-w-0">
          <p className="tp-empty">
            <strong>Tidak ada assignment aktif saat ini</strong>
            Riwayat assignment Anda tetap tersimpan di bawah.
          </p>
        </Card>
      ) : null}

      {cv.status === "ready" && history.length > 0 ? (
        <Card className="min-w-0">
          <div className="flex min-w-0 flex-wrap items-center justify-between gap-2">
            <h2 className="tp-h3">Riwayat</h2>
            <span className="tp-label">{`${history.length} selesai`}</span>
          </div>
          <div className="mt-3 min-w-0">
            <Table
              caption="Riwayat assignment"
              columns={[
                {
                  key: "project",
                  title: "Project",
                  rowHeader: true,
                  render: (_value, record) => record.project.name,
                },
                {
                  key: "period",
                  title: "Periode",
                  render: (_value, record) => periodLabel(record),
                },
                {
                  key: "status",
                  title: "Status",
                  render: (_value, record) => <AssignmentStatusBadge status={record.status} />,
                },
              ]}
              dataSource={history}
              minWidth={520}
              rowKey={(record) => record.id}
            />
          </div>
        </Card>
      ) : null}

      {cv.status === "ready" && assignments.length > 0 ? (
        <p className="text-[13px] leading-5 text-tp-muted">
          Peran, unit, dan utilisasi per assignment belum tersedia dari akun Talent; halaman ini
          membaca riwayat assignment pada profil CV Anda. Assignment ditetapkan Chapter atau
          Operation.
        </p>
      ) : null}
    </section>
  );
}
