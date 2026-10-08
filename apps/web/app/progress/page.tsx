import type { Metadata } from "next";
import { ProgressView } from "@/components/screens/ProgressView";

export const metadata: Metadata = { title: "Progress" };

export default function ProgressPage() {
  return <ProgressView />;
}
