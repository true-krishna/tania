"use client";

import { Input } from "@/components/Input";
import { InputControl } from "@/components/InputControl";
import { Select } from "@/components/Select";
import type { ContractType } from "@/generated/graphql";
import { CONTRACT_TYPE_LABEL, CONTRACT_TYPE_ORDER, isOpenEndedContractType } from "./labels";
import {
  dayAfter,
  type RenewContractFormErrors,
  type RenewContractFormValues,
  type SourceContract,
} from "./renewContractValues";

type RenewContractPeriodFieldsProps = {
  contract: SourceContract;
  errors: RenewContractFormErrors;
  onChange: (key: keyof RenewContractFormValues, value: string) => void;
  onContractTypeChange: (contractType: ContractType) => void;
  values: RenewContractFormValues;
};

export function RenewContractPeriodFields({
  contract,
  errors,
  onChange,
  onContractTypeChange,
  values,
}: RenewContractPeriodFieldsProps) {
  return (
    <>
      <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
        Periode &amp; status
      </h3>
      <InputControl error={errors.contractType} label="Jenis kontrak">
        <Select
          onChange={(event) => onContractTypeChange(event.target.value as ContractType)}
          options={CONTRACT_TYPE_ORDER.map((type) => ({
            label: CONTRACT_TYPE_LABEL[type],
            value: type,
          }))}
          value={values.contractType}
        />
      </InputControl>
      <InputControl error={errors.contractNo} label="No. Kontrak baru">
        <Input
          onChange={(event) => onChange("contractNo", event.target.value)}
          placeholder="cth. PKWT/2027/001"
          type="text"
          value={values.contractNo}
        />
      </InputControl>
      <InputControl error={errors.startDate} label="Tanggal mulai">
        <Input
          min={dayAfter(contract.endDate) || undefined}
          onChange={(event) => onChange("startDate", event.target.value)}
          type="date"
          value={values.startDate}
        />
      </InputControl>
      {!isOpenEndedContractType(values.contractType) ? (
        <InputControl error={errors.endDate} label="Tanggal selesai">
          <Input
            onChange={(event) => onChange("endDate", event.target.value)}
            type="date"
            value={values.endDate}
          />
        </InputControl>
      ) : null}
    </>
  );
}
