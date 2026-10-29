import type { Metadata } from "next";
import EvaluationFormPage from "./EvaluationFormPage";

export const metadata: Metadata = {
  title: "Evaluasi Talent",
};

export default function Page() {
  return <EvaluationFormPage />;
}
