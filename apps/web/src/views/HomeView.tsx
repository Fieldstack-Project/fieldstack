import { useState, useEffect } from "react";
import "../styles/home.css";

import { Button, EmptyState } from "@fieldstack/controls";

const MODULE_ICONS: Record<string, string> = {
  ledger: "💰",
  subscription: "📅",
  todo: "✅",
  project: "📊",
};

const MOCK_RECENT_ACTIVITY = [
  { id: 1, text: "로그인 세션이 갱신됨",       time: "방금 전",  dot: "info" as const },
  { id: 2, text: "모듈 로더 스캔 완료",         time: "2분 전",  dot: "ok"   as const },
  { id: 3, text: "관리자 권한 상태 확인",        time: "7분 전",  dot: "warn" as const },
];

interface InstalledModule {
  name: string;
  basePath: string;
  enabled: boolean;
}

interface HomeViewProps {
  isAdmin: boolean;
  isFirstVisit: boolean;
  onDismissFirstVisit: () => void;
  onOpenSettings: () => void;
  onNavigateAdmin: () => void;
}

export function HomeView({
  isAdmin,
  isFirstVisit,
  onDismissFirstVisit,
  onOpenSettings,
  onNavigateAdmin,
}: HomeViewProps) {
  const [installedModules, setInstalledModules] = useState<InstalledModule[]>([]);

  useEffect(() => {
    const token = sessionStorage.getItem("fs_token") ?? "";
    if (!token) return;

    fetch("/core/modules/me", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((json: { success: boolean; data?: { modules: InstalledModule[] } }) => {
        if (json.success) {
          setInstalledModules((json.data?.modules ?? []).filter((m) => m.enabled));
        }
      })
      .catch(() => { /* 모듈 로드 실패는 무음 처리 */ });
  }, []);

  const hasModules = installedModules.length > 0;

  return (
    <div className="home-page">
      {/* ── 환영 배너 ─────────────────────────────────────────── */}
      {isFirstVisit && (
        <div className="home-welcome-banner" role="region" aria-label="환영 메시지">
          <div className="home-welcome-body">
            <p className="home-welcome-title">Fieldstack에 오신 것을 환영합니다!</p>
            <p className="home-welcome-desc">
              마켓플레이스에서 첫 번째 모듈을 설치하고 워크스페이스를 구성해 보세요.
              Settings에서 테마·언어 등 기본 환경도 설정할 수 있습니다.
            </p>
          </div>
          <button
            type="button"
            className="home-welcome-dismiss"
            onClick={onDismissFirstVisit}
            aria-label="환영 메시지 닫기"
          >
            ✕
          </button>
        </div>
      )}

      {/* ── 페이지 헤더 ───────────────────────────────────────── */}
      <div className="home-header">
        <div>
          <p className="home-kicker">Workspace Overview</p>
          <h1 className="home-title" id="home-title">Main Hub</h1>
        </div>
        <div className="home-header-actions">
          <Button type="button" onClick={onOpenSettings}>
            Settings
          </Button>
          <Button variant="primary" type="button" onClick={() => { window.location.hash = "marketplace"; }}>
            Marketplace
          </Button>
        </div>
      </div>

      {/* ── 2컬럼 본문 ────────────────────────────────────────── */}
      <div className="home-body">

        {/* ── 왼쪽: 모듈 / 온보딩 ─────────────────────────────── */}
        <div className="home-main">
          <section className="home-card" aria-labelledby="home-modules-title">
            <div className="home-card-header">
              <h2 className="home-card-title" id="home-modules-title">Installed Modules</h2>
              <span className="home-card-meta">
                {hasModules ? `${installedModules.length}개 활성` : "설치된 모듈 없음"}
              </span>
            </div>

            {hasModules ? (
              <div className="home-modules-grid">
                {installedModules.map((mod) => (
                  <button
                    key={mod.name}
                    className="module-card"
                    type="button"
                    onClick={() => { window.location.hash = mod.name; }}
                  >
                    <p className="module-card-icon">{MODULE_ICONS[mod.name] ?? "🧩"}</p>
                    <p className="module-card-name">{mod.name}</p>
                    <p className="module-card-desc">Open module workspace</p>
                  </button>
                ))}
              </div>
            ) : (
              <EmptyState
                icon="⬡"
                title="No modules installed yet"
                description="첫 모듈을 설치하면 메인 허브에 즉시 표시됩니다."
                action={{ label: "Browse Marketplace", onClick: () => { window.location.hash = "marketplace"; } }}
              />
            )}
          </section>

          {/* 온보딩 가이드 (모듈 없을 때) */}
          {!hasModules && (
            <section className="home-card home-onboarding" aria-label="시작 가이드">
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
            </section>
          )}
        </div>

        {/* ── 오른쪽 사이드바 ──────────────────────────────────── */}
        <aside className="home-sidebar" aria-label="시스템 정보">

          {/* 시스템 상태 */}
          <section className="home-card" aria-labelledby="home-status-title">
            <div className="home-card-header">
              <h2 className="home-card-title" id="home-status-title">System Status</h2>
            </div>
            <div className="home-status-list">
              <div className="home-status-row">
                <span className="home-status-label">모듈</span>
                <span className="home-status-value">{installedModules.length}</span>
              </div>
              <div className="home-status-row">
                <span className="home-status-label">Pending Alerts</span>
                <span className="home-status-value">3</span>
              </div>
              <div className="home-status-row">
                <span className="home-status-label">Health</span>
                <span className="home-status-value home-status-ok">Good</span>
              </div>
            </div>
          </section>

          {/* Admin 빠른 링크 */}
          {isAdmin && (
            <section className="home-card home-card-accent" aria-labelledby="home-admin-title">
              <div className="home-card-header">
                <h2 className="home-card-title" id="home-admin-title">
                  <span aria-hidden="true">⚡ </span>Admin
                </h2>
                <Button size="sm" type="button" onClick={onNavigateAdmin}>
                  콘솔 →
                </Button>
              </div>
              <div className="home-admin-stats">
                <div className="home-admin-stat">
                  <p className="home-admin-stat-label">활성 사용자</p>
                  <p className="home-admin-stat-value">1</p>
                </div>
                <div className="home-admin-stat">
                  <p className="home-admin-stat-label">설치 모듈</p>
                  <p className="home-admin-stat-value">{installedModules.length}</p>
                </div>
                <div className="home-admin-stat">
                  <p className="home-admin-stat-label">시스템</p>
                  <p className="home-admin-stat-value home-status-ok">정상</p>
                </div>
              </div>
            </section>
          )}

          {/* Quick Actions */}
          <section className="home-card" aria-labelledby="home-actions-title">
            <div className="home-card-header">
              <h2 className="home-card-title" id="home-actions-title">Quick Actions</h2>
            </div>
            <div className="home-quick-actions">
              <button
                type="button"
                className="home-action-item"
                onClick={() => { window.location.hash = "marketplace"; }}
              >
                <span className="home-action-icon" aria-hidden="true">⬡</span>
                <span>Add module</span>
              </button>
              <button
                type="button"
                className="home-action-item"
                onClick={onOpenSettings}
              >
                <span className="home-action-icon" aria-hidden="true">⚙</span>
                <span>Open settings</span>
              </button>
              <button
                type="button"
                className="home-action-item"
              >
                <span className="home-action-icon" aria-hidden="true">📋</span>
                <span>View logs</span>
              </button>
            </div>
          </section>

          {/* Recent Activity */}
          <section className="home-card" aria-labelledby="home-activity-title">
            <div className="home-card-header">
              <h2 className="home-card-title" id="home-activity-title">Recent Activity</h2>
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

        </aside>
      </div>
    </div>
  );
}
