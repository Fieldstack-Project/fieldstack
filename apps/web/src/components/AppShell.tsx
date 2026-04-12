import type { ReactNode } from "react";
import "../styles/shell.css";

export type RouteKey = "login" | "otp" | "forgot-password" | "home" | "marketplace" | "admin" | "change-password";

interface AppShellProps {
  installMode: "normal" | "bypass";
  route: RouteKey;
  isAdmin: boolean;
  currentUser: { email: string } | null;
  notice: string;
  onNavigate: (route: RouteKey) => void;
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
  currentUser,
  notice,
  onNavigate,
  onLogout,
  onOpenSettings,
  children,
}: AppShellProps) {
  const userInitial = currentUser?.email.charAt(0).toUpperCase() ?? "?";
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
            <li>
              <button
                type="button"
                className="shell-nav-item"
                aria-current={route === "marketplace" ? "page" : undefined}
                onClick={() => onNavigate("marketplace")}
              >
                <span className="shell-nav-icon" aria-hidden="true">⬡</span>
                Marketplace
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
          {currentUser && (
            <div className="shell-user">
              <div className="shell-user-avatar" aria-hidden="true">{userInitial}</div>
              <div className="shell-user-info">
                <p className="shell-user-email">{currentUser.email}</p>
                <p className="shell-user-role">{isAdmin ? "Administrator" : "User"}</p>
              </div>
            </div>
          )}
          {installMode === "bypass" && (
            <div className="shell-bypass-pill" aria-label="개발 bypass 모드 활성">
              DEV BYPASS
            </div>
          )}
          <button type="button" className="shell-nav-item" onClick={onOpenSettings}>
            <span className="shell-nav-icon" aria-hidden="true">⚙</span>
            Settings
          </button>
          {isAdmin && (
            <button
              type="button"
              className="shell-nav-item"
              aria-current={route === "admin" ? "page" : undefined}
              onClick={() => onNavigate("admin")}
            >
              <span className="shell-nav-icon" aria-hidden="true">⚡</span>
              Admin
            </button>
          )}
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
