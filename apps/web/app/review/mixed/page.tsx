import type { Metadata } from "next";
import { ReviewRun } from "@/components/screens/ReviewRun";

export const metadata: Metadata = { title: "Mixed review" };

export default function MixedReviewPage() {
  return <ReviewRun mode="mixed" />;
}
