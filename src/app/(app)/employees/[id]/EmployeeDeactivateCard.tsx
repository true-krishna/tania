import { Card } from "@/components/Card";

export function EmployeeDeactivateCard({
  manage,
  inactive,
  fullName,
  deactivating,
  onDeactivate,
}: {
  manage: boolean;
  inactive: boolean;
  fullName: string;
  deactivating: boolean;
  onDeactivate: () => void;
}) {
  if (!manage) return null;

  if (inactive) {
    return (
      <Card
        className="w-fit border-red-200 bg-red-50 px-4 py-2 text-sm text-zinc-500"
        padded={false}
      >
        Karyawan dinonaktifkan.
      </Card>
    );
  }

  return (
    <Card className="max-w-3xl border-red-200 bg-red-50">
      <div className="flex flex-col gap-3">
        <p className="text-sm text-red-800">
          Menonaktifkan <strong>{fullName}</strong> akan membuatnya tidak lagi assignable.
          Lanjutkan?
        </p>
        <div className="flex gap-2">
          <button
            className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
            disabled={deactivating}
            onClick={onDeactivate}
            type="button"
          >
            Ya, nonaktifkan
          </button>
        </div>
      </div>
    </Card>
  );
}
