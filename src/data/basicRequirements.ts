export type AdmissionYear = 2018 | 2019 | 2020 | 2021 | 2022 | 2023 | 2024 | 2025 | 2026;

export type RequirementGroup = "christian" | "foundation" | "liberalArts" | "rc";

export interface BasicRequirement {
  id: string;
  title: string;
  description: string;
  group: RequirementGroup;
  credits?: number;
  mandatory?: boolean;
}

export interface RequirementSection {
  id: RequirementGroup;
  title: string;
  description: string;
  minimumCompleted?: number;
  requirements: BasicRequirement[];
}

export interface YearRequirementProfile {
  admissionYear: AdmissionYear;
  label: string;
  liberalArtsName: "필수교양" | "대학교양";
  sections: RequirementSection[];
  sourceNote: string;
}

const liberalArts2018: BasicRequirement[] = [
  ["literature-art", "문학과예술"],
  ["human-history", "인간과역사"],
  ["language-expression", "언어와표현"],
  ["value-ethics", "가치와윤리"],
  ["nation-community", "국가와사회공동체"],
  ["region-world", "지역과세계", "ECO1002 경제학개론을 반드시 이수해야 합니다."],
  ["logic-math", "논리와수리", "STA1001 통계학입문을 반드시 이수해야 합니다."],
  ["nature-universe", "자연과우주"],
  ["life-environment", "생명과환경"],
  ["software", "소프트웨어"],
].map(([id, title, note]) => ({
  id,
  title,
  description: note ?? `${title} 영역에서 1과목 이상 이수했습니다.`,
  group: "liberalArts" as const,
  mandatory: id === "region-world" || id === "logic-math",
  credits: 3,
}));

const liberalArts2019: BasicRequirement[] = [
  ["literature-art", "문학과예술"],
  ["human-history", "인간과역사"],
  ["language-expression", "언어와표현"],
  ["value-ethics", "가치와윤리"],
  ["nation-society", "국가와사회"],
  ["region-world", "지역과세계", "ECO1002 경제학개론을 반드시 이수해야 합니다."],
  ["logic-math", "논리와수리", "STA1001 통계학입문을 반드시 이수해야 합니다."],
  ["nature-universe", "자연과우주"],
  ["life-environment", "생명과환경"],
  ["information-technology", "정보와기술"],
].map(([id, title, note]) => ({
  id,
  title,
  description: note ?? `${title} 영역에서 1과목 이상 이수했습니다.`,
  group: "liberalArts" as const,
  mandatory: id === "region-world" || id === "logic-math",
  credits: 3,
}));

const liberalArtsFrom2020: BasicRequirement[] = liberalArts2019.map((item) => ({
  ...item,
  mandatory: item.mandatory || item.id === "information-technology",
  description:
    item.id === "information-technology"
      ? "정보와기술 영역에서 1과목 이상 반드시 이수해야 합니다."
      : item.description,
}));

