import type { Metadata } from "next";
import EvaluationsPage from "./EvaluationsPage";

export const metadata: Metadata = {
  title: "Evaluasi",
};

export default function Page() {
  return <EvaluationsPage />;
}
