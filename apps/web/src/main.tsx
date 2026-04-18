import { type FormEvent, useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";

import { setSessionExpiredHandler } from "./lib/apiFetch";

import "./styles/global.css";
import "./styles/login.css";
import "./styles/setup-wizard.css";
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
import { SetupWizardView } from "./views/SetupWizardView";
import { LedgerView } from "../../../modules/ledger/frontend/LedgerView";

// ─── Helpers ──────────────────────────────────────────────────

// 코어 라우트 목록 (앱 shell 없이 전체 화면으로 렌더되는 것 제외)
const CORE_ROUTES = ["login", "forgot-password", "home", "marketplace", "admin", "change-password"] as const;
// 모듈 라우트 — module.json name 기준 (서버 레지스트리와 일치)
const MODULE_ROUTES: string[] = ["ledger"];

function getRouteFromHash(rawHash: string): RouteKey {
  const hash = rawHash.replace("#", "");
  if (hash === "settings") return "home";
  if ((CORE_ROUTES as readonly string[]).includes(hash)) return hash as RouteKey;
  if (MODULE_ROUTES.includes(hash)) return hash as RouteKey;
  return "login";
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

// ─── Storage Keys ─────────────────────────────────────────────
const SS = {
  auth:            "fs_auth",
  admin:           "fs_admin",
  pinVerified:     "fs_pin_verified",
  email:           "fs_email",
  mustChangePw:    "fs_must_change_pw",
  token:           "fs_token",
  refresh:         "fs_refresh",
} as const;

const LS = {
  firstVisitShown: "fs_first_visit_shown",
  startupRoute:    "fs_startup_route",
} as const;

// 딥 링크: 비인증 상태에서 진입한 app route 반환 (모듈 라우트 포함)
function getDeepLinkTarget(): RouteKey | null {
  const hash = window.location.hash.replace("#", "");
  const appRoutes: string[] = ["home", "marketplace", "admin", ...MODULE_ROUTES];
  return appRoutes.includes(hash) ? (hash as RouteKey) : null;
}

// 개인화: 로그인 후 첫 화면 설정
type StartupRoute = "home" | "marketplace";

function loadStartupRoute(): StartupRoute {
  try {
    const saved = localStorage.getItem(LS.startupRoute);
    if (saved === "marketplace") return "marketplace";
  } catch { /* ignore */ }
  return "home";
}

// ─── App Root ─────────────────────────────────────────────────
function App() {
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
  const [pinVerifiedAt, setPinVerifiedAt] = useState<number | null>(null);
  // OTP 인증 대기 중인 이메일 + challengeId (로그인 완료 전 임시 상태 — sessionStorage 미저장)
  const [pendingOtpEmail, setPendingOtpEmail] = useState<string | null>(null);
  const [pendingChallengeId, setPendingChallengeId] = useState<string | null>(null);
  const [otpApiError, setOtpApiError] = useState<string | null>(null);

  // 로그인 실패 상태
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [loginLockedUntil, setLoginLockedUntil] = useState<number | null>(null);
  const [sessionExpired, setSessionExpired] = useState(false);

  const MAX_LOGIN_ATTEMPTS = 5;
  const LOCKOUT_MS = 30 * 60 * 1000; // 30분

  const isLocked = loginLockedUntil !== null && Date.now() < loginLockedUntil;
  const [currentUser, setCurrentUser] = useState<{ email: string } | null>(
    () => {
      const email = sessionStorage.getItem(SS.email);
      return email ? { email } : null;
    },
  );
  const [mustChangePassword, setMustChangePassword] = useState(
    () => sessionStorage.getItem(SS.mustChangePw) === "true",
  );
  // 딥 링크: 비인증 상태에서 진입한 app route (로그인 후 복귀)
  const [redirectAfterLogin, setRedirectAfterLogin] = useState<RouteKey | null>(
    () => (sessionStorage.getItem(SS.auth) === "true" ? null : getDeepLinkTarget()),
  );
  // 첫 방문 온보딩 배너
  const [isFirstVisit, setIsFirstVisit] = useState(false);

  const onDismissFirstVisit = () => {
    setIsFirstVisit(false);
    try { localStorage.setItem(LS.firstVisitShown, "true"); } catch { /* ignore */ }
  };

  const [startupRoute, setStartupRoute] = useState<StartupRoute>(loadStartupRoute);
  const onStartupRouteChange = (route: StartupRoute) => {
    setStartupRoute(route);
    try { localStorage.setItem(LS.startupRoute, route); } catch { /* ignore */ }
  };

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const [route, setRoute] = useState<RouteKey>(() => getRouteFromHash(window.location.hash));

  useEffect(() => {
    const handleHashChange = () => {
      const next = getRouteFromHash(window.location.hash);
      setRoute(next);
      // 비인증 상태에서 app route로 hash 변경 시 redirect 대상 갱신
      const appRoutes: RouteKey[] = ["home", "marketplace", "admin"];
      if (sessionStorage.getItem(SS.auth) !== "true" && (appRoutes as string[]).includes(next)) {
        setRedirectAfterLogin(next);
      }
    };
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  // 관리자 PIN 세션 30분 만료
  useEffect(() => {
    if (!isPinVerified || pinVerifiedAt === null) return;
    const remaining = pinVerifiedAt + 30 * 60 * 1000 - Date.now();
    if (remaining <= 0) {
      setIsPinVerified(false);
      setPinVerifiedAt(null);
      sessionStorage.removeItem(SS.pinVerified);
      setNotice("관리자 세션이 만료되었습니다. 다시 인증해 주세요.");
      return;
    }
    const timer = setTimeout(() => {
      setIsPinVerified(false);
      setPinVerifiedAt(null);
      sessionStorage.removeItem(SS.pinVerified);
      setNotice("관리자 세션이 만료되었습니다. 다시 인증해 주세요.");
    }, remaining);
    return () => clearTimeout(timer);
  }, [isPinVerified, pinVerifiedAt]);

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

  // ── 로그인 성공 시 공통 처리 ─────────────────────────────────
  const handleLoginSuccess = (email: string, isAdmin: boolean, isTempPassword: boolean) => {
    setLoginError(null);
    setLoginAttempts(0);
    setLoginLockedUntil(null);
    setSessionExpired(false);
    setIsAuthenticated(true);
    // 세션 만료 시 자동 로그아웃 콜백 등록
    setSessionExpiredHandler(() => onLogout(true));
    setIsAdmin(isAdmin);
    if (isAdmin) sessionStorage.setItem(SS.admin, "true");
    setCurrentUser({ email });
    sessionStorage.setItem(SS.auth, "true");
    sessionStorage.setItem(SS.email, email);

    if (isTempPassword) {
      setMustChangePassword(true);
      sessionStorage.setItem(SS.mustChangePw, "true");
      navigate("change-password");
      return;
    }

    setNotice("로그인 성공.");
    try {
      if (localStorage.getItem(LS.firstVisitShown) !== "true") setIsFirstVisit(true);
    } catch { /* ignore */ }
    const target = redirectAfterLogin ?? startupRoute;
    setRedirectAfterLogin(null);
    navigate(target);
  };

  // Auth handlers
  const onLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isLocked) return;

    const formData = new FormData(event.currentTarget);
    const email = (formData.get("email") as string | null) ?? "";
    const password = (formData.get("password") as string | null) ?? "";

    try {
      type LoginResponse = {
        success: boolean;
        error?: string;
        data?: {
          type: "session";
          tokens: { accessToken: string; refreshToken: string };
          isTempPassword: boolean;
          isAdmin: boolean;
        } | {
          type: "totp_required";
          challengeId: string;
          userId: string;
        };
      };

      const res = await fetch("/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const json = await res.json() as LoginResponse;

      if (!res.ok || !json.success) {
        const next = loginAttempts + 1;
        setLoginAttempts(next);
        if (next >= MAX_LOGIN_ATTEMPTS) {
          setLoginLockedUntil(Date.now() + LOCKOUT_MS);
          setLoginError(null);
        } else {
          setLoginError("이메일 또는 비밀번호가 올바르지 않습니다.");
        }
        return;
      }

      const data = json.data!;

      if (data.type === "totp_required") {
        setLoginError(null);
        setLoginAttempts(0);
        setPendingOtpEmail(email);
        setPendingChallengeId(data.challengeId);
        setOtpApiError(null);
        return;
      }

      // type === "session"
      sessionStorage.setItem(SS.token, data.tokens.accessToken);
      sessionStorage.setItem(SS.refresh, data.tokens.refreshToken);
      handleLoginSuccess(email, data.isAdmin, data.isTempPassword);
    } catch {
      setLoginError("서버 연결에 실패했습니다. 잠시 후 다시 시도해주세요.");
    }
  };

  const onPasswordChanged = () => {
    setMustChangePassword(false);
    sessionStorage.removeItem(SS.mustChangePw);
    setNotice("비밀번호가 변경되었습니다.");
    navigate("home");
  };

  const onOtpVerified = async (code: string) => {
    if (!pendingOtpEmail) return;
    const email = pendingOtpEmail;

    if (!pendingChallengeId) return;
    try {
      type TotpResponse = {
        success: boolean;
        error?: string;
        data?: { accessToken: string; refreshToken: string; isTempPassword: boolean };
      };
      const res = await fetch("/auth/totp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ challengeId: pendingChallengeId, code }),
      });
      const json = await res.json() as TotpResponse;

      if (!res.ok || !json.success) {
        setOtpApiError("인증 코드가 올바르지 않습니다.");
        return;
      }

      setOtpApiError(null);
      sessionStorage.setItem(SS.token, json.data!.accessToken);
      sessionStorage.setItem(SS.refresh, json.data!.refreshToken);
      setPendingOtpEmail(null);
      setPendingChallengeId(null);
      handleLoginSuccess(email, false, json.data!.isTempPassword);
      setNotice("2단계 인증 완료.");
    } catch {
      setOtpApiError("서버 연결에 실패했습니다.");
    }
  };

  const onOtpCancel = () => {
    setPendingOtpEmail(null);
    setPendingChallengeId(null);
    setOtpApiError(null);
    navigate("login");
  };

  const onPinVerified = () => {
    setIsAdmin(true);
    setIsPinVerified(true);
    setPinVerifiedAt(Date.now());
    setIsPinModalOpen(false);
    sessionStorage.setItem(SS.admin, "true");
    sessionStorage.setItem(SS.pinVerified, "true");
    setNotice("관리자 인증 완료. 30분간 유효합니다.");
    navigate("admin");
  };

  const onLogout = (expired = false) => {
    // 세션 만료 핸들러 해제 (중복 호출 방지)
    setSessionExpiredHandler(null);
    // 토큰이 있으면 서버 세션 폐기 (실패해도 로컬 상태는 초기화)
    const token = sessionStorage.getItem(SS.token);
    if (token) {
      fetch("/auth/logout", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => { /* ignore */ });
    }

    setIsAuthenticated(false);
    setIsAdmin(false);
    setIsPinVerified(false);
    setPinVerifiedAt(null);
    setCurrentUser(null);
    sessionStorage.removeItem(SS.auth);
    sessionStorage.removeItem(SS.admin);
    sessionStorage.removeItem(SS.pinVerified);
    sessionStorage.removeItem(SS.email);
    sessionStorage.removeItem(SS.token);
    sessionStorage.removeItem(SS.refresh);
    setLoginError(null);
    setLoginAttempts(0);
    setLoginLockedUntil(null);
    setSessionExpired(expired);
    setNotice(expired ? "" : "로그아웃 되었습니다.");
    navigate("login");
  };

  // Login page (no shell) — OTP step도 이 안에서 처리
  if (effectiveRoute === "login") {
    return (
      <main className="auth-shell">
        <section className="auth-layout">
          <LoginView
            onLogin={onLogin}
            onForgotPassword={() => navigate("forgot-password")}
            pendingEmail={pendingOtpEmail}
            onOtpVerified={onOtpVerified}
            onOtpCancel={onOtpCancel}
            otpApiError={otpApiError}
            loginError={loginError}
            loginAttempts={loginAttempts}
            isLocked={isLocked}
            sessionExpired={sessionExpired}
          />
        </section>
      </main>
    );
  }

  // 비밀번호 찾기 (no shell)
  if (effectiveRoute === "forgot-password") {
    return (
      <ForgotPasswordView
        onBack={() => navigate("login")}
        onRecovered={() => {
          setNotice("비밀번호가 복구되었습니다. 새 비밀번호로 로그인하세요.");
          navigate("login");
        }}
      />
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
        route={effectiveRoute}
        isAdmin={isAdmin}
        currentUser={currentUser}
        notice={notice}
        onNavigate={navigate}
        onLogout={onLogout}
        onOpenSettings={() => setIsSettingsOpen(true)}
      >
        {effectiveRoute === "home" && (
          <HomeView
            isAdmin={isAdmin}
            isFirstVisit={isFirstVisit}
            onDismissFirstVisit={onDismissFirstVisit}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onNavigateAdmin={() => navigate("admin")}
          />
        )}
        {effectiveRoute === "marketplace" && <MarketplaceView />}
        {effectiveRoute === "admin" && (
          <AdminView
            isPinVerified={isPinVerified}
            onRequestPin={() => setIsPinModalOpen(true)}
          />
        )}
        {/* ── 모듈 뷰 ────────────────────────────────────── */}
        {effectiveRoute === "ledger" && <LedgerView />}
        {isSettingsOpen && (
          <SettingsView
            theme={theme}
            onThemeChange={handleThemeChange}
            initialStartupRoute={startupRoute}
            onStartupRouteChange={onStartupRouteChange}
            onClose={() => setIsSettingsOpen(false)}
            onSaved={() => setNotice("설정이 저장되었습니다.")}
          />
        )}
      </AppShell>
    </>
  );
}

// ─── Setup Status Check ───────────────────────────────────────
type SetupStatus = "checking" | "required" | "done";

function AppRoot() {
  const [setupStatus, setSetupStatus] = useState<SetupStatus>("checking");

  useEffect(() => {
    let cancelled = false;

    const check = async (attempt = 0): Promise<void> => {
      if (cancelled) return;
      try {
        const res = await fetch("/setup/status");
        const json = await res.json() as { success: boolean; data?: { installed?: boolean } };
        if (!cancelled) {
          setSetupStatus(json.data?.installed === false ? "required" : "done");
        }
      } catch {
        // API 아직 미준비(ECONNREFUSED) — 최대 5회까지 600ms 간격으로 재시도
        if (attempt < 5 && !cancelled) {
          await new Promise<void>((r) => setTimeout(r, 600));
          return check(attempt + 1);
        }
        if (!cancelled) setSetupStatus("done");
      }
    };

    void check();
    return () => { cancelled = true; };
  }, []);

  if (setupStatus === "checking") {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span className="setup-spinner" style={{ width: 24, height: 24, borderWidth: 3 }} />
      </div>
    );
  }

  if (setupStatus === "required") {
    return (
      <SetupWizardView onComplete={() => setSetupStatus("done")} />
    );
  }

  return <App />;
}

// ─── Bootstrap ────────────────────────────────────────────────
console.log("Fieldstack Web bootstrap initialized");

const appRootElement = document.querySelector<HTMLDivElement>("#app");
if (appRootElement === null) {
  throw new Error("App root element '#app' was not found.");
}

createRoot(appRootElement).render(<AppRoot />);
