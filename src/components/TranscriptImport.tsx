import { useRef, useState, type ChangeEvent, type DragEvent } from "react";

import type { RequiredCourse } from "../data/types";
import type { YearRequirementProfile } from "../data/basicRequirements";
import { recognizeTranscriptPdf } from "../features/transcript/pdfOcr";
import { matchTranscriptCourses } from "../features/transcript/transcriptMatcher";
import type {
  TranscriptApplyPayload,
  TranscriptClassification,
  TranscriptProgress,
  ReviewedTranscriptCourse,
} from "../features/transcript/types";

interface TranscriptImportProps {
  requiredCourses: RequiredCourse[];
  requirementProfile: YearRequirementProfile;
  includeBusiness: boolean;
  includeStatistics: boolean;
  onApply: (payload: TranscriptApplyPayload) => void;
}

type ImportStatus = "idle" | "processing" | "review" | "applied" | "error";

const categoryLabels: Record<TranscriptClassification, string> = {
  required: "전공 필수",
  basic: "기본 졸업요건",
  general: "일반선택",
  business: "경영 전공선택",
  statistics: "응용통계 전공선택",
  unclassified: "분류 필요",
};

function TranscriptImport({
  requiredCourses,
  requirementProfile,
  includeBusiness,
  includeStatistics,
  onApply,
}: TranscriptImportProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<ImportStatus>("idle");
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState("");
  const [progress, setProgress] = useState<TranscriptProgress>({
    stage: "preparing",
    progress: 0,
    message: "PDF를 선택해 주세요.",
  });
  const [courses, setCourses] = useState<ReviewedTranscriptCourse[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [creditCheck, setCreditCheck] = useState<{
    recognized: number;
    transcript?: number;
  }>({ recognized: 0 });
  const [error, setError] = useState("");
  const basicRequirementOptions = requirementProfile.sections.flatMap(
    (section) =>
      section.requirements.map((requirement) => ({
        id: requirement.id,
        label: `${section.title} · ${requirement.title}`,
        title: requirement.title,
      }))
  );

  const processFile = async (file?: File) => {
    if (!file) return;

    setFileName(file.name);
    setStatus("processing");
    setError("");
    setWarnings([]);
    setCourses([]);

    try {
      const result = await recognizeTranscriptPdf(file, setProgress);
      if (result.courses.length === 0) {
        throw new Error(result.warnings[0] ?? "과목 정보를 인식하지 못했습니다.");
      }

      setCourses(
        matchTranscriptCourses(result.courses, requiredCourses, requirementProfile)
      );
      setWarnings(result.warnings);
      setCreditCheck({
        recognized: result.recognizedCredits,
        transcript: result.transcriptTotalCredits,
      });
      setStatus("review");
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "성적증명서를 처리하는 중 오류가 발생했습니다."
      );
      setStatus("error");
    }
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    void processFile(event.target.files?.[0]);
    event.target.value = "";
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    if (status === "processing") return;
    void processFile(event.dataTransfer.files?.[0]);
  };

  const updateCourse = (
    id: string,
    updates: Partial<ReviewedTranscriptCourse>
  ) => {
    setCourses((current) =>
      current.map((course) =>
        course.id === id ? { ...course, ...updates } : course
      )
    );
  };

  const updateClassification = (
    id: string,
    classification: TranscriptClassification
  ) => {
    updateCourse(id, {
      classification,
      matchedRequiredCourseId:
        classification === "required"
          ? courses.find((course) => course.id === id)?.matchedRequiredCourseId
          : undefined,
      matchedRequiredCourseName:
        classification === "required"
          ? courses.find((course) => course.id === id)?.matchedRequiredCourseName
          : undefined,
      matchedBasicRequirementId:
        classification === "basic"
          ? courses.find((course) => course.id === id)?.matchedBasicRequirementId
          : undefined,
      matchedBasicRequirementName:
        classification === "basic"
          ? courses.find((course) => course.id === id)?.matchedBasicRequirementName
          : undefined,
    });
  };

  const updateBasicRequirement = (id: string, requirementId: string) => {
    const requirement = basicRequirementOptions.find(
      (option) => option.id === requirementId
    );

    updateCourse(id, {
      classification: "basic",
      matchedBasicRequirementId: requirement?.id,
      matchedBasicRequirementName: requirement?.title,
      matchedRequiredCourseId: undefined,
      matchedRequiredCourseName: undefined,
    });
  };

  const classifyUnresolved = (
    classification: "general" | "business" | "statistics"
  ) => {
    setCourses((current) =>
      current.map((course) =>
        course.selected && course.classification === "unclassified"
          ? { ...course, classification }
          : course
      )
    );
  };

  const selectedCourses = courses.filter((course) => course.selected);
  const unresolvedCount = selectedCourses.filter(
    (course) =>
      course.classification === "unclassified" ||
      (course.classification === "basic" &&
        course.matchedBasicRequirementId === undefined)
  ).length;
  const requiredCount = selectedCourses.filter(
    (course) => course.classification === "required"
  ).length;
  const basicCount = selectedCourses.filter(
    (course) =>
      course.classification === "basic" &&
      course.matchedBasicRequirementId !== undefined
  ).length;

  const applyCourses = () => {
    if (unresolvedCount > 0) return;

    const payload: TranscriptApplyPayload = {
      requiredCourseIds: selectedCourses
        .filter(
          (course) =>
            course.classification === "required" &&
            course.matchedRequiredCourseId !== undefined
        )
        .map((course) => course.matchedRequiredCourseId as number),
      basicRequirementIds: selectedCourses
        .filter(
          (course) =>
            course.classification === "basic" &&
            course.matchedBasicRequirementId !== undefined
        )
        .map((course) => course.matchedBasicRequirementId as string),
      manualCourses: selectedCourses
        .filter(
          (
            course
          ): course is ReviewedTranscriptCourse & {
            classification: "general" | "business" | "statistics";
          } =>
            course.classification === "general" ||
            course.classification === "business" ||
            course.classification === "statistics"
        )
        .map((course) => ({
          name: course.name,
          credits: course.credits,
          category: course.classification,
          upperLevel: course.upperLevel,
          term: course.term,
          grade: course.grade,
        })),
    };

    onApply(payload);
    setStatus("applied");
  };

  return (
    <section className="panel transcript-panel">
      <div className="section-heading transcript-heading">
        <div>
          <span className="section-kicker">PDF IMPORT · VERSION 4.2.1</span>
          <h2>성적증명서 자동 불러오기</h2>
          <p>
            국문 성적증명서 PDF에서 과목명·학점·성적을 인식하고 기존 계산에
            반영합니다.
          </p>
        </div>
        <span className="privacy-badge">브라우저 내 처리</span>
      </div>

      <input
        ref={inputRef}
        className="visually-hidden"
        type="file"
        accept="application/pdf,.pdf"
        onChange={handleFileChange}
      />

      {status === "idle" && (
        <div
          className={`transcript-dropzone ${isDragging ? "is-dragging" : ""}`}
          onDragEnter={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragOver={(event) => event.preventDefault()}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
        >
          <span className="upload-icon" aria-hidden="true">PDF</span>
          <strong>성적증명서 PDF를 놓아주세요.</strong>
          <p>이미지형 PDF도 OCR로 인식하며, 파일은 외부 서버에 저장되지 않습니다.</p>
          <button type="button" onClick={() => inputRef.current?.click()}>
            PDF 선택
          </button>
          <small>최대 12MB · 6페이지 · 국문 양식 우선 지원</small>
        </div>
      )}

      {status === "processing" && (
        <div className="transcript-processing" aria-live="polite">
          <div className="processing-copy">
            <span className="processing-spinner" aria-hidden="true" />
            <div>
              <strong>{fileName}</strong>
              <p>{progress.message}</p>
            </div>
            <b>{Math.round(progress.progress * 100)}%</b>
          </div>
          <div className="processing-track">
            <span style={{ width: `${progress.progress * 100}%` }} />
          </div>
          <small>첫 실행에서는 한국어 OCR 모델을 불러와 시간이 조금 걸릴 수 있습니다.</small>
        </div>
      )}

      {status === "error" && (
        <div className="transcript-error" role="alert">
          <div>
            <strong>PDF를 처리하지 못했습니다.</strong>
            <p>{error}</p>
          </div>
          <button type="button" onClick={() => inputRef.current?.click()}>
            다른 PDF 선택
          </button>
        </div>
      )}

      {(status === "review" || status === "applied") && (
        <div className="transcript-review">
          <div className="transcript-review-summary">
            <div>
              <strong>{courses.length}개 과목 인식</strong>
              <span>
                {creditCheck.recognized}학점 인식
                {creditCheck.transcript !== undefined
                  ? ` / 성적표 누계 ${creditCheck.transcript}학점`
                  : ""}
                {` · ${requiredCount}개 필수 · ${basicCount}개 기본요건 지정`}
              </span>
            </div>
            <div className="review-summary-actions">
              <span className={unresolvedCount > 0 ? "needs-review" : "ready"}>
                {unresolvedCount > 0
                  ? `${unresolvedCount}개 분류 필요`
                  : "반영 준비 완료"}
              </span>
              <button type="button" onClick={() => inputRef.current?.click()}>
                다시 인식
              </button>
            </div>
          </div>

          {warnings.map((warning) => (
            <div className="transcript-warning" key={warning}>주의 · {warning}</div>
          ))}

          {unresolvedCount > 0 && status !== "applied" && (
            <div className="bulk-classification">
              <span>미분류 과목 일괄 지정</span>
              <button type="button" onClick={() => classifyUnresolved("general")}>일반선택</button>
              {includeBusiness && (
                <button type="button" onClick={() => classifyUnresolved("business")}>경영 전공선택</button>
              )}
              {includeStatistics && (
                <button type="button" onClick={() => classifyUnresolved("statistics")}>응용통계 전공선택</button>
              )}
            </div>
          )}

          <div className="transcript-table-wrap">
            <table className="transcript-table">
              <thead>
                <tr>
                  <th>반영</th>
                  <th>과목명</th>
                  <th>학점</th>
                  <th>성적</th>
                  <th>분류</th>
                  <th>3·4000</th>
                </tr>
              </thead>
              <tbody>
                {courses.map((course) => (
                  <tr
                    className={
                      !course.selected
                        ? "is-excluded"
                        : course.classification === "unclassified" ||
                            (course.classification === "basic" &&
                              course.matchedBasicRequirementId === undefined)
                          ? "needs-review-row"
                          : ""
                    }
                    key={course.id}
                  >
                    <td>
                      <input
                        type="checkbox"
                        checked={course.selected}
                        disabled={status === "applied"}
                        aria-label={`${course.name} 반영`}
                        onChange={(event) =>
                          updateCourse(course.id, { selected: event.target.checked })
                        }
                      />
                    </td>
                    <td>
                      <input
                        className="transcript-name-input"
                        value={course.name}
                        disabled={status === "applied"}
                        onChange={(event) =>
                          updateCourse(course.id, { name: event.target.value })
                        }
                      />
                      {course.suggestion && <small>{course.suggestion}</small>}
                    </td>
                    <td>
                      <input
                        className="transcript-credit-input"
                        type="number"
                        min="0"
                        max="6"
                        step="0.5"
                        value={course.credits}
                        disabled={status === "applied"}
                        onChange={(event) =>
                          updateCourse(course.id, {
                            credits: Math.max(0, Number(event.target.value) || 0),
                          })
                        }
                      />
                    </td>
                    <td><strong className="grade-label">{course.grade}</strong></td>
                    <td>
                      {course.classification === "required" ? (
                        <select
                          value="required"
                          disabled={status === "applied"}
                          onChange={(event) =>
                            updateClassification(
                              course.id,
                              event.target.value as TranscriptClassification
                            )
                          }
                        >
                          <option value="required">필수 · {course.matchedRequiredCourseName}</option>
                          <option value="basic">기본 졸업요건</option>
                          <option value="general">일반선택</option>
                          {includeBusiness && <option value="business">경영 전공선택</option>}
                          {includeStatistics && <option value="statistics">응용통계 전공선택</option>}
                          <option value="unclassified">분류 필요</option>
                        </select>
                      ) : course.classification === "basic" ? (
                        <div className="transcript-classification-stack">
                          <select
                            value="basic"
                            disabled={status === "applied"}
                            onChange={(event) =>
                              updateClassification(
                                course.id,
                                event.target.value as TranscriptClassification
                              )
                            }
                          >
                            <option value="basic">기본 졸업요건</option>
                            <option value="general">일반선택</option>
                            {includeBusiness && <option value="business">경영 전공선택</option>}
                            {includeStatistics && <option value="statistics">응용통계 전공선택</option>}
                            <option value="unclassified">분류 필요</option>
                          </select>
                          <select
                            className="basic-requirement-select"
                            value={course.matchedBasicRequirementId ?? ""}
                            disabled={status === "applied"}
                            aria-label={`${course.name} 기본 졸업요건 항목`}
                            onChange={(event) =>
                              updateBasicRequirement(course.id, event.target.value)
                            }
                          >
                            <option value="">세부 기본요건 선택</option>
                            {basicRequirementOptions.map((option) => (
                              <option value={option.id} key={option.id}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      ) : (
                        <select
                          value={course.classification}
                          disabled={status === "applied"}
                          aria-label={`${course.name} 이수구분`}
                          onChange={(event) =>
                            updateClassification(
                              course.id,
                              event.target.value as TranscriptClassification
                            )
                          }
                        >
                          <option value="unclassified">분류 필요</option>
                          <option value="basic">기본 졸업요건</option>
                          <option value="general">일반선택</option>
                          {includeBusiness && <option value="business">경영 전공선택</option>}
                          {includeStatistics && <option value="statistics">응용통계 전공선택</option>}
                        </select>
                      )}
                      <small>{categoryLabels[course.classification]}</small>
                    </td>
                    <td>
                      <input
                        type="checkbox"
                        checked={course.upperLevel}
                        disabled={
                          status === "applied" ||
                          course.classification === "required" ||
                          course.classification === "basic"
                        }
                        aria-label={`${course.name} 3·4000단위`}
                        onChange={(event) =>
                          updateCourse(course.id, { upperLevel: event.target.checked })
                        }
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="transcript-apply-row">
            <p>
              OCR 결과와 이수구분을 확인한 뒤 반영해 주세요. 기본 졸업요건은
              해당 세부 항목까지 선택해야 계산에 반영됩니다.
            </p>
            {status === "applied" ? (
              <span className="applied-message">✓ 기존 졸업요건 계산에 반영했습니다.</span>
            ) : (
              <button
                type="button"
                disabled={unresolvedCount > 0 || selectedCourses.length === 0}
                onClick={applyCourses}
              >
                확인한 {selectedCourses.length}개 과목 반영
              </button>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

export default TranscriptImport;
