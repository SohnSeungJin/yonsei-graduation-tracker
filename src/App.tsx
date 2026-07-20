import { useEffect, useMemo, useState } from "react";

import "./App.css";

import Header from "./components/Header";
import Progress from "./components/Progress";
import RequiredList from "./components/RequiredList";
import RemainingList, { type RemainingBasicRequirement } from "./components/RemainingList";
import BasicRequirements from "./components/BasicRequirements";
import UserGuide from "./components/UserGuide";
import CrossRecognitionGuide from "./components/CrossRecognitionGuide";
import TranscriptImport from "./components/TranscriptImport";

import { businessRequired } from "./data/businessRequired";
import {
  admissionYears,
  calculateCompletedRequirementCredits,
  getAllRequirementIds,
  getYearRequirementProfile,
  isRequirementProfileComplete,
  type AdmissionYear,
} from "./data/basicRequirements";
import {
  statisticsRequiredFrom2025,
  statisticsRequiredUntil2024,
} from "./data/statisticsRequired";
import type { TranscriptApplyPayload } from "./features/transcript/types";
import { normalizeCourseName } from "./features/transcript/transcriptMatcher";

type StatisticsCurriculum = "until2024" | "from2025";
type ManualCourseCategory = "basic" | "general" | "business" | "statistics";
type ProgramType =
  | "business-single"
  | "statistics-single"
  | "business-statistics-double";

interface ManualCourse {
  id: string;
  name: string;
  credits: number;
  category: ManualCourseCategory;
  basicRequirementId?: string;
  upperLevel: boolean;
  source?: "manual" | "transcript";
  term?: string;
  grade?: string;
}

interface SavedTrackerState {
  selectedCourses: number[];
  manualCourses: ManualCourse[];
  statisticsCurriculum: StatisticsCurriculum;
  completedBasicRequirements: string[];
  admissionYear: AdmissionYear;
  programType: ProgramType;
}

const STORAGE_KEY = "yonsei-graduation-tracker-v2";

const defaultState: SavedTrackerState = {
  selectedCourses: [],
  manualCourses: [],
  statisticsCurriculum: "until2024",
  completedBasicRequirements: [],
  admissionYear: 2018,
  programType: "business-statistics-double",
};

const CROSS_RECOGNITION_NAMES = new Set(["회계원리1", "회계원리2"]);

function isCrossRecognitionCourseName(name: string): boolean {
  const normalized = name.replace(/[\s()[\]{}·._-]/g, "").toLowerCase();
  return CROSS_RECOGNITION_NAMES.has(normalized);
}

function loadSavedState(): SavedTrackerState {
  try {
    const savedState = localStorage.getItem(STORAGE_KEY);
    if (!savedState) return defaultState;

    return { ...defaultState, ...JSON.parse(savedState) } as SavedTrackerState;
  } catch {
    return defaultState;
  }
}

