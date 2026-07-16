import type { YearRequirementProfile } from "../data/basicRequirements";

interface BasicRequirementsProps {
  profile: YearRequirementProfile;
  completedRequirementIds: string[];
  onToggle: (id: string) => void;
}

function BasicRequirements({
  profile,
  completedRequirementIds,
  onToggle,
}: BasicRequirementsProps) {
  const allRequirements = profile.sections.flatMap((section) => section.requirements);
  const completedCount = allRequirements.filter((item) =>
    completedRequirementIds.includes(item.id)
  ).length;

  return (
    <div>
      <div className="required-list-header basic-requirements-header">
        <div>
          <span className="section-kicker">STEP 2</span>
          <h2>{profile.label} 기본 졸업요건</h2>
          <p>교기, 기초교육, {profile.liberalArtsName}, RC 필수 요건을 확인해 주세요.</p>
        </div>
        <span className="course-count">
          {completedCount} / {allRequirements.length} 선택
        </span>
      </div>

      <div className="requirement-source-note">{profile.sourceNote}</div>

      <div className="basic-requirements-wrap">
        {profile.sections.map((section) => {
          const sectionCompleted = section.requirements.filter((item) =>
            completedRequirementIds.includes(item.id)
          ).length;
          const target = section.minimumCompleted ?? section.requirements.length;

          return (
            <div className="basic-requirement-group" key={section.id}>
              <div className="basic-requirement-group-heading">
                <div>
                  <h3>{section.title}</h3>
                  <p>{section.description}</p>
                </div>
                <span>{sectionCompleted} / {target}{section.minimumCompleted ? " 영역" : " 완료"}</span>
              </div>

              <div className="basic-requirement-grid">
                {section.requirements.map((requirement) => {
                  const isCompleted = completedRequirementIds.includes(requirement.id);

                  return (
                    <label
                      className={`basic-requirement-card ${isCompleted ? "is-complete" : ""}`}
                      key={requirement.id}
                    >
                      <input
                        type="checkbox"
                        checked={isCompleted}
                        onChange={() => onToggle(requirement.id)}
                      />
                      <span className="basic-checkmark" aria-hidden="true">
                        {isCompleted ? "✓" : ""}
                      </span>
                      <span className="basic-requirement-copy">
                        <strong>
                          {requirement.title}
                          {requirement.mandatory && <em>필수</em>}
                        </strong>
                        <small>{requirement.description}</small>
                      </span>
                      <span className="basic-status">
                        {requirement.credits ? `${requirement.credits}학점` : "학점 미반영"}
                        <small>{isCompleted ? "이수 완료" : "확인 필요"}</small>
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default BasicRequirements;
