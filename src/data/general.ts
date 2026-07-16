import type { Course } from "./types";

export const generalCourses: Course[] = [
  {
    id: 1,
    code: "ECO1002",
    name: "경제학개론",
    credit: 3,
    major: "general",
    category: "basic",
    crossRecognition: false,
  },

  {
    id: 2,
    code: "STA1001",
    name: "통계학입문",
    credit: 3,
    major: "general",
    category: "basic",
    crossRecognition: false,
  },

  {
    id: 3,
    code: "CHAPEL",
    name: "채플",
    credit: 2,
    major: "general",
    category: "chapel",
    crossRecognition: false,
  },
];