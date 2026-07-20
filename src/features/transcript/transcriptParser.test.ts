import { describe, expect, it } from "vitest";

import { getYearRequirementProfile } from "../../data/basicRequirements";
import { businessRequired } from "../../data/businessRequired";
import { statisticsRequiredUntil2024 } from "../../data/statisticsRequired";
import { matchTranscriptCourses } from "./transcriptMatcher";
import { structureOcrTsv } from "./ocrGeometry";
import { parseTranscriptText } from "./transcriptParser";

function tsvWord(
  line: number,
  word: number,
  left: number,
  top: number,
  text: string
): string {
  return [5, 1, 1, 1, line, word, left, top, 40, 18, 90, text].join("\t");
}

const tsvHeader = "level\tpage_num\tblock_num\tpar_num\tline_num\tword_num\tleft\ttop\twidth\theight\tconf\ttext";

describe("parseTranscriptText", () => {
  it("학기, 여러 줄 과목명, 학점과 성적을 구조화한다", () => {
    const result = parseTranscriptText(`
      2022 학년도 1학기
      긴 영어 교과목 이름:
      Practice* 3 A+
      회계원리(1)* 3 AO
      채플(A) 0.5 P
      신청: 6.5 취득: 6.5 평균: 4.30
      2022학년도 여름학기
      R과파이썬프로그래밍 3 A+
    `);

    expect(result.courses).toHaveLength(4);
    expect(result.courses[0]).toMatchObject({
      term: "2022학년도 1학기",
      name: "긴 영어 교과목 이름: Practice",
      credits: 3,
      grade: "A+",
      englishTaught: true,
    });
    expect(result.courses[1].grade).toBe("A0");
    expect(result.courses[2].credits).toBe(0.5);
    expect(result.courses[3].term).toBe("2022학년도 여름학기");
  });
});

describe("matchTranscriptCourses", () => {
  it("필수과목 별칭과 기본요건을 자동 매칭한다", () => {
    const parsed = parseTranscriptText(`
      2021학년도 1학기
      생산및운영관리 3 A+
      경제학개론 3 A0
      채플(A) 0.5 P
      채플(B) 0.5 P
      채플(C) 0.5 P
      채플(D) 0.5 P
      자유선택과목 3 B+
    `).courses;

    const matched = matchTranscriptCourses(
      parsed,
      [...businessRequired, ...statisticsRequiredUntil2024],
      getYearRequirementProfile(2018)
    );

    expect(matched[0]).toMatchObject({
      classification: "required",
      matchedRequiredCourseName: "오퍼레이션관리",
    });
    expect(matched[1]).toMatchObject({
      classification: "basic",
      matchedBasicRequirementId: "region-world",
    });
    expect(
      matched.filter(
        (course) => course.matchedBasicRequirementId === "chapel-four"
      )
    ).toHaveLength(1);
    expect(matched.at(-1)?.classification).toBe("unclassified");
  });

  it("경영학 단일전공에서는 응용통계 필수과목을 자동 매칭하지 않는다", () => {
    const parsed = parseTranscriptText(`
      2024학년도 1학기
      마케팅 3 A+
      선형대수 3 A0
    `).courses;

    const matched = matchTranscriptCourses(
      parsed,
      businessRequired,
      getYearRequirementProfile(2024)
    );

    expect(matched[0]).toMatchObject({
      classification: "required",
      matchedRequiredCourseName: "마케팅",
    });
    expect(matched[1]).toMatchObject({
      name: "선형대수",
      classification: "unclassified",
    });
  });

  it("응용통계학 단일전공에서는 응용통계 필수과목만 자동 매칭한다", () => {
    const parsed = parseTranscriptText(`
      2024학년도 1학기
      마케팅 3 A+
      선형대수 3 A0
    `).courses;

    const matched = matchTranscriptCourses(
      parsed,
      statisticsRequiredUntil2024,
      getYearRequirementProfile(2024, "statistics")
    );

    expect(matched[0]).toMatchObject({
      name: "마케팅",
      classification: "unclassified",
    });
    expect(matched[1]).toMatchObject({
      classification: "required",
      matchedRequiredCourseName: "선형대수",
    });
  });
});

describe("getYearRequirementProfile", () => {
  it("응용통계학 본전공은 통계학입문을 필수 기본요건으로 적용한다", () => {
    const profile = getYearRequirementProfile(2024, "statistics");
    const requirements = profile.sections.flatMap(
      (section) => section.requirements
    );

    expect(
      requirements.find((requirement) => requirement.id === "region-world")
        ?.mandatory
    ).toBe(false);
    expect(
      requirements.find((requirement) => requirement.id === "logic-math")
    ).toMatchObject({
      mandatory: true,
      description: "STA1001 통계학입문을 반드시 이수해야 합니다.",
    });
  });
});

describe("structureOcrTsv", () => {
  it("한글 자간과 별도 학점·성적 영역을 정상 과목 행으로 합친다", () => {
    const fullTsv = [
      tsvHeader,
      tsvWord(1, 1, 10, 10, "2018"),
      tsvWord(1, 2, 70, 10, "학"),
      tsvWord(1, 3, 115, 10, "년"),
      tsvWord(1, 4, 160, 10, "도"),
      tsvWord(1, 5, 230, 10, "1"),
      tsvWord(1, 6, 270, 10, "학"),
      tsvWord(1, 7, 315, 10, "기"),
      tsvWord(2, 1, 10, 55, "경"),
      tsvWord(2, 2, 55, 55, "제"),
      tsvWord(2, 3, 100, 55, "학"),
      tsvWord(2, 4, 145, 55, "개"),
      tsvWord(2, 5, 190, 55, "론"),
      tsvWord(2, 6, 680, 55, "3"),
      tsvWord(2, 7, 740, 55, "사"),
    ].join("\n");
    const gradeTsv = [
      tsvHeader,
      tsvWord(1, 1, 10, 55, "3AF"),
    ].join("\n");

    expect(structureOcrTsv(fullTsv, gradeTsv, 800)).toBe(
      "2018학년도 1학기\n경제학개론 3 A+"
    );
  });
});
