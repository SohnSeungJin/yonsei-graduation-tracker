interface HeaderProps {
  onReset: () => void;
}

function Header({ onReset }: HeaderProps) {
  return (
    <header className="app-header">
      <div className="header-inner">
        <a className="brand" href="#top" aria-label="Yonsei Graduation Tracker 홈">
          <span className="brand-mark">Y</span>
          <span>
            <strong>Yonsei Graduation Tracker</strong>
            <small>Business × Applied Statistics</small>
          </span>
        </a>

        <button className="reset-button" type="button" onClick={onReset}>
          <span aria-hidden="true">↻</span>
          입력 초기화
        </button>
      </div>
    </header>
  );
}

export default Header;
