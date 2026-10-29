"use client";

import { MyIdpView } from "@/features/idp/MyIdpView";
import { useModuleAccess } from "@/lib/auth/access";
import { useSessionRole } from "@/lib/auth/guard";
import { IdpRosterView } from "./IdpRosterView";

export default function IdpPage() {
  const role = useSessionRole();
  const managing = useModuleAccess("idp").canManage;
  if (role === "TALENT") return <MyIdpView />;
  return <IdpRosterView managing={managing} />;
}
