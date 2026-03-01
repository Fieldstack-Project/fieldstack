import type { ReactNode } from "react";

import "../styles/shell.css";

export type RouteKey = "login" | "home" | "admin";

interface AppShellProps {
  installMode: "normal" | "bypass";
  route: RouteKey;
  isAdmin: boolean;
  notice: string;
  onNavigate: (route: RouteKey) => void;
  onLogout: () => void;
  onOpenSettings: () => void;
  children: ReactNode;
}

export function AppShell({
  installMode,
  route,
  isAdmin,
  notice,
  onNavigate,
  onLogout,
  onOpenSettings,
  children,
}: AppShellProps) {
  const currentTime = new Date().toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <main className="frame">
      <header className="shell-header">
        <div className="shell-brand-wrap">
          <div className="shell-logo">FS</div>
          <div>
            <p className="shell-brand">Fieldstack Control Plane</p>
            <p className="shell-subbrand">Personal modular workspace</p>
          </div>
        </div>

        <div className="shell-header-right">
          <span className="shell-time">
            {currentTime}
          </span>
          <span className={`badge ${installMode === "bypass" ? "badge-danger" : "badge-soft"}`}>
            {installMode === "bypass" ? "DEV BYPASS" : "NORMAL MODE"}
          </span>
        </div>
      </header>

      {notice ? <p className="shell-notice">{notice}</p> : null}

      <section className="shell-layout">
        <aside className="shell-side" aria-label="Core navigation">
          <div className="shell-side-block">
            <p className="shell-side-title">Workspace</p>
            <ul className="shell-nav-list">
              <li>
                <button
                  className="shell-nav-button"
                  type="button"
                  aria-current={route === "home" ? "page" : undefined}
                  onClick={() => onNavigate("home")}
                >
                  Home Hub
                </button>
              </li>
              <li>
                <button className="shell-nav-button" type="button" onClick={onOpenSettings}>
                  General Settings
                </button>
              </li>
            </ul>
          </div>

          <div className="shell-side-block">
            <p className="shell-side-title">Operations</p>
            <ul className="shell-nav-list">
              {isAdmin ? (
                <li>
                  <button
                    className="shell-nav-button"
                    type="button"
                    aria-current={route === "admin" ? "page" : undefined}
                    onClick={() => onNavigate("admin")}
                  >
                    Admin Console
                  </button>
                </li>
              ) : null}
              <li>
                <button className="shell-nav-button" type="button" onClick={onLogout}>
                  Sign Out
                </button>
              </li>
            </ul>
          </div>

          <div className="shell-health">
            <p className="shell-health-title">System Snapshot</p>
            <p className="shell-health-line">Core: Online</p>
            <p className="shell-health-line">Modules: 0 active</p>
            <p className="shell-health-line">Auth: Session valid</p>
          </div>
        </aside>

        <section className="shell-content">{children}</section>
      </section>
    </main>
  );
}
