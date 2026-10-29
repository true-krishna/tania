import type { Metadata } from "next";
import LoginPage from "./LoginPage";

export const metadata: Metadata = {
  title: "Masuk",
};

export default function Page() {
  return <LoginPage />;
}
