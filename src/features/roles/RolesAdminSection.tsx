"use client";

import * as React from "react";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { ErrorState, LoadingState } from "@/components/DataState";
import { PageHeader } from "@/components/PageHeader";
import { useToast } from "@/components/Toast";
import type { AccessRole, MenuAccessLevel, RoleStatus } from "@/generated/graphql/types";
import { DEFAULT_MENU_ACCESS } from "@/lib/auth/menuAccess";
import { CustomRolesPanel } from "./CustomRolesPanel";
import { MenuGrid, type GridDraft } from "./RoleMenuGrid";
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
import { errorText } from "@/lib/errors";

function baselineGrid(role: Role): RoleGrid {
  return {
    ...(DEFAULT_MENU_ACCESS[role.templateRole] ?? {}),
    ...(DEFAULT_MENU_ACCESS[role.name] ?? {}),
  };
}

function seedGrid(role: Role, cells: readonly GridCell[]): RoleGrid {
  return { ...baselineGrid(role), ...gridOf(cells, role.name) };
}

export function RolesAdminSection() {
  const roles = useRoles(true);
  const config = useRoleMenuConfig();
  const mutations = useRoleMutations();
  const { pushToast } = useToast();

  const [edits, setEdits] = React.useState<GridDraft>({});
  const [dirty, setDirty] = React.useState<Record<string, boolean>>({});
  const [busyRoleId, setBusyRoleId] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [confirmReset, setConfirmReset] = React.useState<Role | null>(null);
  const [previewRole, setPreviewRole] = React.useState<Role | null>(null);

  const allRoles = React.useMemo(() => roles.data ?? [], [roles.data]);

  const saved = React.useMemo<GridDraft>(() => {
    const cells = config.data ?? [];
    const next: GridDraft = {};
    for (const role of allRoles) next[role.id] = seedGrid(role, cells);
    return next;
  }, [allRoles, config.data]);

  const draft = React.useMemo<GridDraft>(() => {
    const next: GridDraft = {};
    for (const role of allRoles) {
      next[role.id] = dirty[role.id]
        ? { ...(saved[role.id] ?? {}), ...(edits[role.id] ?? {}) }
        : (saved[role.id] ?? {});
    }
    return next;
  }, [allRoles, dirty, edits, saved]);

  if (roles.status === "loading" || config.status === "loading") return <LoadingState />;
  if (roles.status === "error") return <ErrorState message={roles.error ?? "Gagal memuat role."} />;
  if (config.status === "error") {
    return <ErrorState message={config.error ?? "Gagal memuat konfigurasi menu."} />;
  }

  function changeCell(roleId: string, entryId: string, level: MenuAccessLevel) {
    setEdits((current) => ({
      ...current,
      [roleId]: { ...(current[roleId] ?? {}), [entryId]: cellOf(level) },
    }));
    setDirty((current) => ({ ...current, [roleId]: true }));
  }

  function clearRoleDraft(roleId: string) {
    setEdits((current) => {
      if (!(roleId in current)) return current;
      const next = { ...current };
      delete next[roleId];
      return next;
    });
    setDirty((current) => ({ ...current, [roleId]: false }));
  }

  async function report(fn: () => Promise<unknown>, ok: string) {
    setSaving(true);
    try {
      await fn();
      await Promise.all([config.refetch(), roles.refetch()]);
      pushToast("success", ok);
    } catch (err) {
      pushToast("error", errorText(err, "Gagal menyimpan konfigurasi."));
      throw err;
    } finally {
      setSaving(false);
      setBusyRoleId(null);
    }
  }

  async function saveRole(role: Role) {
    setBusyRoleId(role.id);
    try {
      await report(
        () =>
          mutations.saveMenuAccess(role.id, gridInput(draft[role.id] ?? {}, baselineGrid(role))),
        `Konfigurasi menu ${role.label} tersimpan.`,
      );
      clearRoleDraft(role.id);
    } catch {
      return;
    }
  }

  async function resetRole(role: Role) {
    setConfirmReset(null);
    setBusyRoleId(role.id);
    try {
      await report(
        () => mutations.resetMenuConfig(role.id),
        `Konfigurasi menu ${role.label} kembali ke default.`,
      );
      clearRoleDraft(role.id);
    } catch {
      return;
    }
  }

  const previewCells: GridCell[] = previewRole
    ? gridCells(previewRole.id, previewRole.name, draft[previewRole.id] ?? {})
    : [];

  return (
    <section className="flex flex-col gap-6">
      <PageHeader
        subtitle="Atur menu yang tampil dan tingkat akses tiap role. Perubahan berlaku tanpa deploy ulang."
        title="Menu & Akses per Role"
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
          busyRoleId={busyRoleId}
          draft={draft}
          onChangeCell={changeCell}
          onPreviewRole={(role) => setPreviewRole(role)}
          onResetRole={(role) => setConfirmReset(role)}
          onSaveRole={(role) => void saveRole(role)}
          roles={allRoles}
          saved={saved}
        />

        {allRoles.length ? (
          <p className="text-xs text-tp-muted">
            {allRoles
              .map(
                (role) =>
                  `${role.label}: ${visibleRowCount(draft[role.id] ?? {})}/${MENU_ROWS.length}`,
              )
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
            <Button disabled={saving} onClick={() => void resetRole(confirmReset)} type="button">
              Ya, reset ke default
            </Button>
            <Button onClick={() => setConfirmReset(null)} type="button" variant="secondary">
              Batal
            </Button>
          </div>
        </Card>
      ) : null}

      <Card>
        <SidebarPreview cells={previewCells} role={previewRole} />
      </Card>

      <CustomRolesPanel
        busy={saving}
        onCreate={(name, label, templateRole: AccessRole) =>
          report(() => mutations.createRole(name, label, templateRole), `Role "${label}" dibuat.`)
        }
        onDelete={async (id) => {
          await report(() => mutations.deleteRole(id), "Role dihapus.");
          clearRoleDraft(id);
          setPreviewRole((current) => (current?.id === id ? null : current));
        }}
        onRename={(id, label) =>
          report(() => mutations.renameRole(id, label), "Label role diperbarui.")
        }
        onSetStatus={(id, status: RoleStatus) =>
          report(
            () => mutations.setRoleStatus(id, status),
            status === "ACTIVE" ? "Role diaktifkan." : "Role dinonaktifkan.",
          )
        }
        roles={allRoles}
      />
    </section>
  );
}

export type { RoleGrid };
