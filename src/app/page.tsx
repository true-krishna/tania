import type { Metadata } from "next";
import Home from "./Home";

export const metadata: Metadata = {
  title: "Beranda | Tania",
};

export default function Page() {
  return <Home />;
}
