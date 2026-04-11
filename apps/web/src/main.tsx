import { FormEvent, useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";

import "./styles/global.css";
import "./styles/login.css";

import { AppShell, type RouteKey } from "./components/AppShell";
import { HomeView } from "./views/HomeView";
import { LoginView } from "./views/LoginView";
import { SettingsView } from "./views/SettingsView";
import { AdminView } from "./views/AdminView";

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
  if (hash === "settings") {
    return "home";
  }
  if (hash === "home" || hash === "admin" || hash === "login") {
    return hash;
  }
  return "login";
}

function canAccessRoute(route: RouteKey, isAuthenticated: boolean, isAdmin: boolean): boolean {
  if (route === "login") return true;
  if (!isAuthenticated) return false;
  if (route === "admin") return isAdmin;
  return true;
}

// ─── App Root ─────────────────────────────────────────────────
function App({ installMode }: { installMode: InstallMode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
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
    if (canAccessRoute(route, isAuthenticated, isAdmin)) return route;
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

  // Auth handlers
  const onLogin = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsAuthenticated(true);
    setNotice("Login successful (mock).");
    navigate("home");
  };

  const onQuickLogin = () => {
    setIsAuthenticated(true);
    setNotice("");
    navigate("home");
  };

  const onLogout = () => {
    setIsAuthenticated(false);
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

  return (
    <>
      <AppShell
        installMode={installMode}
        route={effectiveRoute}
        isAdmin={isAdmin}
        notice={notice}
        onNavigate={navigate}
        onLogout={onLogout}
        onOpenSettings={() => setIsSettingsOpen(true)}
      >
        {effectiveRoute === "home" && <HomeView onOpenSettings={() => setIsSettingsOpen(true)} />}
        {effectiveRoute === "admin" && <AdminView isAdmin={isAdmin} />}
        {isSettingsOpen && (
          <SettingsView
            isAdmin={isAdmin}
            onClose={() => setIsSettingsOpen(false)}
            onToggleAdmin={() => {
              setIsAdmin((prev) => {
                const next = !prev;
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
