import { EmptyState } from "@/components/DataState";
import { Table, type TableColumn } from "@/components/Table";
import type { MasterDataItem } from "./MasterDataSection";

type MasterDataPagination = React.ComponentProps<typeof Table>["pagination"];

export function MasterDataTable<T extends MasterDataItem>({
  caption,
  emptyMessage,
  items,
  visibleItems,
  pageRows,
  pagination,
  columns,
}: {
  caption: string;
  emptyMessage: string;
  items: readonly T[] | undefined;
  visibleItems: readonly T[] | undefined;
  pageRows: readonly T[];
  pagination: MasterDataPagination;
  columns: TableColumn<T>[];
}) {
  if (!items || items.length === 0) return <EmptyState message={emptyMessage} />;
  if (visibleItems && visibleItems.length === 0) {
    return <p className="text-sm text-tp-muted">Tidak ada hasil yang cocok dengan pencarian.</p>;
  }

  return (
    <Table
      caption={caption}
      columns={columns}
      dataSource={pageRows}
      pagination={pagination}
      rowKey={(item) => item.id}
    />
  );
}
