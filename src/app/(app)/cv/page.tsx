"use client";

import * as React from "react";
import { useMutation } from "@apollo/client";
import { ErrorState, LoadingState } from "@/components/DataState";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Input } from "@/components/Input";
import { InputControl } from "@/components/InputControl";
import { Select } from "@/components/Select";
import { PageHeader } from "@/components/PageHeader";
import { useToast } from "@/components/Toast";
import { useSessionRole } from "@/lib/auth/guard";
import { AssignmentStatusBadge } from "@/features/assignments/AssignmentStatusBadge";
import { useMyCvProfile } from "@/features/cv/useMyCvProfile";
import { useCvProfile } from "@/features/cv/useCvProfile";
import { useEmployees } from "@/features/employees/useEmployees";
import {
  AddCvCertificationDocument,
  AddCvEducationDocument,
  AddCvSkillDocument,
  DeleteCvCertificationDocument,
  DeleteCvEducationDocument,
  DeleteCvSkillDocument,
  MyCvProfileDocument,
  UpdateCvCertificationDocument,
  UpdateCvEducationDocument,
  UpdateCvSkillDocument,
  UpsertCvProfileDocument,
  type CvFieldsFragment,
  type EducationLevel,
} from "@/generated/graphql";

const LABEL =
  "w-full rounded-md border border-surface-border bg-white px-3 py-1.5 text-sm text-zinc-900 shadow-sm";

/** D11 — dropdown terkontrol lima nilai jenjang (disahkan pemilik produk 2026-10-10).
 * Nilai = enum `EducationLevel` (kontrak SDL); label = tampilan D11. */
const EDUCATION_LEVELS: readonly { value: EducationLevel; label: string }[] = [
  { value: "SMA_SMK_SEDERAJAT", label: "SMA/SMK Sederajat" },
  { value: "D3", label: "D3" },
  { value: "S1", label: "S1" },
  { value: "S2", label: "S2" },
  { value: "S3", label: "S3" },
];

/** Tampilan D11: nilai enum → label; entri legacy free-text tampil apa adanya. */
function formatDegree(degree: string | null | undefined): string {
  if (!degree) return "";
  return EDUCATION_LEVELS.find((level) => level.value === degree)?.label ?? degree;
}

/**
 * CV profile (FR-12/FR-13) — US4.
 * Talent edits their own structured CV (summary, educations, certifications,
 * skills) one section at a time; work experience is derived from assignment
 * history (never hand-entered). Chapter, Operation and Admin get a read-only
 * view — Chapter for a talent in its scope, Operation and Admin for any talent
 * (TAN-212 clarify 4 + 2026-10-16 clarify 6).
 * Other roles are blocked at the UI layer (server enforces FR-16).
 */
export default function CvPage() {
  const role = useSessionRole();
  if (role === "TALENT") return <TalentCvEditor />;
  if (role === "CHAPTER") return <CvRosterViewer audience="CHAPTER" />;
  // Admin manages every active module (TAN-212 clarify 4) and Operation reads
  // every talent (2026-10-16): a read-only roster view in both cases, since a
  // CV is personal content owned by its talent (FR-13).
  if (role === "OPERATION" || role === "ADMIN") return <CvRosterViewer audience={role} />;
  return (
    <section className="flex flex-col gap-4">
      <PageHeader title="Profil CV" subtitle="Fitur CV hanya untuk peran Talent, Chapter, Operation, dan Admin (FR-13)." />
    </section>
  );
}

function TalentCvEditor() {
  const { status, data, error } = useMyCvProfile();
  if (status === "loading") return <LoadingState />;
  if (status === "error") return <ErrorState message={error ?? "Gagal memuat profil CV."} />;

  return (
    <section className="flex flex-col gap-4">
      <PageHeader
        title="Profil CV"
        subtitle="Isi setiap bagian lalu simpan; pengalaman kerja terisi otomatis dari riwayat assignment."
      />
      <SummarySection cv={data} />
      <EducationsSection cv={data} />
      <CertificationsSection cv={data} />
      <SkillsSection cv={data} />
      <WorkExperienceSection cv={data} />
    </section>
  );
}

