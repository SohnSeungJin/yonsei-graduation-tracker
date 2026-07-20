import type {
  ParsedTranscriptCourse,
  TranscriptParseResult,
} from "./types";

const TERM_PATTERN = /(20\d{2})\s*학년도\s*(1|2|여름|겨울)\s*학기/;
const COURSE_PATTERN = /^(.+?)\s+(0[.,]5|[0-9]+(?:[.,][05])?)\s+(A[+0O]|B[+0O]|C[+0O]|D[+0O]|F|P|NP|S|U|W|WE)$/i;
const SUMMARY_PATTERN = /(신청|취득|누계|평균|평량평균|환산점수)/;
const HEADER_PATTERN = /(교과목명|학점\s*성적|학점등급|학적사항|성적증명서|부전공)/;

function normalizeLine(line: string): string {
  return line
    .replace(/[|｜]/g, " ")
    .replace(/[‐‑‒–—]/g, "-")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeGrade(value: string): string {
  const grade = value.toUpperCase();
  if (/^[ABCD]O$/.test(grade)) return `${grade[0]}0`;
  return grade;
}

function parseCredits(value: string): number {
  const normalized = value.replace(",", ".");
  if (normalized === "05") return 0.5;
  return Number(normalized);
}

function cleanCourseName(value: string): { name: string; englishTaught: boolean } {
  const englishTaught = value.includes("*");
  const name = value
    .replace(/^[-_=~·•:;]+/, "")
    .replace(/\*/g, "")
    .replace(/\s+([()])/g, "$1")
    .replace(/([()])\s+/g, "$1")
    .replace(/\s+/g, " ")
    .trim();

  return { name, englishTaught };
}

function looksLikeCourseName(line: string): boolean {
  if (line.length < 2 || line.length > 140) return false;
  if (HEADER_PATTERN.test(line) || SUMMARY_PATTERN.test(line)) return false;
  if (/^={2,}/.test(line) || /^\[PAGE/.test(line)) return false;
  return /[가-힣A-Za-z]/.test(line);
}

export function parseTranscriptText(
  text: string,
  options: { pageCount?: number; usedOcr?: boolean } = {}
): TranscriptParseResult {
  const courses: ParsedTranscriptCourse[] = [];
  const warnings: string[] = [];
  let currentTerm = "학기 미확인";
  let pendingName = "";

  const lines = text.split(/\r?\n/).map(normalizeLine).filter(Boolean);

  for (const line of lines) {
    const termMatch = line.match(TERM_PATTERN);
    if (termMatch) {
      currentTerm = `${termMatch[1]}학년도 ${termMatch[2]}학기`;
      pendingName = "";
      continue;
    }

    if (HEADER_PATTERN.test(line) || SUMMARY_PATTERN.test(line) || /^\[PAGE/.test(line)) {
      pendingName = "";
      continue;
    }

    const combined = pendingName ? `${pendingName} ${line}` : line;
    const courseMatch = combined.match(COURSE_PATTERN);

    if (courseMatch) {
      const credits = parseCredits(courseMatch[2]);
      const grade = normalizeGrade(courseMatch[3]);
      const { name, englishTaught } = cleanCourseName(courseMatch[1]);

      if (name && Number.isFinite(credits) && credits > 0 && credits <= 6) {
        courses.push({
          id: `transcript-${courses.length + 1}`,
          term: currentTerm,
          name,
          credits,
          grade,
          englishTaught,
          confidence:
            currentTerm === "학기 미확인" || name.length < 2 ? "review" : "high",
        });
      }

      pendingName = "";
      continue;
    }

    if (looksLikeCourseName(line)) {
      pendingName = pendingName ? `${pendingName} ${line}` : line;
      if (pendingName.length > 180) pendingName = line;
    } else {
      pendingName = "";
    }
  }

  if (courses.length === 0) {
    warnings.push("과목 행을 인식하지 못했습니다. 더 선명한 PDF인지 확인해 주세요.");
  }

  const unknownTermCount = courses.filter(
    (course) => course.term === "학기 미확인"
  ).length;
  if (unknownTermCount > 0) {
    warnings.push(`${unknownTermCount}개 과목의 이수 학기를 확인하지 못했습니다.`);
  }

  return {
    courses,
    warnings,
    pageCount: options.pageCount ?? 1,
    usedOcr: options.usedOcr ?? true,
    recognizedCredits: courses.reduce((sum, course) => sum + course.credits, 0),
  };
}
