import type { Course } from "../data/types";

export function calculateCredits(
  courses: Course[],
  selectedCourses: number[]
) {
  const general = courses
    .filter(
      (course) =>
        selectedCourses.includes(course.id) &&
        course.major === "general"
    )
    .reduce((sum, c) => sum + c.credit, 0);

  const business = courses
    .filter(
      (course) =>
        selectedCourses.includes(course.id) &&
        (course.major === "business" ||
          course.crossRecognition)
    )
    .reduce((sum, c) => sum + c.credit, 0);

  const statistics = courses
    .filter(
      (course) =>
        selectedCourses.includes(course.id) &&
        (course.major === "statistics" ||
          course.crossRecognition)
    )
    .reduce((sum, c) => sum + c.credit, 0);

  return {
    general,
    business,
    statistics,
  };
}