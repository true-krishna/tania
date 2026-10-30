import type { Metadata } from "next";
import { MyAssignmentsPage } from "@/features/assignments/MyAssignmentsPage";

export const metadata: Metadata = {
  title: "Assignment saya",
};

export default function Page() {
  return <MyAssignmentsPage />;
}
