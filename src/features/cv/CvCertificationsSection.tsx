"use client";

import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import {
  AddCvCertificationDocument,
  DeleteCvCertificationDocument,
  MyCvProfileDocument,
  UpdateCvCertificationDocument,
  type CvCertificationInput,
  type CvFieldsFragment,
} from "@/generated/graphql";
import { CvSectionCard } from "./CvSectionCard";
import { useCvCollection } from "./useCvCollection";

type CertificationItem = CvFieldsFragment["certifications"][number];

type CertificationValues = {
  issuer: string;
  name: string;
};

function createCertificationValues(): CertificationValues {
  return { issuer: "", name: "" };
}

function toCertificationValues(certification: CertificationItem): CertificationValues {
  return {
    issuer: certification.issuer ?? "",
    name: certification.name,
  };
}

function buildCertificationInput(values: CertificationValues): CvCertificationInput {
  return {
    issuer: values.issuer.trim() || null,
    name: values.name.trim(),
  };
}

export function CvCertificationsSection({ cv }: { cv: CvFieldsFragment | undefined }) {
  const { isEditing, removeItem, reset, saving, setValues, startEditing, submit, values } =
    useCvCollection<CertificationItem, CertificationValues, CvCertificationInput>({
      addDocument: AddCvCertificationDocument,
      buildInput: buildCertificationInput,
      createValues: createCertificationValues,
      getItemId: (certification) => certification.id,
      messages: {
        added: "Sertifikasi ditambahkan.",
        addFailed: "Gagal menambah sertifikasi.",
        deleted: "Sertifikasi dihapus.",
        deleteFailed: "Gagal menghapus sertifikasi.",
        updateFailed: "Gagal memperbarui sertifikasi.",
        updated: "Sertifikasi diperbarui.",
      },
      refetchDocument: MyCvProfileDocument,
      removeDocument: DeleteCvCertificationDocument,
      toValues: toCertificationValues,
      updateDocument: UpdateCvCertificationDocument,
    });

  return (
    <CvSectionCard title="Sertifikasi">
      {cv?.certifications.length ? (
        <ul className="flex flex-col gap-2">
          {cv.certifications.map((certification) => (
            <li
              className="flex items-start justify-between gap-3 rounded-md border border-board-border px-3 py-2 text-sm"
              key={certification.id}
            >
              <div>
                <p className="font-medium text-zinc-900">{certification.name}</p>
                <p className="text-xs text-zinc-500">{certification.issuer || "—"}</p>
              </div>
              <div className="flex shrink-0 gap-1">
                <button
                  aria-label={`Ubah ${certification.name}`}
                  className="rounded-md px-2 py-1 text-xs font-medium text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800"
                  onClick={() => startEditing(certification)}
                  type="button"
                >
                  Ubah
                </button>
                <button
                  className="rounded-md px-2 py-1 text-xs font-medium text-zinc-500 hover:bg-red-50 hover:text-red-700"
                  onClick={() => removeItem(certification.id)}
                  type="button"
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

      <form className="grid grid-cols-1 gap-2 sm:grid-cols-2" onSubmit={submit}>
        <Input
          onChange={(event) =>
            setValues((current) => ({
              ...current,
              name: event.target.value,
            }))
          }
          placeholder="Nama sertifikasi (wajib)"
          required
          value={values.name}
        />
        <Input
          onChange={(event) =>
            setValues((current) => ({
              ...current,
              issuer: event.target.value,
            }))
          }
          placeholder="Penerbit"
          value={values.issuer}
        />
        <div className="flex gap-2 sm:col-span-2">
          <Button disabled={saving || !values.name.trim()} type="submit">
            {isEditing ? "Simpan Perubahan" : "+ Tambah Sertifikasi"}
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
