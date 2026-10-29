"use client";

import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { Select } from "@/components/Select";
import {
  AddCvEducationDocument,
  DeleteCvEducationDocument,
  MyCvProfileDocument,
  UpdateCvEducationDocument,
  type CvEducationInput,
  type CvFieldsFragment,
  type EducationLevel,
} from "@/generated/graphql";
import { CvSectionCard } from "./CvSectionCard";
import { EDUCATION_LEVELS, formatDegree } from "./educationLevels";
import { useCvCollection } from "./useCvCollection";

type EducationItem = CvFieldsFragment["educations"][number];

type EducationValues = {
  degree: EducationLevel | "";
  endYear: string;
  fieldOfStudy: string;
  institution: string;
  startYear: string;
};

function createEducationValues(): EducationValues {
  return {
    degree: "",
    endYear: "",
    fieldOfStudy: "",
    institution: "",
    startYear: "",
  };
}

function toEducationValues(education: EducationItem): EducationValues {
  return {
    degree: (education.degree as EducationLevel | null) ?? "",
    endYear: education.endYear ? String(education.endYear) : "",
    fieldOfStudy: education.fieldOfStudy ?? "",
    institution: education.institution,
    startYear: education.startYear ? String(education.startYear) : "",
  };
}

function buildEducationInput(values: EducationValues): CvEducationInput {
  return {
    degree: values.degree || null,
    endYear: values.endYear ? Number(values.endYear) : null,
    fieldOfStudy: values.fieldOfStudy.trim() || null,
    institution: values.institution.trim(),
    startYear: values.startYear ? Number(values.startYear) : null,
  };
}

export function CvEducationsSection({
  cv,
}: {
  cv: CvFieldsFragment | undefined;
}) {
  const {
    isEditing,
    removeItem,
    reset,
    saving,
    setValues,
    startEditing,
    submit,
    values,
  } = useCvCollection<EducationItem, EducationValues, CvEducationInput>({
    addDocument: AddCvEducationDocument,
    buildInput: buildEducationInput,
    createValues: createEducationValues,
    getItemId: (education) => education.id,
    messages: {
      added: "Riwayat pendidikan ditambahkan.",
      addFailed: "Gagal menambah pendidikan.",
      deleted: "Riwayat pendidikan dihapus.",
      deleteFailed: "Gagal menghapus pendidikan.",
      updateFailed: "Gagal memperbarui pendidikan.",
      updated: "Riwayat pendidikan diperbarui.",
    },
    refetchDocument: MyCvProfileDocument,
    removeDocument: DeleteCvEducationDocument,
    toValues: toEducationValues,
    updateDocument: UpdateCvEducationDocument,
  });

  return (
    <CvSectionCard title="Pendidikan">
      {cv?.educations.length ? (
        <ul className="flex flex-col gap-2">
          {cv.educations.map((education) => (
            <li
              className="flex items-start justify-between gap-3 rounded-md border border-board-border px-3 py-2 text-sm"
              key={education.id}
            >
              <div>
                <p className="font-medium text-zinc-900">
                  {education.institution}
                  {education.degree ? ` — ${formatDegree(education.degree)}` : ""}
                </p>
                <p className="text-xs text-zinc-500">
                  {[
                    education.fieldOfStudy,
                    [education.startYear, education.endYear]
                      .filter(Boolean)
                      .join("–"),
                  ]
                    .filter(Boolean)
                    .join(" · ") || "—"}
                </p>
              </div>
              <div className="flex shrink-0 gap-1">
                <button
                  aria-label={`Ubah ${education.institution}`}
                  className="rounded-md px-2 py-1 text-xs font-medium text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800"
                  onClick={() => startEditing(education)}
                  type="button"
                >
                  Ubah
                </button>
                <button
                  className="rounded-md px-2 py-1 text-xs font-medium text-zinc-500 hover:bg-red-50 hover:text-red-700"
                  onClick={() => removeItem(education.id)}
                  type="button"
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

      <form
        className="grid grid-cols-1 gap-2 sm:grid-cols-2"
        onSubmit={submit}
      >
        <Input
          onChange={(event) =>
            setValues((current) => ({
              ...current,
              institution: event.target.value,
            }))
          }
          placeholder="Institusi (wajib)"
          required
          value={values.institution}
        />
        <Select
          aria-label="Jenjang pendidikan"
          onChange={(event) =>
            setValues((current) => ({
              ...current,
              degree: event.target.value as EducationLevel | "",
            }))
          }
          options={[
            { label: "— pilih jenjang (opsional) —", value: "" },
            ...EDUCATION_LEVELS.map((level) => ({
              label: level.label,
              value: level.value,
            })),
          ]}
          value={values.degree}
        />
        <Input
          onChange={(event) =>
            setValues((current) => ({
              ...current,
              fieldOfStudy: event.target.value,
            }))
          }
          placeholder="Jurusan"
          value={values.fieldOfStudy}
        />
        <div className="flex gap-2">
          <Input
            inputMode="numeric"
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                startYear: event.target.value,
              }))
            }
            placeholder="Tahun mulai"
            value={values.startYear}
          />
          <Input
            inputMode="numeric"
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                endYear: event.target.value,
              }))
            }
            placeholder="Tahun selesai"
            value={values.endYear}
          />
        </div>
        <div className="flex gap-2 sm:col-span-2">
          <Button
            disabled={saving || !values.institution.trim()}
            type="submit"
          >
            {isEditing ? "Simpan Perubahan" : "+ Tambah Pendidikan"}
          </Button>
          {isEditing ? (
            <Button
              disabled={saving}
              onClick={reset}
              type="button"
              variant="secondary"
            >
              Batal
            </Button>
          ) : null}
        </div>
      </form>
    </CvSectionCard>
  );
}
