import { type ReactNode, useState, useEffect } from "react";
import { useTranslation } from 'react-i18next';
import "../styles/shell.css";

import { apiFetch } from "../lib/apiFetch";
import type { ModuleSubRoute } from "../moduleRegistry";

// 코어 라우트 + 설치된 모듈 이름도 RouteKey에 포함 (가계부: "ledger" 등)
export type CoreRouteKey = "login" | "forgot-password" | "home" | "marketplace" | "admin" | "change-password";
export type RouteKey = CoreRouteKey | string;

interface AppShellProps {
  route: RouteKey;
  /** 현재 모듈 내 서브 라우트 ("" = 기본, "import" 등) */
  subRoute?: string;
  /** 모듈명 → 서브 라우트 목록 매핑 */
  moduleSubNav?: Record<string, ModuleSubRoute[]>;
  isAdmin: boolean;
  currentUser: { email: string } | null;
  notice: string;
  onNavigate: (route: RouteKey) => void;
  onLogout: () => void;
  onOpenSettings: () => void;
  children: ReactNode;
}

interface SidebarModule {
  name: string;
  displayName: string;
  basePath: string;
  enabled: boolean;
  icon?: string;
}

// nav list 내 ArrowUp/ArrowDown 키보드 탐색
function handleNavKeyDown(e: React.KeyboardEvent<HTMLUListElement>) {
  if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
  const items = Array.from(
    e.currentTarget.querySelectorAll<HTMLButtonElement>('button.shell-nav-item'),
  );
  const idx = items.indexOf(document.activeElement as HTMLButtonElement);
  if (idx === -1) return;
  e.preventDefault();
  const next = e.key === 'ArrowDown'
    ? items[(idx + 1) % items.length]
    : items[(idx - 1 + items.length) % items.length];
  next?.focus();
}

