import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";

import { structureOcrTsv } from "./ocrGeometry";
import { parseTranscriptText } from "./transcriptParser";
import type { TranscriptParseResult, TranscriptProgress } from "./types";

const MAX_FILE_SIZE = 12 * 1024 * 1024;
const MAX_PAGES = 6;
const RENDER_SCALE = 2.5;

type ProgressCallback = (progress: TranscriptProgress) => void;

interface PdfTextItem {
  str: string;
  transform: number[];
}

type OcrWorker = Awaited<
  ReturnType<(typeof import("tesseract.js"))["createWorker"]>
>;

function emitProgress(
  callback: ProgressCallback,
  stage: TranscriptProgress["stage"],
  progress: number,
  message: string
) {
  callback({ stage, progress: Math.min(1, Math.max(0, progress)), message });
}

function validateFile(file: File) {
  if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
    throw new Error("PDF 형식의 성적증명서만 첨부할 수 있습니다.");
  }
  if (file.size === 0) throw new Error("빈 PDF 파일입니다.");
  if (file.size > MAX_FILE_SIZE) throw new Error("PDF 크기는 12MB 이하여야 합니다.");
}

function findTranscriptTotalCredits(text: string): number | undefined {
  const compact = text.replace(/\s+/g, "").replace(/,/g, ".");
  const matches = [...compact.matchAll(/누[계게](?:취득)?[^0-9]{0,12}(\d{1,3}(?:\.\d+)?)/g)]
    .map((match) => Number(match[1]))
    .filter((value) => Number.isFinite(value) && value > 0 && value <= 300);
  return matches.length > 0 ? Math.max(...matches) : undefined;
}

function addCreditValidation(
  result: TranscriptParseResult,
  sourceText: string
): TranscriptParseResult {
  const transcriptTotalCredits = findTranscriptTotalCredits(sourceText);
  if (
    transcriptTotalCredits !== undefined &&
    Math.abs(transcriptTotalCredits - result.recognizedCredits) > 0.5
  ) {
    result.warnings.push(
      `누계 ${transcriptTotalCredits}학점 중 ${result.recognizedCredits}학점을 과목 행으로 인식했습니다. 누락되거나 잘못 읽힌 과목을 확인해 주세요.`
    );
  }

  return { ...result, transcriptTotalCredits };
}

function groupTextItemsByColumn(items: PdfTextItem[], pageWidth: number): string[] {
  const columns = [
    items.filter((item) => item.transform[4] < pageWidth / 2),
    items.filter((item) => item.transform[4] >= pageWidth / 2),
  ];

  return columns.map((columnItems) => {
    const rows = new Map<number, PdfTextItem[]>();
    for (const item of columnItems) {
      const y = Math.round(item.transform[5] / 3) * 3;
      const row = rows.get(y) ?? [];
      row.push(item);
      rows.set(y, row);
    }

    return [...rows.entries()]
      .sort(([leftY], [rightY]) => rightY - leftY)
      .map(([, row]) =>
        row
          .sort((left, right) => left.transform[4] - right.transform[4])
          .map((item) => item.str)
          .join(" ")
      )
      .join("\n");
  });
}

function cropTranscriptColumn(
  source: HTMLCanvasElement,
  side: "left" | "right"
): HTMLCanvasElement {
  const startXRatio = side === "left" ? 0.075 : 0.5;
  const endXRatio = side === "left" ? 0.5 : 0.925;
  const startYRatio = 0.265;
  const endYRatio = 0.77;
  const sourceX = Math.floor(source.width * startXRatio);
  const sourceY = Math.floor(source.height * startYRatio);
  const sourceWidth = Math.floor(source.width * (endXRatio - startXRatio));
  const sourceHeight = Math.floor(source.height * (endYRatio - startYRatio));

  const canvas = document.createElement("canvas");
  canvas.width = sourceWidth;
  canvas.height = sourceHeight;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("성적증명서 이미지를 처리할 수 없습니다.");

  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(
    source,
    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight,
    0,
    0,
    sourceWidth,
    sourceHeight
  );

  return canvas;
}

function cropGradeStrip(source: HTMLCanvasElement): HTMLCanvasElement {
  const sourceX = Math.floor(source.width * 0.78);
  const sourceWidth = source.width - sourceX;
  const canvas = document.createElement("canvas");
  canvas.width = sourceWidth;
  canvas.height = source.height;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("학점과 성적 영역을 처리할 수 없습니다.");

  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(
    source,
    sourceX,
    0,
    sourceWidth,
    source.height,
    0,
    0,
    sourceWidth,
    source.height
  );
  return canvas;
}

