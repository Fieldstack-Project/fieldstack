import "../styles/home.css";

import type { NavigationItem } from "../loader";

const MOCK_INSTALLED_MODULES: NavigationItem[] = [];

const MODULE_ICONS: Record<string, string> = {
  ledger: "💰",
  subscription: "📅",
  todo: "✅",
  project: "📊",
};

const MOCK_RECENT_ACTIVITY = [
  { id: 1, text: "로그인 세션이 갱신됨", time: "방금 전", dot: "info" as const },
  { id: 2, text: "모듈 로더 스캔 완료", time: "2분 전", dot: "ok" as const },
  { id: 3, text: "관리자 권한 상태 확인", time: "7분 전", dot: "warn" as const },
];

interface HomeViewProps {
  onOpenSettings: () => void;
}

export function HomeView({ onOpenSettings }: HomeViewProps) {
  const hasModules = MOCK_INSTALLED_MODULES.length > 0;

  return (
    <section className="panel home-root" aria-labelledby="home-title">
      <div className="home-hero">
        <div>
          <p className="home-kicker">Workspace Overview</p>
          <h1 className="home-title" id="home-title">
            Main Hub
          </h1>
          <p className="home-subtitle">모듈 실행, 설정 변경, 관리 진입을 한 화면에서 제어</p>
        </div>

        <div className="home-hero-actions">
          <button className="button home-button-secondary" type="button" onClick={onOpenSettings}>
            General Settings
          </button>
          <button className="button button-primary" type="button">
            Open Marketplace
          </button>
        </div>
      </div>

      <div className="home-stat-grid">
        <article className="home-stat-card">
          <p className="home-stat-label">Installed Modules</p>
          <p className="home-stat-value">{MOCK_INSTALLED_MODULES.length}</p>
        </article>
        <article className="home-stat-card">
          <p className="home-stat-label">Pending Alerts</p>
          <p className="home-stat-value">3</p>
        </article>
        <article className="home-stat-card">
          <p className="home-stat-label">System Health</p>
          <p className="home-stat-value">Good</p>
        </article>
      </div>

      <div className="stack">
        <section className="home-section">
          <div className="home-section-head">
            <h2 className="home-section-title">Installed Modules</h2>
            <span className="home-section-meta">Ready to launch</span>
          </div>

        {hasModules ? (
          <div className="home-modules-grid">
            {MOCK_INSTALLED_MODULES.map((mod) => (
              <button
                key={mod.id}
                className="module-card"
                type="button"
                onClick={() => {
                  window.location.hash = mod.path;
                }}
              >
                <p className="module-card-icon">{MODULE_ICONS[mod.id] ?? "🧩"}</p>
                <p className="module-card-name">{mod.label}</p>
                <p className="module-card-desc">Open module workspace</p>
              </button>
            ))}
          </div>
        ) : (
          <div className="home-empty">
            <div className="home-empty-icon">⬡</div>
            <h2 className="home-empty-title">No modules installed yet</h2>
            <p className="home-empty-desc">
              첫 모듈을 설치하면 메인 허브에 즉시 표시됩니다.
            </p>
            <button className="button button-primary" type="button">
              Browse Marketplace
            </button>
          </div>
        )}
        </section>

        <section className="home-section">
          <div className="home-section-head">
            <h2 className="home-section-title">Quick Actions</h2>
          </div>
          <div className="home-quick-actions">
            <button className="button home-pill" type="button">
              Add module
            </button>
            <button className="button home-pill" type="button" onClick={onOpenSettings}>
              Open settings
            </button>
            <button className="button home-pill" type="button">
              View logs
            </button>
          </div>
        </section>

        <section className="home-section">
          <div className="home-section-head">
            <h2 className="home-section-title">Recent Activity</h2>
          </div>
          <ul className="home-activity-list" aria-label="최근 활동 목록">
            {MOCK_RECENT_ACTIVITY.map((item) => (
              <li key={item.id} className="home-activity-item">
                <span
                  className={`home-activity-dot home-activity-dot-${item.dot}`}
                  aria-hidden="true"
                />
                <span>
                  {item.text}
                  <br />
                  <span className="home-activity-time">{item.time}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </section>
  );
}
