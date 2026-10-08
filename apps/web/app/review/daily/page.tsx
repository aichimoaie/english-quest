import type { Metadata } from "next";
import { ReviewRun } from "@/components/screens/ReviewRun";

export const metadata: Metadata = { title: "Daily review" };

export default function DailyReviewPage() {
  return <ReviewRun mode="daily" />;
}
