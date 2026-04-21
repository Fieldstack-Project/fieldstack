import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import "../styles/home.css";

import { Button, EmptyState } from "@fieldstack/controls";

import { apiFetch } from "../lib/apiFetch";

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
  displayName: string;
  description: string;
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
  const { t } = useTranslation();
  const [installedModules, setInstalledModules] = useState<InstalledModule[]>([]);

  useEffect(() => {
    apiFetch("/core/modules/me")
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
        <div className="home-welcome-banner" role="region" aria-label={t('home.welcomeTitle')}>
          <div className="home-welcome-body">
            <p className="home-welcome-title">{t('home.welcomeTitle')}</p>
            <p className="home-welcome-desc">{t('home.welcomeDesc')}</p>
          </div>
          <button
            type="button"
            className="home-welcome-dismiss"
            onClick={onDismissFirstVisit}
            aria-label={t('home.dismissWelcome')}
          >
            ✕
          </button>
        </div>
      )}

      {/* ── 페이지 헤더 ───────────────────────────────────────── */}
      <div className="home-header">
        <div>
          <p className="home-kicker">{t('home.kicker')}</p>
          <h1 className="home-title" id="home-title">{t('home.title')}</h1>
        </div>
        <div className="home-header-actions">
          <Button type="button" onClick={onOpenSettings}>
            {t('home.settingsButton')}
          </Button>
          <Button variant="primary" type="button" onClick={() => { window.location.hash = "marketplace"; }}>
            {t('home.marketplaceButton')}
          </Button>
        </div>
      </div>

      {/* ── 2컬럼 본문 ────────────────────────────────────────── */}
      <div className="home-body">

        {/* ── 왼쪽: 모듈 / 온보딩 ─────────────────────────────── */}
        <div className="home-main">
          <section className="home-card" aria-labelledby="home-modules-title">
            <div className="home-card-header">
              <h2 className="home-card-title" id="home-modules-title">{t('home.installedModules')}</h2>
              <span className="home-card-meta">
                {hasModules
                  ? t('home.modulesActive_one', { count: installedModules.length })
                  : t('home.noModulesInstalled')}
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
                    <p className="module-card-name">{t(mod.displayName, { defaultValue: mod.name })}</p>
                    <p className="module-card-desc">{t(mod.description, { defaultValue: mod.description })}</p>
                  </button>
                ))}
              </div>
            ) : (
              <EmptyState
                icon="⬡"
                title={t('home.noModulesTitle')}
                description={t('home.noModulesDesc')}
                action={{ label: t('home.browseMarketplace'), onClick: () => { window.location.hash = "marketplace"; } }}
              />
            )}
          </section>

          {/* 온보딩 가이드 (모듈 없을 때) */}
          {!hasModules && (
            <section className="home-card home-onboarding" aria-label={t('home.gettingStarted')}>
              <p className="home-onboarding-label">{t('home.gettingStarted')}</p>
              <ol className="home-onboarding-steps">
                <li className="home-onboarding-step">
                  <span className="home-onboarding-step-num">01</span>
                  <div>
                    <p className="home-onboarding-step-title">{t('home.step1Title')}</p>
                    <p className="home-onboarding-step-desc">{t('home.step1Desc')}</p>
                  </div>
                </li>
                <li className="home-onboarding-step">
                  <span className="home-onboarding-step-num">02</span>
                  <div>
                    <p className="home-onboarding-step-title">{t('home.step2Title')}</p>
                    <p className="home-onboarding-step-desc">{t('home.step2Desc')}</p>
                  </div>
                </li>
                <li className="home-onboarding-step">
                  <span className="home-onboarding-step-num">03</span>
                  <div>
                    <p className="home-onboarding-step-title">{t('home.step3Title')}</p>
                    <p className="home-onboarding-step-desc">{t('home.step3Desc')}</p>
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
              <h2 className="home-card-title" id="home-status-title">{t('home.systemStatus')}</h2>
            </div>
            <div className="home-status-list">
              <div className="home-status-row">
                <span className="home-status-label">{t('home.systemStatusModules')}</span>
                <span className="home-status-value">{installedModules.length}</span>
              </div>
              <div className="home-status-row">
                <span className="home-status-label">{t('home.systemStatusAlerts')}</span>
                <span className="home-status-value">3</span>
              </div>
              <div className="home-status-row">
                <span className="home-status-label">{t('home.systemStatusHealth')}</span>
                <span className="home-status-value home-status-ok">{t('home.systemStatusHealthGood')}</span>
              </div>
            </div>
          </section>

          {/* Admin 빠른 링크 */}
          {isAdmin && (
            <section className="home-card home-card-accent" aria-labelledby="home-admin-title">
              <div className="home-card-header">
                <h2 className="home-card-title" id="home-admin-title">
                  <span aria-hidden="true">⚡ </span>{t('home.adminTitle')}
                </h2>
                <Button size="sm" type="button" onClick={onNavigateAdmin}>
                  {t('home.adminConsole')}
                </Button>
              </div>
              <div className="home-admin-stats">
                <div className="home-admin-stat">
                  <p className="home-admin-stat-label">{t('home.adminActiveUsers')}</p>
                  <p className="home-admin-stat-value">1</p>
                </div>
                <div className="home-admin-stat">
                  <p className="home-admin-stat-label">{t('home.adminInstalledModules')}</p>
                  <p className="home-admin-stat-value">{installedModules.length}</p>
                </div>
                <div className="home-admin-stat">
                  <p className="home-admin-stat-label">{t('home.adminSystem')}</p>
                  <p className="home-admin-stat-value home-status-ok">{t('home.adminSystemOk')}</p>
                </div>
              </div>
            </section>
          )}

          {/* Quick Actions */}
          <section className="home-card" aria-labelledby="home-actions-title">
            <div className="home-card-header">
              <h2 className="home-card-title" id="home-actions-title">{t('home.quickActions')}</h2>
            </div>
            <div className="home-quick-actions">
              <button
                type="button"
                className="home-action-item"
                onClick={() => { window.location.hash = "marketplace"; }}
              >
                <span className="home-action-icon" aria-hidden="true">⬡</span>
                <span>{t('home.addModule')}</span>
              </button>
              <button
                type="button"
                className="home-action-item"
                onClick={onOpenSettings}
              >
                <span className="home-action-icon" aria-hidden="true">⚙</span>
                <span>{t('home.openSettings')}</span>
              </button>
              <button
                type="button"
                className="home-action-item"
              >
                <span className="home-action-icon" aria-hidden="true">📋</span>
                <span>{t('home.viewLogs')}</span>
              </button>
            </div>
          </section>

          {/* Recent Activity */}
          <section className="home-card" aria-labelledby="home-activity-title">
            <div className="home-card-header">
              <h2 className="home-card-title" id="home-activity-title">{t('home.recentActivity')}</h2>
            </div>
            <ul className="home-activity-list" aria-label={t('home.recentActivity')}>
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
