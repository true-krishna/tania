import type { Metadata } from "next";
import AssignmentDetailPage from "./AssignmentDetailPage";

export const metadata: Metadata = {
  title: "Detail Assignment",
};

export default function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return <AssignmentDetailPage params={params} />;
}
