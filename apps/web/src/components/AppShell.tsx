import type { ReactNode } from "react";
import "../styles/shell.css";

export type RouteKey = "login" | "home" | "admin";

interface AppShellProps {
  installMode: "normal" | "bypass";
  route: RouteKey;
  isAdmin: boolean;
  notice: string;
  onNavigate: (route: RouteKey) => void;
  onAdminAccess: () => void;
  onLogout: () => void;
  onOpenSettings: () => void;
  children: ReactNode;
}

// 추후 모듈 로더에서 주입될 목록 (현재는 mock)
const INSTALLED_MODULES: { id: string; label: string; icon: string }[] = [];

export function AppShell({
  installMode,
  route,
  isAdmin,
  notice,
  onNavigate,
  onAdminAccess,
  onLogout,
  onOpenSettings,
  children,
}: AppShellProps) {
  return (
    <div className="shell">
      {/* ── Sidebar ─────────────────────────────────────── */}
      <aside className="shell-sidebar" aria-label="사이드바 네비게이션">
        <div className="shell-brand">
          <div className="shell-brand-logo" aria-hidden="true">FS</div>
          <span className="shell-brand-name">Fieldstack</span>
        </div>

        <nav className="shell-nav" aria-label="주 메뉴">
          {/* Workspace */}
          <p className="shell-nav-label" aria-hidden="true">Workspace</p>
          <ul className="shell-nav-list">
            <li>
              <button
                type="button"
                className="shell-nav-item"
                aria-current={route === "home" ? "page" : undefined}
                onClick={() => onNavigate("home")}
              >
                <span className="shell-nav-icon" aria-hidden="true">⊞</span>
                Home
              </button>
            </li>
          </ul>

          {/* Modules */}
          <p className="shell-nav-label" aria-hidden="true">Modules</p>
          <ul className="shell-nav-list" aria-label="설치된 모듈">
            {INSTALLED_MODULES.length > 0 ? (
              INSTALLED_MODULES.map((mod) => (
                <li key={mod.id}>
                  <button
                    type="button"
                    className="shell-nav-item"
                    onClick={() => { window.location.hash = mod.id; }}
                  >
                    <span className="shell-nav-icon" aria-hidden="true">{mod.icon}</span>
                    {mod.label}
                  </button>
                </li>
              ))
            ) : (
              <li className="shell-nav-empty">모듈 없음</li>
            )}
          </ul>
        </nav>

        {/* Footer */}
        <div className="shell-sidebar-footer">
          {installMode === "bypass" && (
            <div className="shell-bypass-pill" aria-label="개발 bypass 모드 활성">
              DEV BYPASS
            </div>
          )}
          <button type="button" className="shell-nav-item" onClick={onOpenSettings}>
            <span className="shell-nav-icon" aria-hidden="true">⚙</span>
            Settings
          </button>
          <button
            type="button"
            className="shell-nav-item"
            aria-current={route === "admin" ? "page" : undefined}
            onClick={onAdminAccess}
          >
            <span className="shell-nav-icon" aria-hidden="true">⚡</span>
            Admin
            {!isAdmin && (
              <span className="shell-nav-lock" aria-label="인증 필요" aria-hidden="true">🔒</span>
            )}
          </button>
          <button
            type="button"
            className="shell-nav-item shell-nav-item-danger"
            onClick={onLogout}
          >
            <span className="shell-nav-icon" aria-hidden="true">↪</span>
            Sign Out
          </button>
        </div>
      </aside>

      {/* ── Body ─────────────────────────────────────────── */}
      <div className="shell-body">
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
