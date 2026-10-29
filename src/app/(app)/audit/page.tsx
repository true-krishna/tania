import type { Metadata } from "next";
import AuditPage from "./AuditPage";

export const metadata: Metadata = {
  title: "Audit",
};

export default function Page() {
  return <AuditPage />;
}
