"use client";

import * as React from "react";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { InputControl } from "@/components/InputControl";
import { Modal, ModalActions, ModalContent, ModalTitle } from "@/components/Modal";
import { Select } from "@/components/Select";

export function MasterDataFormModal({
  open,
  editingId,
  addLabel,
  nameLabel,
  codeLabel,
  codePlaceholder,
  select,
  formId,
  name,
  code,
  selectValue,
  nameError,
  codeError,
  selectError,
  busy,
  onNameChange,
  onCodeChange,
  onSelectChange,
  onSubmit,
  onClose,
}: {
  open: boolean;
  editingId: string | null;
  addLabel: string;
  nameLabel: string;
  codeLabel?: string;
  codePlaceholder?: string;
  select?: { label: string; placeholder: string; options: { id: string; name: string }[] };
  formId: string;
  name: string;
  code: string;
  selectValue: string;
  nameError?: string;
  codeError?: string;
  selectError?: string;
  busy: boolean;
  onNameChange: (value: string) => void;
  onCodeChange: (value: string) => void;
  onSelectChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}) {
  return (
    <Modal onClose={onClose} open={open} size="md">
      <ModalTitle>{editingId !== null ? `Ubah ${nameLabel}` : addLabel}</ModalTitle>
      <ModalContent>
        <form className="flex flex-col gap-4" id={formId} onSubmit={onSubmit}>
          <InputControl error={nameError} label={nameLabel}>
            <Input
              onChange={(e) => onNameChange(e.target.value)}
              placeholder="cth: Digital Business"
              value={name}
            />
          </InputControl>
          {codeLabel ? (
            <InputControl error={codeError} label={codeLabel}>
              <Input
                onChange={(e) => onCodeChange(e.target.value)}
                placeholder={codePlaceholder ?? "cth: DBT"}
                value={code}
              />
            </InputControl>
          ) : null}
          {select ? (
            <InputControl error={selectError} label={select.label}>
              <Select
                onChange={(e) => onSelectChange(e.target.value)}
                options={[
                  { value: "", label: `— ${select.placeholder} —` },
                  ...select.options.map((o) => ({ value: o.id, label: o.name })),
                ]}
                value={selectValue}
              />
            </InputControl>
          ) : null}
        </form>
      </ModalContent>
      <ModalActions>
        <Button disabled={busy} form={formId} type="submit">
          Simpan
        </Button>
        <Button disabled={busy} onClick={onClose} type="button" variant="secondary">
          Batal
        </Button>
      </ModalActions>
    </Modal>
  );
}
