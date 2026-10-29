import type { Metadata } from "next";
import LoginCallbackPage from "./LoginCallbackPage";

export const metadata: Metadata = {
  title: "Masuk",
};

export default function Page() {
  return <LoginCallbackPage />;
}
