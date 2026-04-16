import { type ReactNode, useState, useEffect } from "react";
import "../styles/shell.css";

export type RouteKey = "login" | "forgot-password" | "home" | "marketplace" | "admin" | "change-password";

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

interface SidebarModule {
  name: string;
  basePath: string;
  enabled: boolean;
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
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [sidebarModules, setSidebarModules] = useState<SidebarModule[]>([]);

  // 로그인 후(currentUser 존재) GET /core/modules/me 로 사용자 모듈 목록 조회
  useEffect(() => {
    if (!currentUser || installMode === "bypass") {
      setSidebarModules([]);
      return;
    }
    const token = sessionStorage.getItem("fs_token") ?? "";
    if (!token) return;

    fetch("/core/modules/me", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((json: { success: boolean; data?: { modules: SidebarModule[] } }) => {
        if (json.success) {
          // 활성화(enabled: true)된 모듈만 사이드바에 표시
          setSidebarModules((json.data?.modules ?? []).filter((m) => m.enabled));
        }
      })
      .catch(() => { /* 사이드바 모듈 로드 실패는 무음 처리 */ });
  }, [currentUser, installMode]);

  const closeMobileMenu = () => setIsMobileOpen(false);
  const navAndClose = (target: RouteKey) => { onNavigate(target); closeMobileMenu(); };

  return (
    <div className="shell">
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
        aria-label="사이드바 네비게이션"
      >
        <div className="shell-brand">
          <div className="shell-brand-logo" aria-hidden="true">FS</div>
          <span className="shell-brand-name">Fieldstack</span>
          {/* 모바일: 닫기 버튼 */}
          <button
            type="button"
            className="shell-drawer-close"
            onClick={closeMobileMenu}
            aria-label="메뉴 닫기"
          >
            ✕
          </button>
        </div>

        <nav className="shell-nav" aria-label="주 메뉴">
          {/* Workspace */}
          <p className="shell-nav-label" aria-hidden="true">Workspace</p>
          <ul className="shell-nav-list" onKeyDown={handleNavKeyDown}>
            <li>
              <button
                type="button"
                className="shell-nav-item"
                aria-current={route === "home" ? "page" : undefined}
                onClick={() => navAndClose("home")}
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
                onClick={() => navAndClose("marketplace")}
              >
                <span className="shell-nav-icon" aria-hidden="true">⬡</span>
                Marketplace
              </button>
            </li>
          </ul>

          {/* Modules */}
          <p className="shell-nav-label" aria-hidden="true">Modules</p>
          <ul className="shell-nav-list" aria-label="설치된 모듈" onKeyDown={handleNavKeyDown}>
            {sidebarModules.length > 0 ? (
              sidebarModules.map((mod) => (
                <li key={mod.name}>
                  <button
                    type="button"
                    className="shell-nav-item"
                    onClick={() => { window.location.hash = mod.name; closeMobileMenu(); }}
                  >
                    <span className="shell-nav-icon" aria-hidden="true">📦</span>
                    {mod.name}
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
          <button type="button" className="shell-nav-item" onClick={() => { onOpenSettings(); closeMobileMenu(); }}>
            <span className="shell-nav-icon" aria-hidden="true">⚙</span>
            Settings
          </button>
          {isAdmin && (
            <button
              type="button"
              className="shell-nav-item"
              aria-current={route === "admin" ? "page" : undefined}
              onClick={() => navAndClose("admin")}
            >
              <span className="shell-nav-icon" aria-hidden="true">⚡</span>
              Admin
            </button>
          )}
          <button
            type="button"
            className="shell-nav-item shell-nav-item-danger"
            onClick={() => { onLogout(); closeMobileMenu(); }}
          >
            <span className="shell-nav-icon" aria-hidden="true">→</span>
            Sign Out
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
            aria-label="메뉴 열기"
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
