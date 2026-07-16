interface ProgressProps {
  totalCredits: number;
  upperLevelCredits: number;
  generalElectiveCredits: number;
  generalElectiveRequirement: number;
  businessCredits: number;
  statisticsCredits: number;
}

interface ProgressItemProps {
  label: string;
  current: number;
  total: number;
}

function getProgressLevel(percentage: number, isComplete: boolean) {
  if (isComplete) return "progress-complete";
  if (percentage >= 80) return "progress-high";
  if (percentage >= 50) return "progress-medium";
  return "progress-low";
}

function ProgressItem({ label, current, total }: ProgressItemProps) {
  const safeCurrent = Math.max(0, current);
  const percentage = total > 0 ? Math.min((safeCurrent / total) * 100, 100) : 0;
  const isComplete = safeCurrent >= total;
  const level = getProgressLevel(percentage, isComplete);

  return (
    <div className={`progress-item ${level}`}>
      <div className="progress-label-row">
        <span className="progress-name">{label}</span>
        <strong>{safeCurrent}<small> / {total}</small></strong>
      </div>
      <div className="progress-track" role="progressbar" aria-label={`${label} 이수 진행률`} aria-valuemin={0} aria-valuemax={total} aria-valuenow={Math.min(safeCurrent, total)}>
        <div className="progress-fill" style={{ width: `${percentage}%` }} />
      </div>
      <span className="progress-caption">{Math.round(percentage)}% 완료</span>
    </div>
  );
}

function Progress(props: ProgressProps) {
  return (
    <div>
      <div className="sidebar-title">
        <span className="section-kicker">PROGRESS</span>
        <h2>이수 진행률</h2>
      </div>
      <div className="progress-list">
        <ProgressItem label="총 이수학점" current={props.totalCredits} total={126} />
        <ProgressItem label="3·4000단위" current={props.upperLevelCredits} total={45} />
        <ProgressItem label="일반선택" current={props.generalElectiveCredits} total={props.generalElectiveRequirement} />
        <ProgressItem label="경영학" current={props.businessCredits} total={48} />
        <ProgressItem label="응용통계학" current={props.statisticsCredits} total={36} />
      </div>
      <div className="progress-legend" aria-label="진행률 색상 안내">
        <span><i className="legend-low" />0~49%</span>
        <span><i className="legend-medium" />50~79%</span>
        <span><i className="legend-high" />80~99%</span>
        <span><i className="legend-complete" />100%</span>
      </div>
    </div>
  );
}

export default Progress;
