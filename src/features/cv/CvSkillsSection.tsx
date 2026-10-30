"use client";

import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import {
  AddCvSkillDocument,
  DeleteCvSkillDocument,
  MyCvProfileDocument,
  UpdateCvSkillDocument,
  type CvFieldsFragment,
  type CvSkillInput,
} from "@/generated/graphql";
import { CvSectionCard } from "./CvSectionCard";
import { useCvCollection } from "./useCvCollection";

type SkillItem = CvFieldsFragment["skills"][number];

type SkillValues = {
  level: string;
  name: string;
};

function createSkillValues(): SkillValues {
  return { level: "", name: "" };
}

function toSkillValues(skill: SkillItem): SkillValues {
  return {
    level: skill.level ?? "",
    name: skill.name,
  };
}

function buildSkillInput(values: SkillValues): CvSkillInput {
  return {
    level: values.level.trim() || null,
    name: values.name.trim(),
  };
}

export function CvSkillsSection({ cv }: { cv: CvFieldsFragment | undefined }) {
  const { isEditing, removeItem, reset, saving, setValues, startEditing, submit, values } =
    useCvCollection<SkillItem, SkillValues, CvSkillInput>({
      addDocument: AddCvSkillDocument,
      buildInput: buildSkillInput,
      createValues: createSkillValues,
      getItemId: (skill) => skill.id,
      messages: {
        added: "Keahlian ditambahkan.",
        addFailed: "Gagal menambah keahlian.",
        deleted: "Keahlian dihapus.",
        deleteFailed: "Gagal menghapus keahlian.",
        updateFailed: "Gagal memperbarui keahlian.",
        updated: "Keahlian diperbarui.",
      },
      refetchDocument: MyCvProfileDocument,
      removeDocument: DeleteCvSkillDocument,
      toValues: toSkillValues,
      updateDocument: UpdateCvSkillDocument,
    });

  return (
    <CvSectionCard title="Keahlian">
      {cv?.skills.length ? (
        <ul className="flex flex-col gap-2">
          {cv.skills.map((skill) => (
            <li
              className="flex items-start justify-between gap-3 rounded-md border border-board-border px-3 py-2 text-sm"
              key={skill.id}
            >
              <div>
                <p className="font-medium text-zinc-900">{skill.name}</p>
                <p className="text-xs text-zinc-500">{skill.level || "—"}</p>
              </div>
              <div className="flex shrink-0 gap-1">
                <button
                  aria-label={`Ubah ${skill.name}`}
                  className="rounded-md px-2 py-1 text-xs font-medium text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800"
                  onClick={() => startEditing(skill)}
                  type="button"
                >
                  Ubah
                </button>
                <button
                  className="rounded-md px-2 py-1 text-xs font-medium text-zinc-500 hover:bg-red-50 hover:text-red-700"
                  onClick={() => removeItem(skill.id)}
                  type="button"
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

      <form className="grid grid-cols-1 gap-2 min-[860px]:grid-cols-2" onSubmit={submit}>
        <Input
          onChange={(event) =>
            setValues((current) => ({
              ...current,
              name: event.target.value,
            }))
          }
          placeholder="Nama keahlian (wajib)"
          required
          value={values.name}
        />
        <Input
          onChange={(event) =>
            setValues((current) => ({
              ...current,
              level: event.target.value,
            }))
          }
          placeholder="Level (cth: Mahir)"
          value={values.level}
        />
        <div className="flex gap-2 sm:col-span-2">
          <Button disabled={saving || !values.name.trim()} type="submit">
            {isEditing ? "Simpan Perubahan" : "+ Tambah Keahlian"}
          </Button>
          {isEditing ? (
            <Button disabled={saving} onClick={reset} type="button" variant="secondary">
              Batal
            </Button>
          ) : null}
        </div>
      </form>
    </CvSectionCard>
  );
}
