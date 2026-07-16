export type Major = "general" | "business" | "statistics";

export type Category =
  | "required"
  | "elective"
  | "basic"
  | "chapel";

export interface Course {
  id: number;
  code: string;
  name: string;
  credit: number;
  major: Major;
  category: Category;
  crossRecognition: boolean;
}

export interface RequiredCourse {
  id: number;
  code: string;
  name: string;
  major: "business" | "statistics";
  credit: number;

  /**
   * 다른 전공 학점으로도 인정되는지 여부
   * 회계원리(1), 회계원리(2)에 사용
   */
  crossRecognition?: boolean;
}