import { FormEvent, useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";

import "./app.css";

type InstallMode = "normal" | "bypass";
type RouteKey = "login" | "home" | "settings" | "admin";
type ViewState = "ready" | "loading" | "empty" | "error";

interface WebRuntimeEnv {
  MODE?: string;
  DEV?: boolean;
  VITE_INSTALL_MODE?: string;
}

const WEB_BOOTSTRAP_MESSAGE = "Fieldstack Web bootstrap initialized";

function resolveInstallMode(runtimeEnv: WebRuntimeEnv): InstallMode {
  const requestedMode = runtimeEnv.VITE_INSTALL_MODE;
  const isDevelopment = runtimeEnv.DEV === true || runtimeEnv.MODE === "development";

  if (requestedMode === "bypass") {
    if (isDevelopment) {
      return "bypass";
    }

    console.warn("[fieldstack][web] VITE_INSTALL_MODE=bypass ignored outside development");
  }

  return "normal";
}

function getRouteFromHash(rawHash: string): RouteKey {
  const hash = rawHash.replace("#", "");
  if (hash === "home" || hash === "settings" || hash === "admin" || hash === "login") {
    return hash;
  }
  return "login";
}

function canAccessRoute(route: RouteKey, isAuthenticated: boolean, isAdmin: boolean): boolean {
  if (route === "login") {
    return true;
  }

  if (!isAuthenticated) {
    return false;
  }

  if (route === "admin") {
    return isAdmin;
  }

  return true;
}

function App({ installMode }: { installMode: InstallMode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [homeState, setHomeState] = useState<ViewState>("ready");
  const [notice, setNotice] = useState(
    installMode === "bypass"
      ? "DEV bypass is active. Install is skipped, but auth flow starts from login."
      : "Normal mode is active. Install flow and auth integrations are expected.",
  );
  const [route, setRoute] = useState<RouteKey>(() => getRouteFromHash(window.location.hash));

  useEffect(() => {
    const handleHashChange = () => {
      setRoute(getRouteFromHash(window.location.hash));
    };

    window.addEventListener("hashchange", handleHashChange);
    return () => {
      window.removeEventListener("hashchange", handleHashChange);
    };
  }, []);

  const effectiveRoute = useMemo<RouteKey>(() => {
    if (canAccessRoute(route, isAuthenticated, isAdmin)) {
      return route;
    }
    return "login";
  }, [isAdmin, isAuthenticated, route]);

  useEffect(() => {
    if (window.location.hash !== `#${effectiveRoute}`) {
      window.location.hash = effectiveRoute;
    }
  }, [effectiveRoute]);

  const navigate = (nextRoute: RouteKey) => {
    setRoute(nextRoute);
    window.location.hash = nextRoute;
  };

  const onLogin = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsAuthenticated(true);
    setNotice("Login successful (mock).");
    navigate("home");
  };

  const onQuickLogin = () => {
    setIsAuthenticated(true);
    setNotice("Quick login enabled for UI iteration.");
    navigate("home");
  };

  const onLogout = () => {
    setIsAuthenticated(false);
    setNotice("Logged out. Re-authenticate to continue.");
    navigate("login");
  };

  const onToggleAdmin = () => {
    setIsAdmin((previous) => {
      const next = !previous;
      setNotice(next ? "Admin authority enabled for testing." : "Admin authority disabled.");
      return next;
    });
  };

  const statusMeta = {
    ready: { chip: "chip-ready", label: "Ready", desc: "Core dashboard is available and interactive." },
    loading: {
      chip: "chip-loading",
      label: "Loading",
      desc: "Data is being prepared. Use this state while waiting for API responses.",
    },
    empty: { chip: "chip-empty", label: "Empty", desc: "No module data yet. Show CTA links for first actions." },
    error: { chip: "chip-error", label: "Error", desc: "Request failed. Keep retry and summary guidance visible." },
  }[homeState];

  return (
    <main className="frame">
      <header className="topbar">
        <div className="brand">Fieldstack Core Control Plane</div>
        <span className={`badge ${installMode === "bypass" ? "badge-danger" : "badge-soft"}`}>
          {installMode === "bypass" ? "DEV BYPASS" : "NORMAL MODE"}
        </span>
      </header>

      <p className="notice">{notice}</p>

      <section className="layout">
        {isAuthenticated ? (
          <aside className="nav" aria-label="Core navigation">
            <ul className="nav-list">
              <li>
                <button className="nav-button" type="button" aria-current={effectiveRoute === "home" ? "page" : undefined} onClick={() => navigate("home")}>Home</button>
              </li>
              <li>
                <button className="nav-button" type="button" aria-current={effectiveRoute === "settings" ? "page" : undefined} onClick={() => navigate("settings")}>Settings</button>
              </li>
              <li>
                <button className="nav-button" type="button" aria-current={effectiveRoute === "admin" ? "page" : undefined} onClick={() => navigate("admin")}>Admin</button>
              </li>
              <li>
                <button className="nav-button" type="button" onClick={onLogout}>Logout</button>
              </li>
            </ul>
          </aside>
        ) : null}

        {effectiveRoute === "login" ? (
          <section className="panel" aria-labelledby="login-title">
            <h1 className="title" id="login-title">로그인</h1>
            <p className="subtitle">설치 이후 진입 흐름을 기준으로 인증 UX를 테스트할 수 있습니다.</p>
            <form className="stack" onSubmit={onLogin}>
              <label className="field">
                <span>이메일</span>
                <input className="input" type="email" name="email" placeholder="owner@fieldstack.dev" required />
              </label>
              <label className="field">
                <span>비밀번호</span>
                <input className="input" type="password" name="password" placeholder="••••••••" required />
              </label>
              <div className="actions">
                <button className="button button-primary" type="submit">로그인</button>
                <button className="button" type="button" onClick={onQuickLogin}>Bypass 로그인</button>
              </div>
            </form>
          </section>
        ) : null}

        {effectiveRoute === "home" ? (
          <section className="panel" aria-labelledby="home-title">
            <h1 className="title" id="home-title">Home</h1>
            <p className="subtitle">설치 이후 기본 허브 화면 구조(요약/액션/상태)를 검증합니다.</p>
            <div className="stack">
              <div className="grid">
                <article className="status status-ready">
                  <h3>Quick Action</h3>
                  <p>새 모듈 탐색, 설정 이동, 로그아웃 같은 핵심 행동 진입점.</p>
                </article>
                <article className="status status-loading">
                  <h3>Recent Activity</h3>
                  <p>설치/인증/설정 변경 이벤트 피드 위치.</p>
                </article>
              </div>
              <div className={`status status-${homeState}`} aria-live="polite">
                <h3>
                  View State <span className={`chip ${statusMeta.chip}`}>{statusMeta.label}</span>
                </h3>
                <p>{statusMeta.desc}</p>
              </div>
              <div className="actions">
                <button className="button" type="button" onClick={() => setHomeState("ready")}>Ready</button>
                <button className="button" type="button" onClick={() => setHomeState("loading")}>Loading</button>
                <button className="button" type="button" onClick={() => setHomeState("empty")}>Empty</button>
                <button className="button button-danger" type="button" onClick={() => setHomeState("error")}>Error</button>
              </div>
            </div>
          </section>
        ) : null}

        {effectiveRoute === "settings" ? (
          <section className="panel" aria-labelledby="settings-title">
            <h1 className="title" id="settings-title">Settings</h1>
            <p className="subtitle">일반 설정 저장 UX와 관리자 권한 토글을 함께 점검합니다.</p>
            <div className="stack">
              <div className="grid">
                <label className="field">
                  <span>표시 이름</span>
                  <input className="input" type="text" placeholder="Fieldstack Owner" />
                </label>
                <label className="field">
                  <span>언어</span>
                  <select className="select">
                    <option>한국어</option>
                    <option>English</option>
                  </select>
                </label>
              </div>
              <div className="actions">
                <button className="button button-primary" type="button" onClick={() => setNotice("Settings saved (mock).")}>저장</button>
                <button className="button" type="button" onClick={onToggleAdmin}>{isAdmin ? "관리자 권한 해제" : "관리자 권한 부여"}</button>
              </div>
            </div>
          </section>
        ) : null}

        {effectiveRoute === "admin" ? (
          <section className="panel" aria-labelledby="admin-title">
            <h1 className="title" id="admin-title">Admin</h1>
            {isAdmin ? (
              <>
                <p className="subtitle">관리자 전용 설정 및 감사 로그 진입점을 검증합니다.</p>
                <div className="stack">
                  <article className="status status-ready">
                    <h3>PIN Session</h3>
                    <p>30분 만료 시 재인증 모달을 띄우는 자리입니다.</p>
                  </article>
                  <article className="status status-loading">
                    <h3>Audit Logs</h3>
                    <p>PIN 실패, 권한 변경, 주요 설정 저장 이력을 보여줄 카드 영역입니다.</p>
                  </article>
                </div>
              </>
            ) : (
              <article className="status status-error" role="alert">
                <h3>Unauthorized</h3>
                <p>관리자 권한이 없어서 접근할 수 없습니다. Settings에서 관리자 권한을 활성화하세요.</p>
              </article>
            )}
          </section>
        ) : null}
      </section>
    </main>
  );
}

const runtimeEnv = (import.meta as ImportMeta & { env?: WebRuntimeEnv }).env ?? {};
const installMode = resolveInstallMode(runtimeEnv);

console.log(WEB_BOOTSTRAP_MESSAGE);
console.log(`[fieldstack][web] install mode: ${installMode}`);

if (installMode === "bypass") {
  console.warn("[fieldstack][web] DEV INSTALL BYPASS ACTIVE");
}

const appRootElement = document.querySelector<HTMLDivElement>("#app");

if (appRootElement === null) {
  throw new Error("App root element '#app' was not found.");
}

createRoot(appRootElement).render(<App installMode={installMode} />);
