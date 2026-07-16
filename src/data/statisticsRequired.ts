import type { RequiredCourse } from "./types";

/**
 * 2010~2024학번
 *
 * 전공기초 12학점
 * 전공필수 6학점
 * 전공선택 18학점
 * 전공 합계 36학점
 */
export const statisticsRequiredUntil2024: RequiredCourse[] = [
  {
    id: 2001,
    code: "STA1002",
    name: "미분적분학",
    major: "statistics",
    credit: 3,
  },
  {
    id: 2002,
    code: "STA2105",
    name: "통계방법론",
    major: "statistics",
    credit: 3,
  },
  {
    id: 2003,
    code: "STA2102",
    name: "선형대수",
    major: "statistics",
    credit: 3,
  },
  {
    id: 2004,
    code: "STA2104",
    name: "R과파이썬프로그래밍",
    major: "statistics",
    credit: 3,
  },
  {
    id: 2005,
    code: "STA3126",
    name: "수리통계학(1)",
    major: "statistics",
    credit: 3,
  },
  {
    id: 2006,
    code: "STA3109",
    name: "수리통계학(2)",
    major: "statistics",
    credit: 3,
  },
];

/**
 * 2025학번 이후
 *
 * 전공기초 15학점
 * 전공필수 6학점
 * 전공선택 15학점
 * 전공 합계 36학점
 *
 * R프로그래밍과 파이썬프로그래밍의 학정번호는
 * 제공 자료에서 각각 ECO1003, ECO1105로 기재되어 있음.
 */
export const statisticsRequiredFrom2025: RequiredCourse[] = [
  {
    id: 2101,
    code: "STA1002",
    name: "미분적분학",
    major: "statistics",
    credit: 3,
  },
  {
    id: 2102,
    code: "STA2105",
    name: "통계방법론",
    major: "statistics",
    credit: 3,
  },
  {
    id: 2103,
    code: "STA2102",
    name: "선형대수",
    major: "statistics",
    credit: 3,
  },
  {
    id: 2104,
    code: "ECO1003",
    name: "R프로그래밍과데이터분석",
    major: "statistics",
    credit: 3,
  },
  {
    id: 2105,
    code: "ECO1105",
    name: "파이썬프로그래밍",
    major: "statistics",
    credit: 3,
  },
  {
    id: 2106,
    code: "STA3126",
    name: "수리통계학(1)",
    major: "statistics",
    credit: 3,
  },
  {
    id: 2107,
    code: "STA3109",
    name: "수리통계학(2)",
    major: "statistics",
    credit: 3,
  },
];

/**
 * 현재 화면에서 임시로 사용하는 목록.
 *
 * 사용자가 2024학번 이전이면 아래 설정을 유지하고,
 * 2025학번 이후라면 statisticsRequiredFrom2025로 변경합니다.
 */
export const statisticsRequired = statisticsRequiredUntil2024;