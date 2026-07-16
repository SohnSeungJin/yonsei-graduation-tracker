const guideItems = [
  {
    title: "참고용 서비스입니다",
    description:
      "이 트래커는 경영학 본전공·응용통계학 캠퍼스내 복수전공 학생의 졸업요건 확인을 돕는 비공식 도구입니다. 최종 졸업 가능 여부는 연세포탈 졸업사정과 소속 학과 안내를 기준으로 확인해 주세요.",
  },
  {
    title: "입학 학번을 정확히 선택해 주세요",
    description:
      "학번에 따라 영어, 사회참여, 대학교양 필수 영역과 일반선택 최소학점 등이 달라집니다.",
  },
  {
    title: "과목 정보는 직접 입력해야 합니다",
    description:
      "연세포탈과 자동 연동되지 않습니다. 필수과목 목록에 없는 과목은 과목명, 이수구분, 학점과 3·4000단위 여부를 직접 입력해 주세요.",
  },
  {
    title: "3·4000단위 여부를 확인해 주세요",
    description:
      "학정번호의 과목 단위가 3000 또는 4000인 과목은 각 입력 행에서 3·4000단위를 체크해야 45학점 요건에 포함됩니다.",
  },
  {
    title: "체크박스는 실제 이수 내역대로 선택해 주세요",
    description:
      "채플, 기초교육, 대학교양과 RC 활동을 체크하면 해당 학점과 졸업요건에 즉시 반영됩니다.",
  },
  {
    title: "입력 내용은 현재 브라우저에 저장됩니다",
    description:
      "새로고침 후에도 유지되지만 다른 브라우저, 다른 기기 또는 시크릿 모드와는 공유되지 않습니다. 공용 기기에서는 사용 후 초기화해 주세요.",
  },
];

function UserGuide() {
  return (
    <section className="panel guide-panel" aria-labelledby="guide-title">
      <div className="section-heading guide-heading">
        <div>
          <span className="section-kicker">BEFORE YOU START</span>
          <h2 id="guide-title">이용 전 유의사항</h2>
          <p>정확한 계산을 위해 아래 내용을 먼저 확인해 주세요.</p>
        </div>
        <span className="guide-badge">Version 3.1</span>
      </div>

      <div className="guide-grid">
        {guideItems.map((item, index) => (
          <article className="guide-item" key={item.title}>
            <span className="guide-number">{index + 1}</span>
            <div>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export default UserGuide;
