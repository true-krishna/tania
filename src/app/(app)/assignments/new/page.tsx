import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { TALENT_ASSIGNMENT } from "@/lib/constants/routes";

export const metadata: Metadata = {
  title: "Assignments",
};

export default function NewAssignmentPage() {
  redirect(TALENT_ASSIGNMENT);
}
