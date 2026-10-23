import { redirect } from "next/navigation";
import { EVALUATION_PERIODS } from "@/lib/constants/routes";

export default function NewEvaluationPeriodPage() {
  redirect(EVALUATION_PERIODS);
}
