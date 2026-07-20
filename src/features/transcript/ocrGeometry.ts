interface OcrWord {
  text: string;
  left: number;
  top: number;
  width: number;
  height: number;
}

interface OcrLine {
  text: string;
  top: number;
  bottom: number;
  words: OcrWord[];
}

function parseTsvLines(tsv: string): OcrLine[] {
  const groups = new Map<string, OcrWord[]>();

  for (const row of tsv.split(/\r?\n/).slice(1)) {
    const columns = row.split("\t");
    if (columns.length < 12 || columns[0] !== "5") continue;

    const text = columns.slice(11).join("\t").trim();
    if (!text) continue;

    const word: OcrWord = {
      text,
      left: Number(columns[6]),
      top: Number(columns[7]),
      width: Number(columns[8]),
      height: Number(columns[9]),
    };
    const key = `${columns[2]}-${columns[3]}-${columns[4]}`;
    const words = groups.get(key) ?? [];
    words.push(word);
    groups.set(key, words);
  }

  return [...groups.values()]
    .map((words) => {
      const sortedWords = [...words].sort((left, right) => left.left - right.left);
      return {
        text: sortedWords.map((word) => word.text).join(" "),
        top: Math.min(...sortedWords.map((word) => word.top)),
        bottom: Math.max(
          ...sortedWords.map((word) => word.top + word.height)
        ),
        words: sortedWords,
      };
    })
    .sort((left, right) => left.top - right.top);
}

function collapseSpacedHangul(value: string): string {
  let collapsed = value.replace(/\s+/g, " ").trim();
  let previous = "";
  while (collapsed !== previous) {
    previous = collapsed;
    collapsed = collapsed.replace(/([가-힣])\s+(?=[가-힣])/g, "$1");
  }
  return collapsed;
}

function parseGradeStripLine(
  value: string
): { credits: number; grade: string } | undefined {
  const compact = value
    .toUpperCase()
    .replace(/,/g, ".")
    .replace(/\s+/g, "")
    .replace(/[^0-9.A-DFNPSTUWE+-]/g, "");
  const gradeMatch = compact.match(/(NP|WE|[PSUW]|[A-D](?:[0O+FT-])?|F)$/);
  if (!gradeMatch) return undefined;

  const creditPart = compact.slice(0, gradeMatch.index);
  let credits: number | undefined;
  if (/(?:0?\.5|05)$/.test(creditPart)) credits = 0.5;
  else {
    const wholeCreditMatch = creditPart.match(/([123])0?$/);
    if (wholeCreditMatch) credits = Number(wholeCreditMatch[1]);
  }
  if (!credits) return undefined;

  const rawGrade = gradeMatch[1].replace("O", "0");
  let grade = rawGrade;
  if (/^[A-D](?:F|T)?$/.test(rawGrade)) grade = `${rawGrade[0]}+`;
  if (/^[A-D]0$/.test(rawGrade)) grade = rawGrade;

  return { credits, grade };
}

function isNonCourseLine(value: string): boolean {
  return /(신청|취득|누계|평균|평량|교과목명|학점등급|학점성적|성적증명서)/.test(
    value
  );
}

function cleanOcrCourseName(line: OcrLine, columnWidth: number): string {
  const nameText = line.words
    .filter((word) => word.left < columnWidth * 0.79)
    .map((word) => word.text)
    .join(" ");

  return collapseSpacedHangul(nameText)
    .replace(/^[-_=~·•:;|]+/, "")
    .replace(/\s+(?:0?\.?5|[123])(?:\s*[A-Za-z+0-9.-]+)?$/, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function structureOcrTsv(
  fullTsv: string,
  gradeTsv: string,
  columnWidth: number
): string {
  const fullLines = parseTsvLines(fullTsv);
  const gradeLines = parseTsvLines(gradeTsv);
  const events: Array<{ top: number; text: string }> = [];

  for (const line of fullLines) {
    const normalized = collapseSpacedHangul(line.text);
    const termMatch = normalized
      .replace(/\s+/g, "")
      .match(/(20\d{2})학년도(1|2|여름|겨울)학기/);
    if (termMatch) {
      events.push({
        top: line.top,
        text: `${termMatch[1]}학년도 ${termMatch[2]}학기`,
      });
    }
  }

  for (const gradeLine of gradeLines) {
    const grade = parseGradeStripLine(gradeLine.text);
    if (!grade) continue;

    const gradeCenter = (gradeLine.top + gradeLine.bottom) / 2;
    const candidates = fullLines
      .map((line, index) => ({
        line,
        index,
        distance: Math.abs((line.top + line.bottom) / 2 - gradeCenter),
      }))
      .sort((left, right) => left.distance - right.distance);
    const nearest = candidates[0];
    if (!nearest || nearest.distance > 32) continue;

    let name = cleanOcrCourseName(nearest.line, columnWidth);
    const previousLine = fullLines[nearest.index - 1];
    if (previousLine) {
      const previousText = cleanOcrCourseName(previousLine, columnWidth);
      const gap = nearest.line.top - previousLine.bottom;
      if (
        gap >= 0 &&
        gap < 24 &&
        (previousText.endsWith(":") || /^(Theory|Practice)/i.test(name)) &&
        !isNonCourseLine(previousText)
      ) {
        name = `${previousText} ${name}`;
      }
    }

    if (
      name.length < 2 ||
      isNonCourseLine(name) ||
      /20\d{2}학년도/.test(name)
    ) {
      continue;
    }

    events.push({
      top: nearest.line.top,
      text: `${name} ${grade.credits} ${grade.grade}`,
    });
  }

  return events
    .sort((left, right) => left.top - right.top)
    .filter(
      (event, index, allEvents) =>
        index === 0 ||
        event.text !== allEvents[index - 1].text ||
        Math.abs(event.top - allEvents[index - 1].top) > 3
    )
    .map((event) => event.text)
    .join("\n");
}