function SummarySection({ cv }: { cv: CvFieldsFragment | undefined }) {
  const { pushToast } = useToast();
  const [upsert, { loading }] = useMutation(UpsertCvProfileDocument, {
    refetchQueries: [{ query: MyCvProfileDocument }],
  });
  const [summary, setSummary] = React.useState(cv?.summary ?? "");


  async function onSave() {
    try {
      await upsert({ variables: { input: { summary: summary.trim() || null } } });
      pushToast("success", "Ringkasan profil disimpan.");
    } catch (err) {
      pushToast("error", err instanceof Error ? err.message : "Gagal menyimpan ringkasan.");
    }
  }

  return (
    <Card className="flex flex-col gap-3">
      <h2 className="text-base font-semibold text-zinc-900">Ringkasan Profil</h2>
      <InputControl label="Ringkasan">
        <textarea
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          rows={4}
          placeholder="Tulis ringkasan singkat tentang diri Anda…"
          className={LABEL}
        />
      </InputControl>
      <div>
        <Button onClick={onSave} disabled={loading}>
          Simpan Ringkasan
        </Button>
      </div>
    </Card>
  );
}

function EducationsSection({ cv }: { cv: CvFieldsFragment | undefined }) {
  const { pushToast } = useToast();
  const refetch = { refetchQueries: [{ query: MyCvProfileDocument }] };
  const [add, { loading: adding }] = useMutation(AddCvEducationDocument, refetch);
  const [update, { loading: updating }] = useMutation(UpdateCvEducationDocument, refetch);
  const [remove] = useMutation(DeleteCvEducationDocument, refetch);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [institution, setInstitution] = React.useState("");
  const [degree, setDegree] = React.useState<EducationLevel | "">("");
  const [fieldOfStudy, setFieldOfStudy] = React.useState("");
  const [startYear, setStartYear] = React.useState("");
  const [endYear, setEndYear] = React.useState("");
  const saving = adding || updating;

  function reset() {
    setEditingId(null);
    setInstitution("");
    setDegree("");
    setFieldOfStudy("");
    setStartYear("");
    setEndYear("");
  }

  /** Load one stored entry into the form so it can be corrected in place (US4 skenario 3). */
  function fillFrom(edu: CvFieldsFragment["educations"][number]) {
    setEditingId(edu.id);
    setInstitution(edu.institution);
    setDegree((edu.degree as EducationLevel | null) ?? "");
    setFieldOfStudy(edu.fieldOfStudy ?? "");
    setStartYear(edu.startYear ? String(edu.startYear) : "");
    setEndYear(edu.endYear ? String(edu.endYear) : "");
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const input = {
      institution: institution.trim(),
      degree: degree || null,
      fieldOfStudy: fieldOfStudy.trim() || null,
      startYear: startYear ? Number(startYear) : null,
      endYear: endYear ? Number(endYear) : null,
    };
    try {
      if (editingId) {
        await update({ variables: { id: editingId, input } });
        pushToast("success", "Riwayat pendidikan diperbarui.");
      } else {
        await add({ variables: { input } });
        pushToast("success", "Riwayat pendidikan ditambahkan.");
      }
      reset();
    } catch (err) {
      pushToast(
        "error",
        err instanceof Error
          ? err.message
          : editingId
            ? "Gagal memperbarui pendidikan."
            : "Gagal menambah pendidikan.",
      );
    }
  }

  async function onDelete(id: string) {
    try {
      await remove({ variables: { id } });
      pushToast("success", "Riwayat pendidikan dihapus.");
    } catch (err) {
      pushToast("error", err instanceof Error ? err.message : "Gagal menghapus pendidikan.");
    }
  }

  return (
    <Card className="flex flex-col gap-3">
      <h2 className="text-base font-semibold text-zinc-900">Pendidikan</h2>
      {cv?.educations.length ? (
        <ul className="flex flex-col gap-2">
          {cv.educations.map((edu) => (
            <li key={edu.id} className="flex items-start justify-between gap-3 rounded-md border border-board-border px-3 py-2 text-sm">
              <div>
                <p className="font-medium text-zinc-900">
                  {edu.institution}
                  {edu.degree ? ` — ${formatDegree(edu.degree)}` : ""}
                </p>
                <p className="text-xs text-zinc-500">
                  {[edu.fieldOfStudy, [edu.startYear, edu.endYear].filter(Boolean).join("–")]
                    .filter(Boolean)
                    .join(" · ") || "—"}
                </p>
              </div>
              <div className="flex shrink-0 gap-1">
                <button
                  type="button"
                  aria-label={`Ubah ${edu.institution}`}
                  onClick={() => fillFrom(edu)}
                  className="rounded-md px-2 py-1 text-xs font-medium text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800"
                >
                  Ubah
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(edu.id)}
                  className="rounded-md px-2 py-1 text-xs font-medium text-zinc-500 hover:bg-red-50 hover:text-red-700"
                >
                  Hapus
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-zinc-500">Belum ada riwayat pendidikan.</p>
      )}

      <form onSubmit={onSubmit} className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <Input value={institution} onChange={(e) => setInstitution(e.target.value)} placeholder="Institusi (wajib)" required />
        <Select
          value={degree}
          onChange={(e) => setDegree(e.target.value as EducationLevel | "")}
          aria-label="Jenjang pendidikan"
          options={[
            { value: "", label: "— pilih jenjang (opsional) —" },
            ...EDUCATION_LEVELS.map((level) => ({ value: level.value, label: level.label })),
          ]}
        />
        <Input value={fieldOfStudy} onChange={(e) => setFieldOfStudy(e.target.value)} placeholder="Jurusan" />
        <div className="flex gap-2">
          <Input value={startYear} onChange={(e) => setStartYear(e.target.value)} placeholder="Tahun mulai" inputMode="numeric" />
          <Input value={endYear} onChange={(e) => setEndYear(e.target.value)} placeholder="Tahun selesai" inputMode="numeric" />
        </div>
        <div className="flex gap-2 sm:col-span-2">
          <Button type="submit" disabled={saving || !institution.trim()}>
            {editingId ? "Simpan Perubahan" : "+ Tambah Pendidikan"}
          </Button>
          {editingId ? (
            <Button type="button" variant="secondary" onClick={reset} disabled={saving}>
              Batal
            </Button>
          ) : null}
        </div>
      </form>
    </Card>
  );
}

function CertificationsSection({ cv }: { cv: CvFieldsFragment | undefined }) {
  const { pushToast } = useToast();
  const refetch = { refetchQueries: [{ query: MyCvProfileDocument }] };
  const [add, { loading: adding }] = useMutation(AddCvCertificationDocument, refetch);
  const [update, { loading: updating }] = useMutation(UpdateCvCertificationDocument, refetch);
  const [remove] = useMutation(DeleteCvCertificationDocument, refetch);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [name, setName] = React.useState("");
  const [issuer, setIssuer] = React.useState("");
  const saving = adding || updating;

  function reset() {
    setEditingId(null);
    setName("");
    setIssuer("");
  }

  /** Load one stored entry into the form so it can be corrected in place (US4 skenario 3). */
  function fillFrom(cert: CvFieldsFragment["certifications"][number]) {
    setEditingId(cert.id);
    setName(cert.name);
    setIssuer(cert.issuer ?? "");
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const input = { name: name.trim(), issuer: issuer.trim() || null };
    try {
      if (editingId) {
        await update({ variables: { id: editingId, input } });
        pushToast("success", "Sertifikasi diperbarui.");
      } else {
        await add({ variables: { input } });
        pushToast("success", "Sertifikasi ditambahkan.");
      }
      reset();
    } catch (err) {
      pushToast(
        "error",
        err instanceof Error
          ? err.message
          : editingId
            ? "Gagal memperbarui sertifikasi."
            : "Gagal menambah sertifikasi.",
      );
    }
  }

  async function onDelete(id: string) {
    try {
      await remove({ variables: { id } });
      pushToast("success", "Sertifikasi dihapus.");
    } catch (err) {
      pushToast("error", err instanceof Error ? err.message : "Gagal menghapus sertifikasi.");
    }
  }

  return (
    <Card className="flex flex-col gap-3">
      <h2 className="text-base font-semibold text-zinc-900">Sertifikasi</h2>
      {cv?.certifications.length ? (
        <ul className="flex flex-col gap-2">
          {cv.certifications.map((cert) => (
            <li key={cert.id} className="flex items-start justify-between gap-3 rounded-md border border-board-border px-3 py-2 text-sm">
              <div>
                <p className="font-medium text-zinc-900">{cert.name}</p>
                <p className="text-xs text-zinc-500">{cert.issuer || "—"}</p>
              </div>
              <div className="flex shrink-0 gap-1">
                <button
                  type="button"
                  aria-label={`Ubah ${cert.name}`}
                  onClick={() => fillFrom(cert)}
                  className="rounded-md px-2 py-1 text-xs font-medium text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800"
                >
                  Ubah
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(cert.id)}
                  className="rounded-md px-2 py-1 text-xs font-medium text-zinc-500 hover:bg-red-50 hover:text-red-700"
                >
                  Hapus
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-zinc-500">Belum ada sertifikasi.</p>
      )}

      <form onSubmit={onSubmit} className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama sertifikasi (wajib)" required />
        <Input value={issuer} onChange={(e) => setIssuer(e.target.value)} placeholder="Penerbit" />
        <div className="flex gap-2 sm:col-span-2">
          <Button type="submit" disabled={saving || !name.trim()}>
            {editingId ? "Simpan Perubahan" : "+ Tambah Sertifikasi"}
          </Button>
          {editingId ? (
            <Button type="button" variant="secondary" onClick={reset} disabled={saving}>
              Batal
            </Button>
          ) : null}
        </div>
      </form>
    </Card>
  );
}

function SkillsSection({ cv }: { cv: CvFieldsFragment | undefined }) {
  const { pushToast } = useToast();
  const refetch = { refetchQueries: [{ query: MyCvProfileDocument }] };
  const [add, { loading: adding }] = useMutation(AddCvSkillDocument, refetch);
  const [update, { loading: updating }] = useMutation(UpdateCvSkillDocument, refetch);
  const [remove] = useMutation(DeleteCvSkillDocument, refetch);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [name, setName] = React.useState("");
  const [level, setLevel] = React.useState("");
  const saving = adding || updating;

  function reset() {
    setEditingId(null);
    setName("");
    setLevel("");
  }

  /** Load one stored entry into the form so it can be corrected in place (US4 skenario 3). */
  function fillFrom(skill: CvFieldsFragment["skills"][number]) {
    setEditingId(skill.id);
    setName(skill.name);
    setLevel(skill.level ?? "");
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const input = { name: name.trim(), level: level.trim() || null };
    try {
      if (editingId) {
        await update({ variables: { id: editingId, input } });
        pushToast("success", "Keahlian diperbarui.");
      } else {
        await add({ variables: { input } });
        pushToast("success", "Keahlian ditambahkan.");
      }
      reset();
    } catch (err) {
      pushToast(
        "error",
        err instanceof Error
          ? err.message
          : editingId
            ? "Gagal memperbarui keahlian."
            : "Gagal menambah keahlian.",
      );
    }
  }

  async function onDelete(id: string) {
    try {
      await remove({ variables: { id } });
      pushToast("success", "Keahlian dihapus.");
    } catch (err) {
      pushToast("error", err instanceof Error ? err.message : "Gagal menghapus keahlian.");
    }
  }

  return (
    <Card className="flex flex-col gap-3">
      <h2 className="text-base font-semibold text-zinc-900">Keahlian</h2>
      {cv?.skills.length ? (
        <ul className="flex flex-col gap-2">
          {cv.skills.map((skill) => (
            <li key={skill.id} className="flex items-start justify-between gap-3 rounded-md border border-board-border px-3 py-2 text-sm">
              <div>
                <p className="font-medium text-zinc-900">{skill.name}</p>
                <p className="text-xs text-zinc-500">{skill.level || "—"}</p>
              </div>
              <div className="flex shrink-0 gap-1">
                <button
                  type="button"
                  aria-label={`Ubah ${skill.name}`}
                  onClick={() => fillFrom(skill)}
                  className="rounded-md px-2 py-1 text-xs font-medium text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800"
                >
                  Ubah
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(skill.id)}
                  className="rounded-md px-2 py-1 text-xs font-medium text-zinc-500 hover:bg-red-50 hover:text-red-700"
                >
                  Hapus
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-zinc-500">Belum ada keahlian.</p>
      )}

      <form onSubmit={onSubmit} className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama keahlian (wajib)" required />
        <Input value={level} onChange={(e) => setLevel(e.target.value)} placeholder="Level (cth: Mahir)" />
        <div className="flex gap-2 sm:col-span-2">
          <Button type="submit" disabled={saving || !name.trim()}>
            {editingId ? "Simpan Perubahan" : "+ Tambah Keahlian"}
          </Button>
          {editingId ? (
            <Button type="button" variant="secondary" onClick={reset} disabled={saving}>
              Batal
            </Button>
          ) : null}
        </div>
      </form>
    </Card>
  );
}

function WorkExperienceSection({ cv }: { cv: CvFieldsFragment | undefined }) {
  const experiences = cv?.workExperience ?? [];
  return (
    <Card className="flex flex-col gap-3">
      <h2 className="text-base font-semibold text-zinc-900">Pengalaman Kerja</h2>
      <p className="text-xs text-zinc-500">
        Terisi otomatis dari riwayat assignment — tidak dapat diinput manual (FR-12).
      </p>
      {experiences.length ? (
        <ul className="flex flex-col gap-2">
          {experiences.map((exp) => (
            <li key={exp.id} className="flex items-start justify-between gap-3 rounded-md border border-board-border px-3 py-2 text-sm">
              <div>
                <p className="font-medium text-zinc-900">{exp.project.name}</p>
                <p className="text-xs text-zinc-500">
                  {exp.jobRole.name} · {exp.periodStart}
                  {exp.periodEnd ? ` — ${exp.periodEnd}` : " — sekarang"}
                </p>
              </div>
              <AssignmentStatusBadge status={exp.status} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-zinc-500">Belum ada riwayat assignment.</p>
      )}
    </Card>
  );
}

function CvRosterViewer({ audience }: { audience: "CHAPTER" | "OPERATION" | "ADMIN" }) {
  const talents = useEmployees({ assignableOnly: true });
  const [selected, setSelected] = React.useState("");
  const { status, data, error } = useCvProfile(selected || null);

  if (talents.status === "loading") return <LoadingState />;
  if (talents.status === "error")
    return <ErrorState message={talents.error ?? "Gagal memuat daftar talent."} />;

  return (
    <section className="flex flex-col gap-4">
      <PageHeader
        title="Profil CV Talent"
        subtitle={
          audience === "CHAPTER"
            ? "Lihat profil CV talent dalam chapter Anda (hanya-baca, FR-13)."
            : "Lihat profil CV seluruh talent (hanya-baca; konten CV milik talent, FR-13)."
        }
      />
      <InputControl label="Pilih Talent">
        <select
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          className={LABEL}
        >
          <option value="">— pilih talent —</option>
          {(talents.employees ?? []).map((emp) => (
            <option key={emp.id} value={emp.id}>
              {emp.fullName} ({emp.nomorInduk ?? "—"})
            </option>
          ))}
        </select>
      </InputControl>

      {!selected ? null : status === "loading" ? (
        <LoadingState label="Memuat CV…" />
      ) : status === "error" ? (
        <ErrorState message={error ?? "Gagal memuat CV."} />
      ) : !data ? (
        <EmptyNote message="Talent ini belum memiliki profil CV." />
      ) : (
        <ReadOnlyCv cv={data} />
      )}
    </section>
  );
}

function ReadOnlyCv({ cv }: { cv: CvFieldsFragment }) {
  const summary = cv.summary;
  return (
    <div className="flex flex-col gap-4">
      <Card className="flex flex-col gap-2">
        <h2 className="text-base font-semibold text-zinc-900">Ringkasan Profil</h2>
        <p className="text-sm text-zinc-800">{summary || "—"}</p>
      </Card>
      <Card className="flex flex-col gap-2">
        <h2 className="text-base font-semibold text-zinc-900">Pendidikan</h2>
        {cv.educations.length ? (
          <ul className="flex flex-col gap-1.5">
            {cv.educations.map((edu) => (
              <li key={edu.id} className="text-sm text-zinc-800">
                {edu.institution}
                {edu.degree ? ` — ${formatDegree(edu.degree)}` : ""}
                <span className="ml-2 text-xs text-zinc-500">
                  {[edu.fieldOfStudy, [edu.startYear, edu.endYear].filter(Boolean).join("–")]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-zinc-500">—</p>
        )}
      </Card>
      <Card className="flex flex-col gap-2">
        <h2 className="text-base font-semibold text-zinc-900">Sertifikasi</h2>
        {cv.certifications.length ? (
          <ul className="flex flex-col gap-1.5">
            {cv.certifications.map((cert) => (
              <li key={cert.id} className="text-sm text-zinc-800">
                {cert.name}
                <span className="ml-2 text-xs text-zinc-500">{cert.issuer || ""}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-zinc-500">—</p>
        )}
      </Card>
      <Card className="flex flex-col gap-2">
        <h2 className="text-base font-semibold text-zinc-900">Keahlian</h2>
        {cv.skills.length ? (
          <ul className="flex flex-col gap-1.5">
            {cv.skills.map((skill) => (
              <li key={skill.id} className="text-sm text-zinc-800">
                {skill.name}
                <span className="ml-2 text-xs text-zinc-500">{skill.level || ""}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-zinc-500">—</p>
        )}
      </Card>
      <Card className="flex flex-col gap-2">
        <h2 className="text-base font-semibold text-zinc-900">Pengalaman Kerja</h2>
        <p className="text-xs text-zinc-500">Terisi otomatis dari riwayat assignment (FR-12).</p>
        {cv.workExperience.length ? (
          <ul className="flex flex-col gap-1.5">
            {cv.workExperience.map((exp) => (
              <li key={exp.id} className="flex items-start justify-between gap-3 text-sm">
                <span className="text-zinc-800">
                  {exp.project.name} — {exp.jobRole.name}
                  <span className="ml-2 text-xs text-zinc-500">
                    {exp.periodStart}
                    {exp.periodEnd ? ` — ${exp.periodEnd}` : " — sekarang"}
                  </span>
                </span>
                <AssignmentStatusBadge status={exp.status} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-zinc-500">—</p>
        )}
      </Card>
    </div>
  );
}

function EmptyNote({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-dashed border-zinc-300 bg-board p-8 text-center text-sm text-zinc-500 shadow-sm">
      {message}
    </div>
  );
}