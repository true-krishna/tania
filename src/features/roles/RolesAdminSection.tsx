"use client";

import * as React from "react";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { ErrorState, LoadingState } from "@/components/DataState";
import { PageHeader } from "@/components/PageHeader";
import { useToast } from "@/components/Toast";
import type { AccessRole, MenuAccessLevel, RoleStatus } from "@/generated/graphql/types";
import { CustomRolesPanel } from "./CustomRolesPanel";
import { MenuGrid, type GridDraft } from "./MenuGrid";
import { SidebarPreview } from "./SidebarPreview";
import { useRoleMenuConfig, useRoleMutations, useRoles, type Role } from "./useRoles";
import {
  MENU_ROWS,
  cellOf,
  gridCells,
  gridInput,
  gridOf,
  visibleRowCount,
  type GridCell,
  type RoleGrid,
} from "./menuGrid";

/**
 * Admin configuration page body (W3 / TAN-264, FR-03 amandemen).
 *
 * One screen, three parts: the menu × role grid, the custom-role manager, and
 * the sidebar preview of a role's draft. Saving a column writes that role's
 * configuration; the server invalidates the permission snapshot, so the change
 * reaches an open session on its next request — no re-deploy (AC4).
 */
export function RolesAdminSection() {
  const roles = useRoles(true);
  const config = useRoleMenuConfig();
  const mutations = useRoleMutations();
  const { pushToast } = useToast();

  const [draft, setDraft] = React.useState<GridDraft>({});
  const [busyRoleId, setBusyRoleId] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [confirmReset, setConfirmReset] = React.useState<Role | null>(null);
  const [previewRole, setPreviewRole] = React.useState<Role | null>(null);

  // The server's grids are the baseline: every draft starts from them, and a
  // refetch (after save, reset, or a role change) re-seeds it. Resetting during
  // render — the documented "adjusting state when a prop changes" pattern — keeps
  // the draft and the fetched grid in step without a cascading render.
  const saved = React.useMemo<GridDraft>(() => {
    const cells = config.data ?? [];
    const next: GridDraft = {};
    for (const role of roles.data ?? []) next[role.id] = gridOf(cells, role.name);
    return next;
  }, [roles.data, config.data]);

  const [seeded, setSeeded] = React.useState<GridDraft | null>(null);
  if (seeded !== saved) {
    setSeeded(saved);
    setDraft(saved);
  }

  if (roles.status === "loading" || config.status === "loading") return <LoadingState />;
  if (roles.status === "error") return <ErrorState message={roles.error ?? "Gagal memuat role."} />;
  if (config.status === "error") {
    return <ErrorState message={config.error ?? "Gagal memuat konfigurasi menu."} />;
  }

  const allRoles = roles.data ?? [];

  function changeCell(roleId: string, entryId: string, level: MenuAccessLevel) {
    setDraft((current) => ({
      ...current,
      [roleId]: { ...(current[roleId] ?? {}), [entryId]: cellOf(level) },
    }));
  }

  async function report(fn: () => Promise<unknown>, ok: string) {
    setSaving(true);
    try {
      await fn();
      await Promise.all([config.refetch(), roles.refetch()]);
      pushToast("success", ok);
    } catch (err) {
      pushToast("error", err instanceof Error ? err.message : "Gagal menyimpan konfigurasi.");
    } finally {
      setSaving(false);
      setBusyRoleId(null);
    }
  }

  async function saveRole(role: Role) {
    setBusyRoleId(role.id);
    await report(
      () => mutations.saveMenuAccess(role.id, gridInput(draft[role.id] ?? {})),
      `Konfigurasi menu ${role.label} tersimpan.`,
    );
  }

  async function resetRole(role: Role) {
    setConfirmReset(null);
    setBusyRoleId(role.id);
    await report(
      () => mutations.resetMenuConfig(role.id),
      `Konfigurasi menu ${role.label} kembali ke default.`,
    );
  }

  const previewCells: GridCell[] = previewRole
    ? gridCells(previewRole.id, previewRole.name, draft[previewRole.id] ?? {})
    : [];

  return (
    <section className="flex flex-col gap-6">
      <PageHeader
        title="Menu & Akses per Role"
        subtitle="Atur menu yang tampil dan tingkat akses tiap role. Perubahan berlaku tanpa deploy ulang."
      />

      <Card className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-col">
            <h2 className="text-base font-semibold text-zinc-900">Grid Menu × Role</h2>
            <p className="text-sm text-tp-muted">
              {MENU_ROWS.length} entri menu. &ldquo;Tidak tampil&rdquo; menyembunyikan sekaligus
              menutup akses; sel terkunci mengikuti aturan server.
            </p>
          </div>
          {saving ? <span className="text-sm text-tp-muted">Menyimpan…</span> : null}
        </div>

        <MenuGrid
          roles={allRoles}
          draft={draft}
          saved={saved}
          busyRoleId={busyRoleId}
          onChangeCell={changeCell}
          onSaveRole={(role) => void saveRole(role)}
          onResetRole={(role) => setConfirmReset(role)}
          onPreviewRole={(role) => setPreviewRole(role)}
        />

        {allRoles.length ? (
          <p className="text-xs text-tp-muted">
            {allRoles
              .map((role) => `${role.label}: ${visibleRowCount(draft[role.id] ?? {})}/${MENU_ROWS.length}`)
              .join(" · ")}
          </p>
        ) : null}
      </Card>

      {confirmReset ? (
        <Card className="flex flex-col gap-3">
          <p className="text-sm text-zinc-700">
            Kembalikan konfigurasi menu <span className="font-medium">{confirmReset.label}</span> ke
            matriks default FR-03? Semua penyesuaian role ini akan hilang.
          </p>
          <div className="flex gap-2">
            <Button type="button" disabled={saving} onClick={() => void resetRole(confirmReset)}>
              Ya, reset ke default
            </Button>
            <Button type="button" variant="secondary" onClick={() => setConfirmReset(null)}>
              Batal
            </Button>
          </div>
        </Card>
      ) : null}

      <Card>
        <SidebarPreview role={previewRole} cells={previewCells} />
      </Card>

      <CustomRolesPanel
        roles={allRoles}
        busy={saving}
        onCreate={(name, label, templateRole: AccessRole) =>
          report(() => mutations.createRole(name, label, templateRole), `Role "${label}" dibuat.`)
        }
        onRename={(id, label) =>
          report(() => mutations.renameRole(id, label), "Label role diperbarui.")
        }
        onSetStatus={(id, status: RoleStatus) =>
          report(
            () => mutations.setRoleStatus(id, status),
            status === "ACTIVE" ? "Role diaktifkan." : "Role dinonaktifkan.",
          )
        }
        onDelete={(id) => report(() => mutations.deleteRole(id), "Role dihapus.")}
      />
    </section>
  );
}

export type { RoleGrid };
