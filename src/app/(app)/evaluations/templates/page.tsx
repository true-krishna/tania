import type { Metadata } from "next";
import EvaluationTemplatesPage from "./EvaluationTemplatesPage";

export const metadata: Metadata = {
  title: "Template Evaluasi",
};

export default function Page() {
  return <EvaluationTemplatesPage />;
}
