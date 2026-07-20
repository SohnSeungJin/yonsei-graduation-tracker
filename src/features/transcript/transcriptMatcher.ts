import type { RequiredCourse } from "../../data/types";
import type { YearRequirementProfile } from "../../data/basicRequirements";
import type {
  ParsedTranscriptCourse,
  ReviewedTranscriptCourse,
} from "./types";

const REQUIRED_ALIASES: Record<string, string> = {
  생산및운영관리: "오퍼레이션관리",
  생산운영관리: "오퍼레이션관리",
  회계원리일: "회계원리1",
  회계원이1: "회계원리1",
  회계원리이: "회계원리2",
  회계원이2: "회계원리2",
  알과파이썬프로그래밍: "r과파이썬프로그래밍",
};

export function normalizeCourseName(value: string): string {
  return value
    .normalize("NFKC")
    .toLowerCase()
    .replace(/\*/g, "")
    .replace(/[\s()[\]{}·._,:;\-/]/g, "")
    .replace(/원리일$/, "원리1")
    .replace(/원리이$/, "원리2");
}

function levenshteinDistance(left: string, right: string): number {
  const rows = left.length + 1;
  const columns = right.length + 1;
  const matrix = Array.from({ length: rows }, () => Array<number>(columns).fill(0));

  for (let row = 0; row < rows; row += 1) matrix[row][0] = row;
  for (let column = 0; column < columns; column += 1) matrix[0][column] = column;

  for (let row = 1; row < rows; row += 1) {
    for (let column = 1; column < columns; column += 1) {
      const substitutionCost = left[row - 1] === right[column - 1] ? 0 : 1;
      matrix[row][column] = Math.min(
        matrix[row - 1][column] + 1,
        matrix[row][column - 1] + 1,
        matrix[row - 1][column - 1] + substitutionCost
      );
    }
  }

  return matrix[left.length][right.length];
}

function similarity(left: string, right: string): number {
  const maxLength = Math.max(left.length, right.length);
  if (maxLength === 0) return 1;
  return 1 - levenshteinDistance(left, right) / maxLength;
}

function findRequiredMatch(
  name: string,
  requiredCourses: RequiredCourse[]
): { course?: RequiredCourse; suggestion?: string } {
  const rawNormalized = normalizeCourseName(name);
  const normalized = REQUIRED_ALIASES[rawNormalized] ?? rawNormalized;
  const exact = requiredCourses.find(
    (course) => normalizeCourseName(course.name) === normalized
  );
  if (exact) return { course: exact };

  const candidates = requiredCourses
    .map((course) => ({
      course,
      score: similarity(normalized, normalizeCourseName(course.name)),
    }))
    .sort((left, right) => right.score - left.score);

  const best = candidates[0];
  if (best && normalized.length >= 4 && best.score >= 0.78) {
    return { suggestion: `필수과목 ‘${best.course.name}’과 유사합니다.` };
  }

  return {};
}

function findBasicRequirement(
  name: string,
  allCourses: ParsedTranscriptCourse[],
  profile: YearRequirementProfile
): { id: string; name: string } | undefined {
  const normalized = normalizeCourseName(name);
  const availableRequirements = new Map(
    profile.sections.flatMap((section) =>
      section.requirements.map((requirement) => [requirement.id, requirement.title] as const)
    )
  );

  const match = (id: string) => {
    const title = availableRequirements.get(id);
    return title ? { id, name: title } : undefined;
  };

  if (normalized.includes("yonseirc101")) return match("yonsei-rc101");
  if (normalized.includes("사회참여")) return match("social-participation");
  if (normalized.includes("기독교") && /(세계문화|이해)/.test(normalized)) {
    return match("christian-understanding");
  }
  if (normalized === "경제학개론") return match("region-world");
  if (normalized === "통계학입문") return match("logic-math");

  const normalizedAllNames = allCourses.map((course) => normalizeCourseName(course.name));
  if (normalized.includes("채플")) {
    const chapelCount = normalizedAllNames.filter((courseName) =>
      courseName.includes("채플")
    ).length;
    if (chapelCount >= 4) return match("chapel-four");
  }

  if (/대학.*영어|영어[12]|영어i{1,2}$/i.test(normalized)) {
    const englishCount = normalizedAllNames.filter((courseName) =>
      /대학.*영어|영어[12]|영어i{1,2}$/i.test(courseName)
    ).length;
    if (englishCount >= 2) return match("english-two-courses");
  }

  return undefined;
}

export function matchTranscriptCourses(
  courses: ParsedTranscriptCourse[],
  requiredCourses: RequiredCourse[],
  profile: YearRequirementProfile
): ReviewedTranscriptCourse[] {
  const claimedBasicRequirementIds = new Set<string>();

  return courses.map((course) => {
    const requiredMatch = findRequiredMatch(course.name, requiredCourses);
    if (requiredMatch.course) {
      return {
        ...course,
        selected: true,
        classification: "required",
        upperLevel: /^[A-Z]+[34]/.test(requiredMatch.course.code),
        matchedRequiredCourseId: requiredMatch.course.id,
        matchedRequiredCourseName: requiredMatch.course.name,
      };
    }

    const basicMatch = findBasicRequirement(course.name, courses, profile);
    if (basicMatch && !claimedBasicRequirementIds.has(basicMatch.id)) {
      claimedBasicRequirementIds.add(basicMatch.id);
      return {
        ...course,
        selected: true,
        classification: "basic",
        upperLevel: false,
        matchedBasicRequirementId: basicMatch.id,
        matchedBasicRequirementName: basicMatch.name,
        suggestion: requiredMatch.suggestion,
      };
    }

    if (basicMatch) {
      return {
        ...course,
        selected: false,
        classification: "unclassified",
        upperLevel: false,
        suggestion: `${basicMatch.name} 요건에 함께 반영되는 과목입니다.`,
      };
    }

    return {
      ...course,
      selected: true,
      classification: "unclassified",
      upperLevel: false,
      suggestion: requiredMatch.suggestion,
    };
  });
}