function createSharedSections(
  liberalArtsName: "필수교양" | "대학교양",
  liberalArts: BasicRequirement[],
  includeEnglish: boolean,
  includeSocialParticipation: boolean
): RequirementSection[] {
  const foundation: BasicRequirement[] = [
    {
      id: "writing",
      title: "글쓰기",
      description: "글쓰기 과목을 이수했습니다.",
      group: "foundation",
      credits: 6,
      mandatory: true,
    },
    ...(includeEnglish
      ? [
          {
            id: "english-two-courses",
            title: "영어 2과목",
            description: "영어 과목 2개를 모두 이수했습니다.",
            group: "foundation" as const,
            credits: 2,
            mandatory: true,
          },
        ]
      : []),
    {
      id: "christian-understanding",
      title: "기독교의 이해",
      description: "기독교의 이해 과목을 이수했습니다.",
      group: "foundation",
      credits: 3,
      mandatory: true,
    },
  ];

  const rc: BasicRequirement[] = [
    ...(includeSocialParticipation
      ? [
          {
            id: "social-participation",
            title: "사회참여",
            description: "RC 필수 사회참여 과목을 이수했습니다.",
            group: "rc" as const,
            credits: 1,
            mandatory: true,
          },
        ]
      : []),
    {
      id: "yonsei-rc101",
      title: "Yonsei RC101",
      description: "Yonsei RC101 과목을 이수했습니다.",
      group: "rc",
      credits: 1,
      mandatory: true,
    },
    {
      id: "rc-self-directed-activity",
      title: "RC 자기주도활동",
      description: "RC 자기주도활동을 이수했습니다.",
      group: "rc",
      credits: 1,
      mandatory: true,
    },
  ];

  return [
    {
      id: "christian",
      title: "교기",
      description: "채플 0.5학점 과목을 총 4회 이수해야 합니다.",
      requirements: [
        {
          id: "chapel-four",
          title: "채플 4회",
          description: "채플을 총 4회(2학점) 이수했습니다.",
          group: "christian",
          credits: 2,
          mandatory: true,
        },
      ],
    },
    {
      id: "foundation",
      title: "기초교육",
      description: includeEnglish
        ? "글쓰기, 영어 2과목, 기독교의 이해를 모두 이수해야 합니다."
        : "글쓰기와 기독교의 이해를 모두 이수해야 합니다.",
      requirements: foundation,
    },
    {
      id: "liberalArts",
      title: liberalArtsName,
      description: "10개 영역 중 최소 8개 영역을 이수하고 필수 지정 영역을 충족해야 합니다.",
      minimumCompleted: 8,
      requirements: liberalArts,
    },
    {
      id: "rc",
      title: "RC 필수",
      description: includeSocialParticipation
        ? "사회참여, Yonsei RC101, RC 자기주도활동을 모두 이수해야 합니다."
        : "Yonsei RC101과 RC 자기주도활동을 모두 이수해야 합니다.",
      requirements: rc,
    },
  ];
}

function profileForYear(year: AdmissionYear): YearRequirementProfile {
  if (year === 2018) {
    return {
      admissionYear: year,
      label: "2018학번",
      liberalArtsName: "필수교양",
      sections: createSharedSections("필수교양", liberalArts2018, true, true),
      sourceNote: "2018학번 경영학 본전공 졸업기준",
    };
  }

  if (year === 2019) {
    return {
      admissionYear: year,
      label: "2019학번",
      liberalArtsName: "대학교양",
      sections: createSharedSections("대학교양", liberalArts2019, true, true),
      sourceNote: "2019학번 경영학 본전공 졸업기준",
    };
  }

  return {
    admissionYear: year,
    label: `${year}학번`,
    liberalArtsName: "대학교양",
    sections: createSharedSections("대학교양", liberalArtsFrom2020, false, false),
    sourceNote: year >= 2023 ? "졸업기준표의 2023학번 이후 기준 적용" : `${year}학번 경영학 본전공 졸업기준`,
  };
}

export const admissionYears: AdmissionYear[] = [2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026];

export const yearRequirementProfiles = Object.fromEntries(
  admissionYears.map((year) => [year, profileForYear(year)])
) as Record<AdmissionYear, YearRequirementProfile>;

export function getYearRequirementProfile(year: AdmissionYear): YearRequirementProfile {
  return yearRequirementProfiles[year];
}

export function getAllRequirementIds(profile: YearRequirementProfile): string[] {
  return profile.sections.flatMap((section) => section.requirements.map((item) => item.id));
}

export function calculateCompletedRequirementCredits(
  profile: YearRequirementProfile,
  completedIds: string[]
): number {
  return profile.sections
    .flatMap((section) => section.requirements)
    .filter((requirement) => completedIds.includes(requirement.id))
    .reduce((total, requirement) => total + (requirement.credits ?? 0), 0);
}

export function isRequirementProfileComplete(
  profile: YearRequirementProfile,
  completedIds: string[]
): boolean {
  return profile.sections.every((section) => {
    const completedCount = section.requirements.filter((item) => completedIds.includes(item.id)).length;
    const mandatoryComplete = section.requirements
      .filter((item) => item.mandatory)
      .every((item) => completedIds.includes(item.id));
    const minimumComplete = section.minimumCompleted === undefined || completedCount >= section.minimumCompleted;

    return mandatoryComplete && minimumComplete;
  });
}
