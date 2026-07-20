import type { BasicRequirement } from "../data/basicRequirements";
import type { RequiredCourse } from "../data/types";

export interface RemainingBasicRequirement extends BasicRequirement {
  sectionTitle: string;
}

interface RemainingListProps {
  basicRequirements: RemainingBasicRequirement[];
  generalElectiveRemaining: number;
  businessCourses: RequiredCourse[];
  statisticsCourses: RequiredCourse[];
  showBusiness: boolean;
  showStatistics: boolean;
}

const sectionOrder = ["교기", "기초교육", "필수교양", "대학교양", "RC 필수"];

function BasicRequirementGroups({ requirements }: { requirements: RemainingBasicRequirement[] }) {
  const grouped = requirements.reduce<Record<string, RemainingBasicRequirement[]>>((acc, requirement) => {
    (acc[requirement.sectionTitle] ??= []).push(requirement);
    return acc;
  }, {});

  const titles = Object.keys(grouped).sort((a, b) => {
    const aIndex = sectionOrder.indexOf(a);
    const bIndex = sectionOrder.indexOf(b);
    return (aIndex === -1 ? 99 : aIndex) - (bIndex === -1 ? 99 : bIndex);
  });

  if (requirements.length === 0) {
    return (
      <div className="remaining-group">
        <div className="remaining-group-title">
          <h3>기본 졸업요건</h3>
          <span>0</span>
        </div>
        <p className="remaining-complete">✓ 교기·기초교육·대학교양·RC 요건 충족</p>
      </div>
    );
  }

  return (
    <>
      {titles.map((title) => (
        <div className="remaining-group" key={title}>
          <div className="remaining-group-title">
            <h3>{title}</h3>
            <span>{grouped[title].length}</span>
          </div>
          <ul className="remaining-course-list">
            {grouped[title].map((requirement) => (
              <li key={`${requirement.sectionTitle}-${requirement.id}`}>
                <span>{requirement.title}</span>
                <small>{requirement.credits ? `${requirement.credits}학점` : "필수"}</small>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </>
  );
}

function CourseGroup({ title, courses }: { title: string; courses: RequiredCourse[] }) {
  return (
    <div className="remaining-group">
      <div className="remaining-group-title">
        <h3>{title}</h3>
        <span>{courses.length}</span>
      </div>
      {courses.length === 0 ? (
        <p className="remaining-complete">✓ 모든 필수과목 이수 완료</p>
      ) : (
        <ul className="remaining-course-list">
          {courses.map((course) => (
            <li key={course.id}>
              <span>{course.name}</span>
              <small>{course.credit}학점</small>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function RemainingList({ basicRequirements, generalElectiveRemaining, businessCourses, statisticsCourses, showBusiness, showStatistics }: RemainingListProps) {
  const totalRemaining = basicRequirements.length + (generalElectiveRemaining > 0 ? 1 : 0) + (showBusiness ? businessCourses.length : 0) + (showStatistics ? statisticsCourses.length : 0);

  return (
    <div>
      <div className="sidebar-title remaining-heading">
        <div>
          <span className="section-kicker">REMAINING</span>
          <h2>남은 필수요건</h2>
        </div>
        <span className="remaining-total">{totalRemaining}</span>
      </div>
      <div className="remaining-list-wrap">
        <BasicRequirementGroups requirements={basicRequirements} />
        <div className="remaining-group">
          <div className="remaining-group-title">
            <h3>일반선택</h3>
            <span>{generalElectiveRemaining > 0 ? 1 : 0}</span>
          </div>
          {generalElectiveRemaining > 0 ? (
            <ul className="remaining-course-list">
              <li><span>일반선택 학점</span><small>{generalElectiveRemaining}학점 남음</small></li>
            </ul>
          ) : (
            <p className="remaining-complete">✓ 일반선택 학점 충족</p>
          )}
        </div>
        {showBusiness && (
          <CourseGroup title="경영학과" courses={businessCourses} />
        )}
        {showStatistics && (
          <CourseGroup title="응용통계학과" courses={statisticsCourses} />
        )}
      </div>
    </div>
  );
}

export default RemainingList;
