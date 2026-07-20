export type TranscriptManualCategory = "general" | "business" | "statistics";

export type TranscriptClassification =
  | TranscriptManualCategory
  | "required"
  | "basic"
  | "unclassified";

export type TranscriptConfidence = "high" | "review";

export interface ParsedTranscriptCourse {
  id: string;
  term: string;
  name: string;
  credits: number;
  grade: string;
  englishTaught: boolean;
  confidence: TranscriptConfidence;
}

export interface ReviewedTranscriptCourse extends ParsedTranscriptCourse {
  selected: boolean;
  classification: TranscriptClassification;
  upperLevel: boolean;
  matchedRequiredCourseId?: number;
  matchedRequiredCourseName?: string;
  matchedBasicRequirementId?: string;
  matchedBasicRequirementName?: string;
  suggestion?: string;
}

export interface TranscriptParseResult {
  courses: ParsedTranscriptCourse[];
  warnings: string[];
  pageCount: number;
  usedOcr: boolean;
  recognizedCredits: number;
  transcriptTotalCredits?: number;
}

export interface TranscriptProgress {
  stage: "preparing" | "rendering" | "ocr" | "parsing";
  progress: number;
  message: string;
}

export interface TranscriptApplyPayload {
  requiredCourseIds: number[];
  basicRequirementIds: string[];
  manualCourses: Array<{
    name: string;
    credits: number;
    category: TranscriptManualCategory;
    upperLevel: boolean;
    term: string;
    grade: string;
  }>;
}
