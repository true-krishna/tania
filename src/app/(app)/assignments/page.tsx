import type { Metadata } from "next";
import AssignmentsPage from "./AssignmentsPage";

export const metadata: Metadata = {
  title: "Assignments",
};

export default function Page() {
  return <AssignmentsPage />;
}
