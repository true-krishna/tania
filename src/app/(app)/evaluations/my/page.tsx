import type { Metadata } from "next";
import MyEvaluationsPage from "./MyEvaluationsPage";

export const metadata: Metadata = {
  title: "Evaluasi Saya",
};

export default function Page() {
  return <MyEvaluationsPage />;
}
