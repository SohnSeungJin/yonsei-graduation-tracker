import { businessCourses } from "./business";
import { statisticsCourses } from "./statistics";
import { generalCourses } from "./general";

export const courses = [
  ...generalCourses,
  ...businessCourses,
  ...statisticsCourses,
];