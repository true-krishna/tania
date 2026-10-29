import type { Metadata } from "next";
import IdpPage from "./IdpPage";

export const metadata: Metadata = {
  title: "IDP",
};

export default function Page() {
  return <IdpPage />;
}
