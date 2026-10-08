import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SummaryView } from "@/components/screens/SummaryView";
import { TOTAL_DAYS, parseDayParam } from "@/lib/course";

export const dynamicParams = false;

export function generateStaticParams() {
  return Array.from({ length: TOTAL_DAYS }, (_, index) => ({ day: String(index + 1) }));
}

export const metadata: Metadata = { title: "Day result" };

export default async function SummaryPage({ params }: { params: Promise<{ day: string }> }) {
  const { day } = await params;
  const dayNumber = parseDayParam(day);
  if (dayNumber === null) notFound();
  return <SummaryView day={dayNumber} />;
}