export async function recognizeTranscriptPdf(
  file: File,
  onProgress: ProgressCallback
): Promise<TranscriptParseResult> {
  validateFile(file);
  emitProgress(onProgress, "preparing", 0.02, "PDF를 안전하게 확인하고 있습니다.");

  const { getDocument, GlobalWorkerOptions } = await import("pdfjs-dist");
  GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
  const data = new Uint8Array(await file.arrayBuffer());
  const loadingTask = getDocument({ data });
  const pdf = await loadingTask.promise;
  const pageCount = pdf.numPages;

  if (pdf.numPages > MAX_PAGES) {
    await loadingTask.destroy();
    throw new Error(`최대 ${MAX_PAGES}페이지까지 처리할 수 있습니다.`);
  }

  const nativeTextChunks: string[] = [];
  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    const items: PdfTextItem[] = content.items.flatMap((item) =>
      "str" in item && "transform" in item
        ? [{ str: item.str, transform: [...item.transform] }]
        : []
    );
    const pageWidth = page.view[2] - page.view[0];
    nativeTextChunks.push(...groupTextItemsByColumn(items, pageWidth));
  }

  const nativeText = nativeTextChunks.join("\n");
  if (/20\d{2}\s*학년도/.test(nativeText) && nativeText.length > 300) {
    emitProgress(onProgress, "parsing", 0.95, "전자 PDF의 과목 정보를 정리하고 있습니다.");
    const result = addCreditValidation(
      parseTranscriptText(nativeText, {
        pageCount,
        usedOcr: false,
      }),
      nativeText
    );
    await loadingTask.destroy();
    emitProgress(onProgress, "parsing", 1, "성적증명서 인식이 완료되었습니다.");
    return result;
  }

  let activePage = 0;
  let activeColumn = 0;
  let activePass = 0;
  let worker: OcrWorker | undefined;
  const ocrChunks: string[] = [];
  const rawOcrChunks: string[] = [];
  try {
    const { createWorker, OEM, PSM } = await import("tesseract.js");
    worker = await createWorker("kor+eng", OEM.LSTM_ONLY, {
      logger: (message) => {
        if (message.status !== "recognizing text") return;
        const totalColumns = pageCount * 2;
        const completedColumns = activePage * 2 + activeColumn;
        const passProgress =
          activePass === 0 ? message.progress * 0.82 : 0.82 + message.progress * 0.18;
        const overall = (completedColumns + passProgress) / totalColumns;
        emitProgress(
          onProgress,
          "ocr",
          0.12 + overall * 0.78,
          `${activePage + 1}페이지 ${activeColumn === 0 ? "왼쪽" : "오른쪽"} 영역을 인식하고 있습니다.`
        );
      },
    });

    await worker.setParameters({
      tessedit_pageseg_mode: PSM.SINGLE_BLOCK,
      preserve_interword_spaces: "1",
      user_defined_dpi: "300",
    });

    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      activePage = pageNumber - 1;
      emitProgress(
        onProgress,
        "rendering",
        0.08 + (activePage / pdf.numPages) * 0.04,
        `${pageNumber}페이지를 OCR 이미지로 변환하고 있습니다.`
      );

      const page = await pdf.getPage(pageNumber);
      const viewport = page.getViewport({ scale: RENDER_SCALE });
      const pageCanvas = document.createElement("canvas");
      pageCanvas.width = Math.floor(viewport.width);
      pageCanvas.height = Math.floor(viewport.height);
      await page.render({ canvas: pageCanvas, viewport }).promise;

      for (const [columnIndex, side] of (["left", "right"] as const).entries()) {
        activeColumn = columnIndex;
        const columnCanvas = cropTranscriptColumn(pageCanvas, side);
        activePass = 0;
        await worker.reinitialize("kor+eng");
        await worker.setParameters({
          tessedit_pageseg_mode: PSM.SINGLE_BLOCK,
          preserve_interword_spaces: "1",
          tessedit_char_whitelist: "",
        });
        const fullResult = await worker.recognize(
          columnCanvas,
          { rotateAuto: true },
          { text: true, tsv: true }
        );

        activePass = 1;
        const gradeCanvas = cropGradeStrip(columnCanvas);
        await worker.reinitialize("eng");
        await worker.setParameters({
          tessedit_pageseg_mode: PSM.SINGLE_BLOCK,
          preserve_interword_spaces: "1",
          tessedit_char_whitelist: "0123456789.ABCDFNPSTUWE+-",
        });
        const gradeResult = await worker.recognize(
          gradeCanvas,
          { rotateAuto: false },
          { text: true, tsv: true }
        );

        const structuredText = structureOcrTsv(
          fullResult.data.tsv ?? "",
          gradeResult.data.tsv ?? "",
          columnCanvas.width
        );
        ocrChunks.push(
          `[PAGE ${pageNumber} ${side.toUpperCase()}]\n${structuredText}`
        );
        rawOcrChunks.push(fullResult.data.text);
        gradeCanvas.width = 1;
        gradeCanvas.height = 1;
        columnCanvas.width = 1;
        columnCanvas.height = 1;
      }

      pageCanvas.width = 1;
      pageCanvas.height = 1;
      page.cleanup();
    }
  } finally {
    if (worker) await worker.terminate();
    await loadingTask.destroy();
  }

  emitProgress(onProgress, "parsing", 0.94, "인식된 과목과 학기를 정리하고 있습니다.");
  const result = addCreditValidation(
    parseTranscriptText(ocrChunks.join("\n"), {
      pageCount,
      usedOcr: true,
    }),
    rawOcrChunks.join("\n")
  );
  emitProgress(onProgress, "parsing", 1, "성적증명서 인식이 완료되었습니다.");
  return result;
}
