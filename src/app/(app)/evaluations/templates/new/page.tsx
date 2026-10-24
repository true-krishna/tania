import { redirect } from "next/navigation";
import { EVALUATION_TEMPLATES } from "@/lib/constants/routes";

export default function NewEvaluationTemplatePage() {
  redirect(EVALUATION_TEMPLATES);
}