function App() {
  const initialState = useMemo(loadSavedState, []);
  const [selectedCourses, setSelectedCourses] = useState<number[]>(
    initialState.selectedCourses
  );
  const [manualCourses, setManualCourses] = useState<ManualCourse[]>(
    initialState.manualCourses
  );
  const [statisticsCurriculum, setStatisticsCurriculum] =
    useState<StatisticsCurriculum>(initialState.statisticsCurriculum);
  const [completedBasicRequirements, setCompletedBasicRequirements] = useState<string[]>(
    initialState.completedBasicRequirements
  );
  const [admissionYear, setAdmissionYear] = useState<AdmissionYear>(
    initialState.admissionYear
  );
  const [programType, setProgramType] = useState<ProgramType>(
    initialState.programType
  );

  const includesBusiness = programType !== "statistics-single";
  const includesStatistics = programType !== "business-single";
  const isDoubleMajor = programType === "business-statistics-double";
  const primaryMajor = programType === "statistics-single" ? "statistics" : "business";
  const statisticsCreditTarget = programType === "statistics-single" ? 48 : 36;
  const basicRequirementProfile = getYearRequirementProfile(
    admissionYear,
    primaryMajor
  );
  const basicRequirementOptions = basicRequirementProfile.sections.flatMap(
    (section) =>
      section.requirements.map((requirement) => ({
        id: requirement.id,
        label: `${section.title} · ${requirement.title}`,
        credits: requirement.credits ?? 0,
      }))
  );
  const validBasicRequirementIds = new Set(
    basicRequirementOptions.map((requirement) => requirement.id)
  );
  const manualBasicRequirementIds = manualCourses
    .filter(
      (course) =>
        course.category === "basic" &&
        course.basicRequirementId !== undefined &&
        validBasicRequirementIds.has(course.basicRequirementId)
    )
    .map((course) => course.basicRequirementId as string);
  const effectiveCompletedBasicRequirements = [
    ...new Set([
      ...completedBasicRequirements,
      ...manualBasicRequirementIds,
    ]),
  ];

  const statisticsRequired =
    statisticsCurriculum === "from2025"
      ? statisticsRequiredFrom2025
      : statisticsRequiredUntil2024;



  useEffect(() => {
    const state: SavedTrackerState = {
      selectedCourses,
      manualCourses,
      statisticsCurriculum,
      completedBasicRequirements,
      admissionYear,
      programType,
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [
    selectedCourses,
    manualCourses,
    statisticsCurriculum,
    completedBasicRequirements,
    admissionYear,
    programType,
  ]);

  const toggleCourse = (id: number) => {
    setSelectedCourses((currentCourses) =>
      currentCourses.includes(id)
        ? currentCourses.filter((courseId) => courseId !== id)
        : [...currentCourses, id]
    );
  };

  const toggleBasicRequirement = (id: string) => {
    setCompletedBasicRequirements((current) =>
      current.includes(id)
        ? current.filter((requirementId) => requirementId !== id)
        : [...current, id]
    );
  };



  const addManualCourse = () => {
    setManualCourses((current) => [
      ...current,
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        name: "",
        credits: 3,
        category: "general",
        upperLevel: false,
      },
    ]);
  };

  const updateManualCourse = <K extends keyof ManualCourse>(
    id: string,
    field: K,
    value: ManualCourse[K]
  ) => {
    setManualCourses((current) =>
      current.map((course) =>
        course.id === id ? { ...course, [field]: value } : course
      )
    );
  };

  const updateManualBasicRequirement = (
    id: string,
    basicRequirementId: string
  ) => {
    const requirement = basicRequirementOptions.find(
      (option) => option.id === basicRequirementId
    );

    setManualCourses((current) =>
      current.map((course) =>
        course.id === id
          ? {
              ...course,
              category: "basic",
              basicRequirementId: requirement?.id,
              credits: requirement?.credits ?? 0,
              upperLevel: false,
            }
          : course
      )
    );
  };

  const removeManualCourse = (id: string) => {
    setManualCourses((current) => current.filter((course) => course.id !== id));
  };

  const handleTranscriptApply = (payload: TranscriptApplyPayload) => {
    setSelectedCourses((current) => [
      ...new Set([...current, ...payload.requiredCourseIds]),
    ]);
    setCompletedBasicRequirements((current) => [
      ...new Set([...current, ...payload.basicRequirementIds]),
    ]);
    setManualCourses((current) => {
      const existingKeys = new Set(
        current.map(
          (course) => `${normalizeCourseName(course.name)}-${course.credits}`
        )
      );
      const imported = payload.manualCourses
        .filter(
          (course) =>
            !existingKeys.has(
              `${normalizeCourseName(course.name)}-${course.credits}`
            )
        )
        .map((course, index) => ({
          id: `transcript-${Date.now()}-${index}`,
          name: course.name,
          credits: course.credits,
          category: course.category,
          upperLevel: course.upperLevel,
          source: "transcript" as const,
          term: course.term,
          grade: course.grade,
        }));

      return [...current, ...imported];
    });
  };

  const handleAdmissionYearChange = (value: AdmissionYear) => {
    setAdmissionYear(value);
    setCompletedBasicRequirements((current) =>
      current.filter((id) =>
        getAllRequirementIds(
          getYearRequirementProfile(value, primaryMajor)
        ).includes(id)
      )
    );

    const nextCurriculum: StatisticsCurriculum = value >= 2025 ? "from2025" : "until2024";
    if (nextCurriculum !== statisticsCurriculum) {
      handleCurriculumChange(nextCurriculum);
    }
  };

  const handleCurriculumChange = (value: StatisticsCurriculum) => {
    setStatisticsCurriculum(value);

    const allStatisticsCourseIds = [
      ...statisticsRequiredUntil2024,
      ...statisticsRequiredFrom2025,
    ].map((course) => course.id);

    setSelectedCourses((currentCourses) =>
      currentCourses.filter(
        (courseId) => !allStatisticsCourseIds.includes(courseId)
      )
    );
  };

  const resetTracker = () => {
    setSelectedCourses([]);
    setManualCourses([]);
    setStatisticsCurriculum("until2024");
    setCompletedBasicRequirements([]);
    setAdmissionYear(2018);
    setProgramType("business-statistics-double");

    localStorage.removeItem(STORAGE_KEY);
  };

  const businessRequiredCredits = businessRequired
    .filter((course) => selectedCourses.includes(course.id))
    .reduce((sum, course) => sum + course.credit, 0);

  const statisticsRequiredCredits = statisticsRequired
    .filter((course) => selectedCourses.includes(course.id))
    .reduce((sum, course) => sum + course.credit, 0);

  const crossRecognitionCredits = Math.min(
    businessRequired
      .filter(
        (course) =>
          selectedCourses.includes(course.id) && course.crossRecognition
      )
      .reduce((sum, course) => sum + course.credit, 0),
    6
  );

  const generalElectiveCredits = manualCourses
    .filter(
      (course) =>
        course.category === "general" ||
        (!includesBusiness && course.category === "business") ||
        (!includesStatistics && course.category === "statistics")
    )
    .reduce((sum, course) => sum + course.credits, 0);
  const businessElectiveCredits = manualCourses
    .filter((course) => course.category === "business")
    .reduce((sum, course) => sum + course.credits, 0);
  const statisticsElectiveCredits = manualCourses
    .filter((course) => course.category === "statistics")
    .reduce((sum, course) => sum + course.credits, 0);

  const businessTotalCredits = includesBusiness
    ? businessRequiredCredits + businessElectiveCredits
    : 0;
  const statisticsTotalCredits = includesStatistics
    ? statisticsRequiredCredits +
      statisticsElectiveCredits +
      (isDoubleMajor ? crossRecognitionCredits : 0)
    : 0;

  const remainingBusinessCourses = includesBusiness
    ? businessRequired.filter((course) => !selectedCourses.includes(course.id))
    : [];
  const remainingStatisticsCourses = includesStatistics
    ? statisticsRequired.filter((course) => !selectedCourses.includes(course.id))
    : [];

  const basicRequirementCredits = calculateCompletedRequirementCredits(
    basicRequirementProfile,
    effectiveCompletedBasicRequirements
  );
  const totalGeneralCredits = basicRequirementCredits;

  const activeRequiredCourses = [
    ...(includesBusiness ? businessRequired : []),
    ...(includesStatistics ? statisticsRequired : []),
  ];
  const selectedRequiredCourses = activeRequiredCourses.filter(
    (course) => selectedCourses.includes(course.id)
  );
  const selectedRequiredCredits = selectedRequiredCourses.reduce(
    (sum, course) => sum + course.credit,
    0
  );
  const totalEarnedCredits =
    basicRequirementCredits +
    selectedRequiredCredits +
    manualCourses
      .filter((course) => course.category !== "basic")
      .reduce((sum, course) => sum + course.credits, 0);

  const isUpperLevelCourse = (code: string) => /^[A-Z]+[34]/.test(code);
  const selectedUpperLevelRequiredCredits = selectedRequiredCourses
    .filter((course) => isUpperLevelCourse(course.code))
    .reduce((sum, course) => sum + course.credit, 0);
  const upperLevelCredits =
    selectedUpperLevelRequiredCredits +
    manualCourses
      .filter((course) => course.category !== "basic" && course.upperLevel)
      .reduce((sum, course) => sum + course.credits, 0);

  const basicRequirementsComplete = isRequirementProfileComplete(
    basicRequirementProfile,
    effectiveCompletedBasicRequirements
  );
  const totalCreditsComplete = totalEarnedCredits >= 126;
  const upperLevelComplete = upperLevelCredits >= 45;
  const generalElectiveRequirement = admissionYear <= 2019 ? 40 : admissionYear <= 2022 ? 45 : 44;
  const generalElectiveComplete = generalElectiveCredits >= generalElectiveRequirement;
  const businessComplete =
    !includesBusiness ||
    (businessTotalCredits >= 48 && remainingBusinessCourses.length === 0);
  const statisticsComplete =
    !includesStatistics ||
    (statisticsTotalCredits >= statisticsCreditTarget &&
      remainingStatisticsCourses.length === 0);
  const graduationRequirementsComplete =
    basicRequirementsComplete &&
    totalCreditsComplete &&
    upperLevelComplete &&
    generalElectiveComplete &&
    businessComplete &&
    statisticsComplete;

  const remainingBasicRequirements: RemainingBasicRequirement[] = basicRequirementProfile.sections.flatMap(
    (section) => {
      const unchecked = section.requirements.filter(
        (item) => !effectiveCompletedBasicRequirements.includes(item.id)
      );
      const mandatoryUnchecked = unchecked.filter((item) => item.mandatory);

      if (section.minimumCompleted === undefined) {
        return unchecked.map((item) => ({ ...item, sectionTitle: section.title }));
      }

      const completedCount = section.requirements.length - unchecked.length;
      const deficit = Math.max(0, section.minimumCompleted - completedCount);
      const optionalNeeded = unchecked
        .filter((item) => !item.mandatory)
        .slice(0, Math.max(0, deficit - mandatoryUnchecked.length));
      const remaining = [...mandatoryUnchecked, ...optionalNeeded].filter(
        (item, index, items) => items.findIndex((candidate) => candidate.id === item.id) === index
      );

      return remaining.map((item) => ({ ...item, sectionTitle: section.title }));
    }
  );

  const completionChecks = [
    basicRequirementsComplete,
    totalCreditsComplete,
    upperLevelComplete,
    generalElectiveComplete,
    ...(includesBusiness ? [businessComplete] : []),
    ...(includesStatistics ? [statisticsComplete] : []),
  ];
  const completedSections = completionChecks.filter(Boolean).length;
  const totalRequirementSections = completionChecks.length;

  return (
    <div className="app-shell">
      <Header onReset={resetTracker} />

      <main className="dashboard">
        <section
          className={`hero-status ${
            graduationRequirementsComplete ? "hero-status-complete" : ""
          }`}
        >
          <div className="hero-status-copy">
            <span className="eyebrow">GRADUATION READINESS</span>
            <h1>
              {graduationRequirementsComplete
                ? "졸업 준비가 완료되었습니다."
                : "졸업까지 남은 요건을 한눈에 확인하세요."}
            </h1>
            <p>
              {programType === "business-statistics-double"
                ? "경영학 본전공과 응용통계학 캠퍼스내 복수전공 기준으로 계산합니다."
                : programType === "statistics-single"
                  ? "응용통계학 단일전공 기준으로 이수 현황과 남은 요건을 계산합니다."
                  : "경영학 단일전공 기준으로 이수 현황과 남은 요건을 계산합니다."}{" "}
              입력한 내용은 이 브라우저에 자동 저장됩니다.
            </p>
          </div>

          <div className="readiness-score" aria-label="충족 영역 수">
            <strong>{completedSections}</strong>
            <span>/ {totalRequirementSections}개 졸업요건 충족</span>
          </div>
        </section>

        <UserGuide />

        <section className="panel program-panel" aria-labelledby="program-title">
          <div className="section-heading">
            <div>
              <span className="section-kicker">STEP 1</span>
              <h2 id="program-title">계산할 전공 유형 선택</h2>
              <p>선택한 유형에 따라 적용할 전공학점과 필수과목을 바꿉니다.</p>
            </div>
            <span className="program-current-badge">
              {isDoubleMajor ? "복수전공" : "단일전공"}
            </span>
          </div>
          <div className="curriculum-options program-options" role="radiogroup" aria-label="전공 유형">
            <label className={`curriculum-option ${programType === "business-single" ? "is-selected" : ""}`}>
              <input
                type="radio"
                name="program-type"
                checked={programType === "business-single"}
                onChange={() => setProgramType("business-single")}
              />
              <span className="radio-indicator" aria-hidden="true" />
              <span>
                <strong>경영학 단일전공</strong>
                <small>경영학 48학점과 경영 필수과목을 적용합니다.</small>
              </span>
            </label>
            <label className={`curriculum-option ${programType === "statistics-single" ? "is-selected" : ""}`}>
              <input
                type="radio"
                name="program-type"
                checked={programType === "statistics-single"}
                onChange={() => setProgramType("statistics-single")}
              />
              <span className="radio-indicator" aria-hidden="true" />
              <span>
                <strong>응용통계학 단일전공</strong>
                <small>응용통계학 48학점과 응용통계 필수과목을 적용합니다.</small>
              </span>
            </label>
            <label className={`curriculum-option ${isDoubleMajor ? "is-selected" : ""}`}>
              <input
                type="radio"
                name="program-type"
                checked={isDoubleMajor}
                onChange={() => setProgramType("business-statistics-double")}
              />
              <span className="radio-indicator" aria-hidden="true" />
              <span>
                <strong>경영학 + 응용통계학 복수전공</strong>
                <small>경영학 48학점과 응용통계학 36학점을 함께 적용합니다.</small>
              </span>
            </label>
          </div>
        </section>

        <TranscriptImport
          key={programType}
          requiredCourses={activeRequiredCourses}
          requirementProfile={basicRequirementProfile}
          includeBusiness={includesBusiness}
          includeStatistics={includesStatistics}
          onApply={handleTranscriptApply}
        />

        <section className="summary-grid summary-grid-four" aria-label="졸업요건 요약">
          <article className="summary-card">
            <span className="summary-icon">총</span>
            <div>
              <p>학점 총계</p>
              <strong>{totalEarnedCredits}<small> / 126학점</small></strong>
            </div>
            <span className={`status-dot ${totalCreditsComplete ? "is-complete" : ""}`}>
              {totalCreditsComplete ? "충족" : "진행 중"}
            </span>
          </article>

          <article className="summary-card">
            <span className="summary-icon">고</span>
            <div>
              <p>3·4000단위</p>
              <strong>{upperLevelCredits}<small> / 45학점</small></strong>
            </div>
            <span className={`status-dot ${upperLevelComplete ? "is-complete" : ""}`}>
              {upperLevelComplete ? "충족" : "진행 중"}
            </span>
          </article>

          <article className="summary-card">
            <span className="summary-icon">일</span>
            <div>
              <p>일반선택</p>
              <strong>{generalElectiveCredits}<small> / {generalElectiveRequirement}학점</small></strong>
            </div>
            <span className={`status-dot ${generalElectiveComplete ? "is-complete" : ""}`}>
              {generalElectiveComplete ? "충족" : "진행 중"}
            </span>
          </article>

          {includesBusiness && (
            <article className="summary-card">
              <span className="summary-icon">경</span>
              <div>
                <p>경영학</p>
                <strong>{businessTotalCredits}<small> / 48학점</small></strong>
              </div>
              <span className={`status-dot ${businessComplete ? "is-complete" : ""}`}>
                {businessComplete ? "충족" : "진행 중"}
              </span>
            </article>
          )}

          {includesStatistics && (
            <article className="summary-card">
                <span className="summary-icon">통</span>
                <div>
                  <p>응용통계학</p>
                <strong>{statisticsTotalCredits}<small> / {statisticsCreditTarget}학점</small></strong>
              </div>
              <span className={`status-dot ${statisticsComplete ? "is-complete" : ""}`}>
                {statisticsComplete ? "충족" : "진행 중"}
              </span>
            </article>
          )}
        </section>

        <div className="no-general-minimum-note">
          교양은 별도의 합계 학점 요건 없이 교기·기초교육·대학교양·RC 필수 항목의 이수 여부만 확인합니다. 현재 교기·기초교육·대학교양·RC 반영 학점은 <strong>{totalGeneralCredits}학점</strong>입니다.
        </div>

        {isDoubleMajor && <CrossRecognitionGuide />}

        <div className="dashboard-grid">
          <div className="dashboard-main">
            <section className="panel">
              <div className="section-heading">
                <div>
                  <span className="section-kicker">STEP 2</span>
                  <h2>입학 학번 선택</h2>
                  <p>학번에 맞는 교기·기초교육·대학교양·RC 요건을 자동으로 적용합니다.</p>
                </div>
              </div>

              <div className="admission-year-grid" role="radiogroup" aria-label="입학 학번">
                {admissionYears.map((year) => (
                  <label
                    className={`admission-year-option ${admissionYear === year ? "is-selected" : ""}`}
                    key={year}
                  >
                    <input
                      type="radio"
                      name="admission-year"
                      checked={admissionYear === year}
                      onChange={() => handleAdmissionYearChange(year)}
                    />
                    <strong>{String(year).slice(2)}학번</strong>
                    <small>{year >= 2023 ? "2023~ 기준" : `${year} 기준`}</small>
                  </label>
                ))}
              </div>

              {includesStatistics && (
                <div className="curriculum-summary">
                  <span>응용통계 적용 기준</span>
                  <strong>{statisticsCurriculum === "from2025" ? "2025학번 이후" : "2024학번 이전"}</strong>
                  <small>
                    {programType === "statistics-single"
                      ? statisticsCurriculum === "from2025"
                        ? "필수 21학점 · 전공선택 27학점"
                        : "필수 18학점 · 전공선택 30학점"
                      : statisticsCurriculum === "from2025"
                        ? "필수 21학점 · 전공선택 15학점"
                        : "필수 18학점 · 전공선택 18학점"}
                  </small>
                </div>
              )}
            </section>

            <section className="panel">
              <BasicRequirements
                profile={basicRequirementProfile}
                completedRequirementIds={effectiveCompletedBasicRequirements}
                onToggle={toggleBasicRequirement}
              />
            </section>

            <section className="panel">
              <div className="section-heading course-entry-heading">
                <div>
                  <span className="section-kicker">STEP 4</span>
                  <h2>이수 과목 직접 입력</h2>
                  <p>필수과목 목록에 없는 이수 과목을 과목별로 입력해 주세요.</p>
                </div>
                <button type="button" className="add-course-button" onClick={addManualCourse}>+ 과목 추가</button>
              </div>

              {manualCourses.length === 0 ? (
                <button type="button" className="empty-course-entry" onClick={addManualCourse}>
                  <strong>아직 입력한 과목이 없습니다.</strong>
                  <span>과목 추가를 눌러 과목명과 학점을 입력해 주세요.</span>
                </button>
              ) : (
                <div className="manual-course-list">
                  {manualCourses.map((course, index) => {
                    const isCrossRecognition = isCrossRecognitionCourseName(course.name);
                    const selectedBasicRequirement = basicRequirementOptions.find(
                      (requirement) =>
                        requirement.id === course.basicRequirementId
                    );

                    return (
                    <article className={`manual-course-row ${isCrossRecognition ? "is-cross-recognition" : ""}`} key={course.id}>
                      <span className="course-row-number">{index + 1}</span>
                      <label className="course-name-field">
                        <span className="course-field-label">
                          과목명
                          {isCrossRecognition && <em className="inline-cross-badge">✓ 교차인정 과목</em>}
                          {course.source === "transcript" && (
                            <em className="transcript-source-badge">
                              성적표 자동입력
                            </em>
                          )}
                        </span>
                        <input
                          type="text"
                          value={course.name}
                          placeholder="예: 기업재무"
                          onChange={(event) => updateManualCourse(course.id, "name", event.target.value)}
                        />
                      </label>
                      <label className="course-category-field">
                        <span>이수구분</span>
                        <select
                          value={course.category}
                          onChange={(event) => {
                            const category = event.target.value as ManualCourseCategory;
                            updateManualCourse(course.id, "category", category);
                            if (category === "basic") {
                              updateManualCourse(course.id, "upperLevel", false);
                            }
                          }}
                        >
                          <option value="basic">기본 졸업요건</option>
                          <option value="general">일반선택</option>
                          {includesBusiness ? (
                            <option value="business">경영 전공선택</option>
                          ) : course.category === "business" ? (
                            <option value="business">타전공 · 일반선택 반영</option>
                          ) : null}
                          {includesStatistics ? (
                            <option value="statistics">응용통계 전공선택</option>
                          ) : course.category === "statistics" ? (
                            <option value="statistics">타전공 · 일반선택 반영</option>
                          ) : null}
                        </select>
                        {course.category === "basic" && (
                          <select
                            className="course-basic-requirement-select"
                            value={
                              validBasicRequirementIds.has(
                                course.basicRequirementId ?? ""
                              )
                                ? course.basicRequirementId
                                : ""
                            }
                            aria-label={`${course.name || `${index + 1}번째 과목`} 기본 졸업요건 항목`}
                            onChange={(event) =>
                              updateManualBasicRequirement(
                                course.id,
                                event.target.value
                              )
                            }
                          >
                            <option value="">세부 기본요건 선택</option>
                            {basicRequirementOptions.map((requirement) => (
                              <option value={requirement.id} key={requirement.id}>
                                {requirement.label}
                              </option>
                            ))}
                          </select>
                        )}
                      </label>
                      <label className="course-credit-field">
                        <span>학점</span>
                        <input
                          type="number"
                          min="0"
                          step="0.5"
                          value={
                            course.category === "basic"
                              ? selectedBasicRequirement?.credits ?? 0
                              : course.credits
                          }
                          disabled={course.category === "basic"}
                          onChange={(event) => updateManualCourse(course.id, "credits", Math.max(0, Number(event.target.value) || 0))}
                        />
                      </label>
                      <label className="course-upper-field">
                        <input
                          type="checkbox"
                          checked={course.upperLevel}
                          disabled={course.category === "basic"}
                          onChange={(event) => updateManualCourse(course.id, "upperLevel", event.target.checked)}
                        />
                        <span>3·4000단위</span>
                      </label>
                      <button type="button" className="remove-course-button" onClick={() => removeManualCourse(course.id)} aria-label={`${course.name || `${index + 1}번째 과목`} 삭제`}>×</button>
                    </article>
                    );
                  })}
                </div>
              )}

              <div className="course-entry-summary">
                <span>입력 과목 <strong>{manualCourses.length}개</strong></span>
                <span>기본 졸업요건 <strong>{manualBasicRequirementIds.length}개</strong></span>
                <span>일반선택 <strong>{generalElectiveCredits}학점</strong></span>
                {includesBusiness && (
                  <span>경영 전공선택 <strong>{businessElectiveCredits}학점</strong></span>
                )}
                {includesStatistics && (
                  <span>응용통계 전공선택 <strong>{statisticsElectiveCredits}학점</strong></span>
                )}
              </div>

              <div className="info-banner general-credit-breakdown">
                <span>i</span>
                현재 총 이수학점은 <strong>{totalEarnedCredits}학점</strong>, 3·4000단위 학점은 <strong>{upperLevelCredits}학점</strong>입니다. 직접 입력한 각 과목의 3·4000단위 여부를 개별적으로 선택할 수 있습니다.
              </div>

              {isDoubleMajor && crossRecognitionCredits > 0 && (
                <div className="info-banner">
                  <span>i</span>
                  회계원리(1)·회계원리(2) 교차인정으로 응용통계 전공학점에 <strong>{crossRecognitionCredits}학점</strong>이 반영되었습니다. 총 취득학점에는 중복 합산되지 않습니다.
                </div>
              )}
            </section>

            {includesBusiness && (
              <section className="panel">
                <RequiredList
                  title="경영학과 필수과목"
                  description="이수한 필수과목을 선택해 주세요."
                  courses={businessRequired}
                  selectedCourses={selectedCourses}
                  toggleCourse={toggleCourse}
                />
              </section>
            )}

            {includesStatistics && (
              <section className="panel">
                <RequiredList
                  title="응용통계학과 필수과목"
                  description={statisticsCurriculum === "from2025" ? "2025학번 이후 적용 기준입니다." : "2024학번 이전 적용 기준입니다."}
                  courses={statisticsRequired}
                  selectedCourses={selectedCourses}
                  toggleCourse={toggleCourse}
                />
              </section>
            )}
          </div>

          <aside className="dashboard-sidebar">
            <section className="panel sidebar-panel">
              <Progress
                totalCredits={totalEarnedCredits}
                upperLevelCredits={upperLevelCredits}
                generalElectiveCredits={generalElectiveCredits}
                generalElectiveRequirement={generalElectiveRequirement}
                businessCredits={businessTotalCredits}
                statisticsCredits={statisticsTotalCredits}
                businessCreditTarget={48}
                statisticsCreditTarget={statisticsCreditTarget}
                showBusiness={includesBusiness}
                showStatistics={includesStatistics}
              />
            </section>

            <section className="panel sidebar-panel">
              <RemainingList
                basicRequirements={remainingBasicRequirements}
                generalElectiveRemaining={Math.max(0, generalElectiveRequirement - generalElectiveCredits)}
                businessCourses={remainingBusinessCourses}
                statisticsCourses={remainingStatisticsCourses}
                showBusiness={includesBusiness}
                showStatistics={includesStatistics}
              />
            </section>
          </aside>
        </div>

        <footer className="notice">
          <strong>Yonsei Graduation Tracker · Version 4.2.1</strong>
          <span>본 서비스의 계산 결과는 참고용입니다. 최종 졸업요건은 연세포탈 졸업사정과 소속 학과를 통해 반드시 확인해 주세요.</span>
        </footer>
      </main>
    </div>
  );
}

export default App;