export function AppShell({
  route,
  subRoute = "",
  moduleSubNav = {},
  isAdmin,
  currentUser,
  notice,
  onNavigate,
  onLogout,
  onOpenSettings,
  children,
}: AppShellProps) {
  const { t } = useTranslation();
  const userInitial = currentUser?.email.charAt(0).toUpperCase() ?? "?";
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [sidebarModules, setSidebarModules] = useState<SidebarModule[]>([]);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    try { return localStorage.getItem("fs_sidebar_collapsed") === "true"; } catch { return false; }
  });

  const toggleCollapsed = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try { localStorage.setItem("fs_sidebar_collapsed", String(next)); } catch { /* ignore */ }
      return next;
    });
  };

  // 로그인 후(currentUser 존재) GET /core/modules/me 로 사용자 모듈 목록 조회
  useEffect(() => {
    if (!currentUser) {
      setSidebarModules([]);
      return;
    }

    apiFetch("/core/modules/me")
      .then((r) => r.json())
      .then((json: { success: boolean; data?: { modules: SidebarModule[] } }) => {
        if (json.success) {
          // 활성화(enabled: true)된 모듈만 사이드바에 표시
          setSidebarModules((json.data?.modules ?? []).filter((m) => m.enabled));
        }
      })
      .catch(() => { /* 사이드바 모듈 로드 실패는 무음 처리 */ });
  }, [currentUser]);

  const closeMobileMenu = () => setIsMobileOpen(false);
  const navAndClose = (target: RouteKey) => { onNavigate(target); closeMobileMenu(); };

  return (
    <div className="shell" data-sidebar-collapsed={isCollapsed ? "" : undefined}>
      {/* ── 모바일 오버레이 ──────────────────────────────── */}
      {isMobileOpen && (
        <div
          className="shell-drawer-overlay"
          onClick={closeMobileMenu}
          aria-hidden="true"
        />
      )}

      {/* ── Sidebar ─────────────────────────────────────── */}
      <aside
        className="shell-sidebar"
        data-mobile-open={isMobileOpen ? "" : undefined}
        aria-label={t('sidebar.ariaLabel')}
      >
        <div className="shell-brand">
          <div className="shell-brand-logo" aria-hidden="true">FS</div>
          <span className="shell-brand-name">Fieldstack</span>
          {/* 데스크톱: 접기/펼치기 버튼 */}
          <button
            type="button"
            className="shell-collapse-btn"
            onClick={toggleCollapsed}
            aria-label={isCollapsed ? t('sidebar.expand') : t('sidebar.collapse')}
            aria-expanded={!isCollapsed}
          >
            <span aria-hidden="true">{isCollapsed ? "›" : "‹"}</span>
          </button>
          {/* 모바일: 닫기 버튼 */}
          <button
            type="button"
            className="shell-drawer-close"
            onClick={closeMobileMenu}
            aria-label={t('sidebar.closeMenu')}
          >
            ✕
          </button>
        </div>

        <nav className="shell-nav" aria-label="주 메뉴">
          {/* Workspace */}
          <p className="shell-nav-label" aria-hidden="true">{t('nav.workspace')}</p>
          <ul className="shell-nav-list" onKeyDown={handleNavKeyDown}>
            <li>
              <button
                type="button"
                className="shell-nav-item"
                data-label={t('nav.home')}
                aria-current={route === "home" ? "page" : undefined}
                onClick={() => navAndClose("home")}
              >
                <span className="shell-nav-icon" aria-hidden="true">⊞</span>
                <span className="shell-nav-text">{t('nav.home')}</span>
              </button>
            </li>
            <li>
              <button
                type="button"
                className="shell-nav-item"
                data-label={t('nav.marketplace')}
                aria-current={route === "marketplace" ? "page" : undefined}
                onClick={() => navAndClose("marketplace")}
              >
                <span className="shell-nav-icon" aria-hidden="true">⬡</span>
                <span className="shell-nav-text">{t('nav.marketplace')}</span>
              </button>
            </li>
          </ul>

          {/* Modules */}
          <p className="shell-nav-label" aria-hidden="true">{t('nav.modules')}</p>
          <ul className="shell-nav-list" aria-label={t('sidebar.moduleMenu')} onKeyDown={handleNavKeyDown}>
            {sidebarModules.length > 0 ? (
              sidebarModules.map((mod) => {
                const isActive = route === mod.name;
                const subItems = moduleSubNav[mod.name];
                return (
                  <li key={mod.name}>
                    {/* 모듈 루트 버튼 */}
                    <button
                      type="button"
                      className="shell-nav-item"
                      data-label={t(mod.displayName, { defaultValue: mod.name })}
                      aria-current={isActive && !subRoute ? "page" : undefined}
                      onClick={() => { window.location.hash = mod.name; closeMobileMenu(); }}
                    >
                      <span className="shell-nav-icon" aria-hidden="true">{mod.icon ?? '📦'}</span>
                      <span className="shell-nav-text">{t(mod.displayName, { defaultValue: mod.name })}</span>
                    </button>

                    {/* 서브 네비게이션 — 해당 모듈이 활성화됐을 때만 표시 */}
                    {isActive && subItems && subItems.length > 0 && (
                      <ul className="shell-subnav-list" aria-label={t('sidebar.subMenu', { name: t(mod.displayName, { defaultValue: mod.name }) })}>
                        {subItems.map((sub) => {
                          const hash = sub.key ? `${mod.name}/${sub.key}` : mod.name;
                          const isSubActive = subRoute === sub.key;
                          return (
                            <li key={sub.key}>
                              <button
                                type="button"
                                className="shell-subnav-item"
                                aria-current={isSubActive ? "page" : undefined}
                                onClick={() => { window.location.hash = hash; closeMobileMenu(); }}
                              >
                                {sub.icon && (
                                  <span className="shell-subnav-icon" aria-hidden="true">{sub.icon}</span>
                                )}
                                <span className="shell-subnav-text">{sub.label}</span>
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </li>
                );
              })
            ) : (
              <li className="shell-nav-empty">{t('nav.noModules')}</li>
            )}
          </ul>
        </nav>

        {/* Footer */}
        <div className="shell-sidebar-footer">
          {currentUser && (
            <div className="shell-user" title={isCollapsed ? currentUser.email : undefined}>
              <div className="shell-user-avatar" aria-hidden="true">{userInitial}</div>
              <div className="shell-user-info">
                <p className="shell-user-email">{currentUser.email}</p>
                <p className="shell-user-role">{isAdmin ? t('sidebar.role.admin') : t('sidebar.role.user')}</p>
              </div>
            </div>
          )}
          <button
            type="button"
            className="shell-nav-item"
            data-label={t('nav.settings')}
            onClick={() => { onOpenSettings(); closeMobileMenu(); }}
          >
            <span className="shell-nav-icon" aria-hidden="true">⚙</span>
            <span className="shell-nav-text">{t('nav.settings')}</span>
          </button>
          {isAdmin && (
            <button
              type="button"
              className="shell-nav-item"
              data-label={t('nav.admin')}
              aria-current={route === "admin" ? "page" : undefined}
              onClick={() => navAndClose("admin")}
            >
              <span className="shell-nav-icon" aria-hidden="true">⚡</span>
              <span className="shell-nav-text">{t('nav.admin')}</span>
            </button>
          )}
          <button
            type="button"
            className="shell-nav-item shell-nav-item-danger"
            data-label={t('nav.signOut')}
            onClick={() => { onLogout(); closeMobileMenu(); }}
          >
            <span className="shell-nav-icon" aria-hidden="true">→</span>
            <span className="shell-nav-text">{t('nav.signOut')}</span>
          </button>
        </div>
      </aside>

      {/* ── Body ─────────────────────────────────────────── */}
      <div className="shell-body">
        {/* 모바일 상단 바 */}
        <div className="shell-mobile-topbar">
          <button
            type="button"
            className="shell-hamburger"
            onClick={() => setIsMobileOpen(true)}
            aria-label={t('sidebar.openMenu')}
            aria-expanded={isMobileOpen}
          >
            <span aria-hidden="true">☰</span>
          </button>
          <div className="shell-brand-logo" aria-hidden="true">FS</div>
          <span className="shell-brand-name">Fieldstack</span>
        </div>

        {notice && (
          <div className="shell-notice" role="status" aria-live="polite">
            <span className="shell-notice-dot" aria-hidden="true" />
            {notice}
          </div>
        )}
        <main className="shell-content">
          {children}
        </main>
      </div>
    </div>
  );
}
