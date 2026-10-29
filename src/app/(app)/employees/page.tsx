import type { Metadata } from "next";
import EmployeesPage from "./EmployeesPage";

export const metadata: Metadata = {
  title: "Data Karyawan",
};

export default function Page() {
  return <EmployeesPage />;
}
