import { redirect } from "next/navigation";
import { TALENT_ASSIGNMENT } from "@/lib/constants/routes";

export default function NewAssignmentPage() {
  redirect(TALENT_ASSIGNMENT);
}
