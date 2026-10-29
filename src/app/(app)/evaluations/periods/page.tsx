import type { Metadata } from "next";
import EvaluationPeriodsPage from "./EvaluationPeriodsPage";

export const metadata: Metadata = {
  title: "Periode Evaluasi",
};

export default function Page() {
  return <EvaluationPeriodsPage />;
}
