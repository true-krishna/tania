import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { EVALUATION_TEMPLATES } from "@/lib/constants/routes";

export const metadata: Metadata = {
  title: "Template Evaluasi",
};

export default function NewEvaluationTemplatePage() {
  redirect(EVALUATION_TEMPLATES);
}
