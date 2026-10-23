"use client";

import { useRouter } from "next/navigation";
import * as React from "react";
import { EMPLOYEES } from "@/lib/constants/routes";

export default function EditEmployeeRedirect({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  React.use(params);
  React.useEffect(() => {
    router.replace(EMPLOYEES);
  }, [router]);
  return null;
}
