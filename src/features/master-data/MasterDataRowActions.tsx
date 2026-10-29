import { RowActionsMenu } from "@/components/RowActionsMenu";

export function MasterDataRowActions({
  editing,
  name,
  isActive,
  onEdit,
  onToggleActive,
}: {
  editing: boolean;
  name: string;
  isActive: boolean;
  onEdit: () => void;
  onToggleActive: () => void;
}) {
  if (editing) return <span className="text-xs text-zinc-400">Mengedit…</span>;

  return (
    <RowActionsMenu
      actions={[
        { label: "Ubah", onSelect: onEdit },
        {
          label: isActive ? "Nonaktifkan" : "Aktifkan",
          onSelect: onToggleActive,
        },
      ]}
      label={`Aksi ${name}`}
    />
  );
}
