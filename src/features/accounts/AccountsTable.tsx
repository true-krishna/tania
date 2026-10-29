import { EmptyState } from "@/components/DataState";
import { Table, type TableColumn } from "@/components/Table";
import type { UsersQuery } from "@/generated/graphql";

type Account = UsersQuery["users"][number];

type AccountsPagination = React.ComponentProps<typeof Table>["pagination"];

export function AccountsTable({
  accounts,
  filteredAccounts,
  columns,
  pageRows,
  pagination,
}: {
  accounts: readonly Account[] | undefined;
  filteredAccounts: readonly Account[];
  columns: TableColumn<Account>[];
  pageRows: readonly Account[];
  pagination: AccountsPagination;
}) {
  if (!accounts || accounts.length === 0) {
    return <EmptyState message="Belum ada akun pengguna." />;
  }
  if (filteredAccounts.length === 0) {
    return <p className="text-sm text-tp-muted">Tidak ada akun yang cocok dengan pencarian.</p>;
  }

  return (
    <Table
      caption="Daftar akun pengguna"
      columns={columns}
      dataSource={pageRows}
      pagination={pagination}
      rowKey={(account) => account.id}
    />
  );
}
