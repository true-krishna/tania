import type { Metadata } from "next";
import ProfilePage from "./ProfilePage";

export const metadata: Metadata = {
  title: "Profil Saya",
};

export default function Page() {
  return <ProfilePage />;
}
