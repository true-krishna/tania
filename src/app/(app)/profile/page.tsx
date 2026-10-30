import type { Metadata } from "next";
import { ToastProvider } from "@/components/Toast";
import ProfilePage from "./ProfilePage";

export const metadata: Metadata = {
  title: "Profil Saya",
};

export default function Page() {
  return (
    <ToastProvider>
      <ProfilePage />
    </ToastProvider>
  );
}
