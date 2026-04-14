import { type FormEvent, useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";

import "./styles/global.css";
import "./styles/login.css";
import "@fieldstack/controls/styles";

import { AppShell, type RouteKey } from "./components/AppShell";
import { AdminPinModal } from "./components/AdminPinModal";
import { HomeView } from "./views/HomeView";
import { LoginView } from "./views/LoginView";
import { SettingsView } from "./views/SettingsView";
import { AdminView } from "./views/AdminView";
import { MarketplaceView } from "./views/MarketplaceView";
import { ChangePasswordView } from "./views/ChangePasswordView";
import { ForgotPasswordView } from "./views/ForgotPasswordView";

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
  const valid: RouteKey[] = ["login", "forgot-password", "home", "marketplace", "admin", "change-password"];
  return (valid as string[]).includes(hash) ? (hash as RouteKey) : "login";
}

// ─── Theme ────────────────────────────────────────────────────
type ThemeSetting = "light" | "dark" | "system";

function applyTheme(setting: ThemeSetting) {
  const root = document.documentElement;
  if (setting === "system") {
    root.removeAttribute("data-theme");
  } else {
    root.setAttribute("data-theme", setting);
  }
  try { localStorage.setItem("fs_theme", setting); } catch { /* ignore */ }
}

function loadTheme(): ThemeSetting {
  try {
    const saved = localStorage.getItem("fs_theme");
    if (saved === "light" || saved === "dark" || saved === "system") return saved;
  } catch { /* ignore */ }
  return "system";
}

// 초기 테마 적용 (React 렌더 전에 FOUC 방지)
applyTheme(loadTheme());

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
  const [theme, setTheme] = useState<ThemeSetting>(loadTheme);

  const handleThemeChange = (next: ThemeSetting) => {
    setTheme(next);
    applyTheme(next);
  };

  const [isAuthenticated, setIsAuthenticated] = useState(
    () => sessionStorage.getItem(SS.auth) === "true",
  );
  const [isAdmin, setIsAdmin] = useState(
    () => sessionStorage.getItem(SS.admin) === "true",
  );
  const [isPinVerified, setIsPinVerified] = useState(
    () => sessionStorage.getItem(SS.pinVerified) === "true",
  );
  // OTP 인증 대기 중인 이메일 (로그인 완료 전 임시 상태 — sessionStorage 미저장)
  const [pendingOtpEmail, setPendingOtpEmail] = useState<string | null>(null);
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
    // OTP 대기 중: login 화면 유지 (LoginView 내부에서 step 전환)
    if (pendingOtpEmail) return "login";
    // 미인증: login / forgot-password만 허용
    if (!isAuthenticated) {
      return route === "forgot-password" ? "forgot-password" : "login";
    }
    // 비밀번호 변경 강제
    if (mustChangePassword && route !== "change-password") return "change-password";
    return route;
  }, [isAuthenticated, mustChangePassword, pendingOtpEmail, route]);

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
    const password = formData.get("password") as string | null;

    // mock: "otp1234" → LoginView 내 OTP step으로 전환
    if (password === "otp1234") {
      setPendingOtpEmail(email);
      return;
    }

    // mock: "temp1234" → 임시 비번 첫 로그인 강제 변경
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

  const onOtpVerified = () => {
    if (!pendingOtpEmail) return;
    const email = pendingOtpEmail;
    setPendingOtpEmail(null);
    setIsAuthenticated(true);
    setCurrentUser({ email });
    sessionStorage.setItem(SS.auth, "true");
    sessionStorage.setItem(SS.email, email);
    setNotice("2단계 인증 완료.");
    navigate("home");
  };

  const onOtpCancel = () => {
    setPendingOtpEmail(null);
    navigate("login");
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

  // Login page (no shell) — OTP step도 이 안에서 처리
  if (effectiveRoute === "login") {
    return (
      <main className="auth-shell">
        <section className="auth-layout">
          <LoginView
            onLogin={onLogin}
            onQuickLogin={onQuickLogin}
            onForgotPassword={() => navigate("forgot-password")}
            showDevBypass={installMode === "bypass"}
            pendingEmail={pendingOtpEmail}
            onOtpVerified={onOtpVerified}
            onOtpCancel={onOtpCancel}
          />
        </section>
      </main>
    );
  }

  // 비밀번호 찾기 (no shell)
  if (effectiveRoute === "forgot-password") {
    return <ForgotPasswordView onBack={() => navigate("login")} />;
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
            theme={theme}
            onThemeChange={handleThemeChange}
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
