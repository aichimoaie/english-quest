import type { Metadata } from "next";
import { CourseMap } from "@/components/screens/CourseMap";

export const metadata: Metadata = { title: "Course" };

export default function CoursePage() {
  return <CourseMap />;
}
