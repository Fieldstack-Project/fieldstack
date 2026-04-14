import "../styles/home.css";

import { Button, EmptyState } from "@fieldstack/controls";

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
  isAdmin: boolean;
  onOpenSettings: () => void;
  onNavigateAdmin: () => void;
}

export function HomeView({ isAdmin, onOpenSettings, onNavigateAdmin }: HomeViewProps) {
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
          <Button className="home-button-secondary" type="button" onClick={onOpenSettings}>
            General Settings
          </Button>
          <Button variant="primary" type="button">
            Open Marketplace
          </Button>
        </div>
      </div>

      {isAdmin && (
        <section className="home-section home-admin-banner" aria-labelledby="home-admin-title">
          <div className="home-section-head">
            <h2 className="home-section-title" id="home-admin-title">
              <span className="home-admin-badge" aria-hidden="true">⚡</span>
              Admin Overview
            </h2>
            <Button size="sm" type="button" onClick={onNavigateAdmin}>
              Admin 패널 →
            </Button>
          </div>
          <div className="home-admin-grid">
            <div className="home-admin-card">
              <p className="home-admin-card-label">활성 사용자</p>
              <p className="home-admin-card-value">1</p>
            </div>
            <div className="home-admin-card">
              <p className="home-admin-card-label">설치된 모듈</p>
              <p className="home-admin-card-value">{MOCK_INSTALLED_MODULES.length}</p>
            </div>
            <div className="home-admin-card">
              <p className="home-admin-card-label">시스템 상태</p>
              <p className="home-admin-card-value home-admin-card-ok">정상</p>
            </div>
          </div>
        </section>
      )}

      {hasModules ? (
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
      ) : (
        <div className="home-onboarding">
          <p className="home-onboarding-label">Getting Started — 3 steps</p>
          <ol className="home-onboarding-steps">
            <li className="home-onboarding-step">
              <span className="home-onboarding-step-num">01</span>
              <div>
                <p className="home-onboarding-step-title">마켓플레이스에서 모듈 탐색</p>
                <p className="home-onboarding-step-desc">
                  Ledger(가계부), Subscription(구독 관리) 등 원하는 모듈을 찾습니다.
                </p>
              </div>
            </li>
            <li className="home-onboarding-step">
              <span className="home-onboarding-step-num">02</span>
              <div>
                <p className="home-onboarding-step-title">원클릭 설치 & 활성화</p>
                <p className="home-onboarding-step-desc">
                  설치 즉시 사이드바에 추가됩니다. 서버 재시작 불필요.
                </p>
              </div>
            </li>
            <li className="home-onboarding-step">
              <span className="home-onboarding-step-num">03</span>
              <div>
                <p className="home-onboarding-step-title">바로 사용 시작</p>
                <p className="home-onboarding-step-desc">
                  모듈 화면으로 이동해 데이터를 입력하거나 연동을 설정합니다.
                </p>
              </div>
            </li>
          </ol>
        </div>
      )}

      <div className="stack">
        <section className="home-section">
          <div className="home-section-head">
            <h2 className="home-section-title">Installed Modules</h2>
            <span className="home-section-meta">
              {hasModules ? "Ready to launch" : "No modules installed"}
            </span>
          </div>

          {hasModules ? (
            <div className="home-modules-grid">
              {MOCK_INSTALLED_MODULES.map((mod) => (
                <button
                  key={mod.id}
                  className="module-card"
                  type="button"
                  onClick={() => { window.location.hash = mod.path; }}
                >
                  <p className="module-card-icon">{MODULE_ICONS[mod.id] ?? "🧩"}</p>
                  <p className="module-card-name">{mod.label}</p>
                  <p className="module-card-desc">Open module workspace</p>
                </button>
              ))}
            </div>
          ) : (
            <EmptyState
              icon="⬡"
              title="No modules installed yet"
              description="첫 모듈을 설치하면 메인 허브에 즉시 표시됩니다."
              action={{ label: "Browse Marketplace", onClick: () => { window.location.hash = '#marketplace'; } }}
            />
          )}
        </section>

        <section className="home-section">
          <div className="home-section-head">
            <h2 className="home-section-title">Quick Actions</h2>
          </div>
          <div className="home-quick-actions">
            <Button className="home-pill" type="button">Add module</Button>
            <Button className="home-pill" type="button" onClick={onOpenSettings}>Open settings</Button>
            <Button className="home-pill" type="button">View logs</Button>
          </div>
        </section>

        <section className="home-section">
          <div className="home-section-head">
            <h2 className="home-section-title">Recent Activity</h2>
          </div>
          <ul className="home-activity-list" aria-label="최근 활동 목록">
            {MOCK_RECENT_ACTIVITY.map((item) => (
              <li key={item.id} className="home-activity-item">
                <span className={`home-activity-dot home-activity-dot-${item.dot}`} aria-hidden="true" />
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
