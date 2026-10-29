import type { Metadata } from "next";
import RolesAdminPage from "./RolesAdminPage";

export const metadata: Metadata = {
  title: "Menu & Akses per Role",
};

export default function Page() {
  return <RolesAdminPage />;
}
