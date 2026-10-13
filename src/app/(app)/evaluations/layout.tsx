import { notFound } from "next/navigation";
import { EvaluationsShell } from "@/features/evaluations/EvaluationsShell";
import { isModuleOpen } from "@/lib/auth/matrix";

export default function EvaluationsLayout({ children }: { children: React.ReactNode }) {
  if (!isModuleOpen("evaluations")) notFound();
  return <EvaluationsShell>{children}</EvaluationsShell>;
}
