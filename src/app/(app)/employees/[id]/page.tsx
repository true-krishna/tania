import type { Metadata } from "next";
import EmployeeDetailPage from "./EmployeeDetailPage";

export const metadata: Metadata = {
  title: "Detail Karyawan",
};

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  return <EmployeeDetailPage params={params} />;
}
