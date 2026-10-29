"use client";

import { ToastProvider } from "@/components/Toast";
import { useModuleAccess } from "@/lib/auth/access";
import { useSessionRole } from "@/lib/auth/guard";
import { ChapterTalentList } from "./ChapterTalentList";
import { EmployeeDirectory } from "./EmployeeDirectory";
import { OwnEmployeeRedirect } from "./OwnEmployeeRedirect";

export default function EmployeesPage() {
  const role = useSessionRole();
  const manage = useModuleAccess("employees").canManage;
  if (role === "TALENT") return <OwnEmployeeRedirect />;
  if (role === "CHAPTER") return <ChapterTalentList />;
  return (
    <ToastProvider>
      <EmployeeDirectory manage={manage} />
    </ToastProvider>
  );
}
