import { notFound } from "next/navigation";
import { isModuleOpen } from "@/lib/auth/matrix";

export default function IdpLayout({ children }: { children: React.ReactNode }) {
  if (!isModuleOpen("idp")) notFound();
  return <>{children}</>;
}
