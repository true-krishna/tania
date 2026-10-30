import type { Metadata } from "next";
import MyIdpPage from "./MyIdpPage";

export const metadata: Metadata = {
  title: "IDP saya",
};

export default function Page() {
  return <MyIdpPage />;
}
