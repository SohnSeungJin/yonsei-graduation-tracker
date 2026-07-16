import type { Course } from "../data/types";

export function remainingCourses(
  courses: Course[],
  selectedCourses: number[]
) {
  return courses.filter(
    (course) =>
      course.category === "required" &&
      !selectedCourses.includes(course.id)
  );
}