import { FormEvent, useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";

import "./styles/global.css";
import "./styles/login.css";

import { AppShell, type RouteKey } from "./components/AppShell";
import { AdminPinModal } from "./components/AdminPinModal";
import { HomeView } from "./views/HomeView";
import { LoginView } from "./views/LoginView";
import { SettingsView } from "./views/SettingsView";
import { AdminView } from "./views/AdminView";
import { MarketplaceView } from "./views/MarketplaceView";
import { ChangePasswordView } from "./views/ChangePasswordView";

// ─── Types ────────────────────────────────────────────────────
type InstallMode = "normal" | "bypass";

interface WebRuntimeEnv {
  MODE?: string;
  DEV?: boolean;
  VITE_INSTALL_MODE?: string;
}

// ─── Helpers ──────────────────────────────────────────────────
const WEB_BOOTSTRAP_MESSAGE = "Fieldstack Web bootstrap initialized";

function resolveInstallMode(runtimeEnv: WebRuntimeEnv): InstallMode {
  const requestedMode = runtimeEnv.VITE_INSTALL_MODE;
  const isDevelopment = runtimeEnv.DEV === true || runtimeEnv.MODE === "development";

  if (requestedMode === "bypass") {
    if (isDevelopment) return "bypass";
    console.warn("[fieldstack][web] VITE_INSTALL_MODE=bypass ignored outside development");
  }

  return "normal";
}

function getRouteFromHash(rawHash: string): RouteKey {
  const hash = rawHash.replace("#", "");
  if (hash === "settings") return "home";
  if (hash === "home" || hash === "marketplace" || hash === "admin" || hash === "login" || hash === "change-password") {
    return hash;
  }
  return "login";
}

function canAccessRoute(route: RouteKey, isAuthenticated: boolean): boolean {
  if (route === "login") return true;
  if (!isAuthenticated) return false;
  // admin 라우트는 인증된 유저라면 진입 허용 — AdminView 내부에서 isAdmin으로 콘텐츠 게이팅
  return true;
}

// ─── Session Storage Keys ─────────────────────────────────────
const SS = {
  auth:            "fs_auth",
  admin:           "fs_admin",
  pinVerified:     "fs_pin_verified",
  email:           "fs_email",
  mustChangePw:    "fs_must_change_pw",
} as const;

// ─── App Root ─────────────────────────────────────────────────
function App({ installMode }: { installMode: InstallMode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => sessionStorage.getItem(SS.auth) === "true",
  );
  const [isAdmin, setIsAdmin] = useState(
    () => sessionStorage.getItem(SS.admin) === "true",
  );
  const [isPinVerified, setIsPinVerified] = useState(
    () => sessionStorage.getItem(SS.pinVerified) === "true",
  );
  const [currentUser, setCurrentUser] = useState<{ email: string } | null>(
    () => {
      const email = sessionStorage.getItem(SS.email);
      return email ? { email } : null;
    },
  );
  const [mustChangePassword, setMustChangePassword] = useState(
    () => sessionStorage.getItem(SS.mustChangePw) === "true",
  );
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [notice, setNotice] = useState(
    installMode === "bypass"
      ? "DEV bypass active — install skipped, auth starts from login."
      : "",
  );
  const [route, setRoute] = useState<RouteKey>(() => getRouteFromHash(window.location.hash));

  useEffect(() => {
    const handleHashChange = () => setRoute(getRouteFromHash(window.location.hash));
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const effectiveRoute = useMemo<RouteKey>(() => {
    if (!canAccessRoute(route, isAuthenticated)) return "login";
    // 비밀번호 변경 강제: change-password 이외의 모든 경로 차단
    if (mustChangePassword && route !== "change-password") return "change-password";
    return route;
  }, [isAuthenticated, mustChangePassword, route]);

  useEffect(() => {
    if (window.location.hash !== `#${effectiveRoute}`) {
      window.location.hash = effectiveRoute;
    }
  }, [effectiveRoute]);

  const navigate = (nextRoute: RouteKey) => {
    setRoute(nextRoute);
    window.location.hash = nextRoute;
  };

  // Auth handlers
  const onLogin = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = (formData.get("email") as string | null) ?? "user@fieldstack.dev";
    // mock: 비밀번호가 "temp1234"이면 임시 비번 첫 로그인으로 처리
    const password = formData.get("password") as string | null;
    const isTempLogin = password === "temp1234";

    setIsAuthenticated(true);
    setCurrentUser({ email });
    sessionStorage.setItem(SS.auth, "true");
    sessionStorage.setItem(SS.email, email);

    if (isTempLogin) {
      setMustChangePassword(true);
      sessionStorage.setItem(SS.mustChangePw, "true");
      navigate("change-password");
    } else {
      setNotice("Login successful (mock).");
      navigate("home");
    }
  };

  const onQuickLogin = () => {
    const email = "dev@fieldstack.dev";
    setIsAuthenticated(true);
    setCurrentUser({ email });
    sessionStorage.setItem(SS.auth, "true");
    sessionStorage.setItem(SS.email, email);
    setNotice("");
    navigate("home");
  };

  const onPasswordChanged = () => {
    setMustChangePassword(false);
    sessionStorage.removeItem(SS.mustChangePw);
    setNotice("비밀번호가 변경되었습니다.");
    navigate("home");
  };

  const onPinVerified = () => {
    setIsAdmin(true);
    setIsPinVerified(true);
    setIsPinModalOpen(false);
    sessionStorage.setItem(SS.admin, "true");
    sessionStorage.setItem(SS.pinVerified, "true");
    setNotice("관리자 인증 완료 (mock). 30분간 유효합니다.");
    navigate("admin");
  };

  const onLogout = () => {
    setIsAuthenticated(false);
    setIsAdmin(false);
    setIsPinVerified(false);
    setCurrentUser(null);
    sessionStorage.removeItem(SS.auth);
    sessionStorage.removeItem(SS.admin);
    sessionStorage.removeItem(SS.pinVerified);
    sessionStorage.removeItem(SS.email);
    setNotice("Logged out.");
    navigate("login");
  };

  // Login page (no shell)
  if (effectiveRoute === "login") {
    return (
      <main className="auth-shell">
        <section className="auth-layout">
          <LoginView
            onLogin={onLogin}
            onQuickLogin={onQuickLogin}
            showDevBypass={installMode === "bypass"}
          />
        </section>
      </main>
    );
  }

  // 비밀번호 강제 변경 (shell 없이 전체 화면)
  if (effectiveRoute === "change-password") {
    return (
      <ChangePasswordView
        isFirstLogin={mustChangePassword}
        onChanged={onPasswordChanged}
      />
    );
  }

  return (
    <>
      {isPinModalOpen && (
        <AdminPinModal
          onVerified={onPinVerified}
          onClose={() => setIsPinModalOpen(false)}
        />
      )}
      <AppShell
        installMode={installMode}
        route={effectiveRoute}
        isAdmin={isAdmin}
        currentUser={currentUser}
        notice={notice}
        onNavigate={navigate}
        onLogout={onLogout}
        onOpenSettings={() => setIsSettingsOpen(true)}
      >
        {effectiveRoute === "home" && <HomeView onOpenSettings={() => setIsSettingsOpen(true)} />}
        {effectiveRoute === "marketplace" && <MarketplaceView />}
        {effectiveRoute === "admin" && (
          <AdminView isPinVerified={isPinVerified} onRequestPin={() => setIsPinModalOpen(true)} />
        )}
        {isSettingsOpen && (
          <SettingsView
            isAdmin={isAdmin}
            onClose={() => setIsSettingsOpen(false)}
            onToggleAdmin={() => {
              setIsAdmin((prev) => {
                const next = !prev;
                if (!next) {
                  // 관리자 역할 해제 시 PIN 인증도 초기화
                  setIsPinVerified(false);
                  sessionStorage.removeItem(SS.pinVerified);
                }
                setNotice(next ? "Admin authority enabled (mock)." : "Admin authority disabled.");
                return next;
              });
            }}
            onSaved={() => setNotice("Settings saved (mock).")}
          />
        )}
      </AppShell>
    </>
  );
}

// ─── Bootstrap ────────────────────────────────────────────────
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
