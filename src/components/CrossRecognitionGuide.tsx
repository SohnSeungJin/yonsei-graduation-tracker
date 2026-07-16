const crossRecognitionCourses = [
  { code: "BIZ1101", name: "회계원리(1)", credits: 3 },
  { code: "BIZ3108", name: "회계원리(2)", credits: 3 },
];

function CrossRecognitionGuide() {
  return (
    <section className="panel cross-guide" aria-labelledby="cross-guide-title">
      <div className="section-heading cross-guide-heading">
        <div>
          <span className="section-kicker">CROSS RECOGNITION</span>
          <h2 id="cross-guide-title">교차인정 과목 안내</h2>
          <p>현재 트래커에서는 아래 두 과목만 경영학과·응용통계학과 교차인정으로 계산합니다.</p>
        </div>
        <span className="cross-guide-limit">최대 6학점</span>
      </div>

      <div className="cross-course-grid">
        {crossRecognitionCourses.map((course) => (
          <article className="cross-course-card" key={course.code}>
            <span className="cross-check">✓</span>
            <div>
              <strong>{course.name}</strong>
              <small>{course.code} · {course.credits}학점</small>
            </div>
            <span className="cross-badge">교차인정</span>
          </article>
        ))}
      </div>

      <p className="cross-guide-note">
        두 과목은 응용통계 전공학점에도 반영되지만, 총 취득학점에서는 같은 과목을 중복 합산하지 않습니다.
      </p>
    </section>
  );
}

export default CrossRecognitionGuide;
