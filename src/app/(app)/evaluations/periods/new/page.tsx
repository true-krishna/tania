import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { EVALUATION_PERIODS } from "@/lib/constants/routes";

export const metadata: Metadata = {
  title: "Periode Evaluasi",
};

export default function NewEvaluationPeriodPage() {
  redirect(EVALUATION_PERIODS);
}
