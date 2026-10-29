"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { EmptyState, ErrorState, LoadingState } from "@/components/DataState";
import { Table } from "@/components/Table";
import { RowActionsMenu } from "@/components/RowActionsMenu";
import { useAssignableTalents } from "@/features/employees/useEmployees";
import { EMPLOYEE_DETAIL } from "@/lib/constants/routes";
import { orDash } from "@/lib/cell";

export function ChapterTalentTable() {
  const router = useRouter();
  const { status, data, error } = useAssignableTalents();

  if (status === "loading") return <LoadingState />;
  if (status === "error") return <ErrorState message={error ?? "Gagal memuat data."} />;
  if (!data || data.length === 0) {
    return <EmptyState message="Belum ada talent dalam cakupan chapter Anda." />;
  }

  return (
    <Table
      caption="Talent dalam cakupan chapter"
      columns={[
        {
          key: "name",
          title: "Nama",
          render: (_value, talent) => (
            <Link
              className="font-medium text-zinc-900 hover:underline"
              href={EMPLOYEE_DETAIL(talent.id)}
            >
              {talent.fullName}
            </Link>
          ),
        },
        {
          key: "nomorInduk",
          title: "Nomor Induk",
          className: "text-zinc-600",
          render: (_value, talent) => orDash(talent.nomorInduk),
        },
        {
          key: "actions",
          title: "Aksi",
          className: "col-action",
          render: (_value, talent) => (
            <RowActionsMenu
              actions={[
                {
                  label: "Lihat detail",
                  onSelect: () => router.push(EMPLOYEE_DETAIL(talent.id)),
                },
              ]}
              label={`Aksi ${talent.fullName}`}
            />
          ),
        },
      ]}
      dataSource={data}
      rowKey={(talent) => talent.id}
    />
  );
}
