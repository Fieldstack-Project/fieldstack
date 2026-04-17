import { type ChangeEvent, type FormEvent, useEffect, useRef, useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type DbProvider = "postgres" | "sqlite";
type RuntimeId = "docker" | "systemd" | "native";
type RuntimeStatus = "ready" | "installed_not_running" | "not_installed";

interface RuntimeOption {
  id: RuntimeId;
  label: string;
  description: string;
  status: RuntimeStatus;
  canAutoProvision: boolean;
  details: Record<string, unknown>;
}

type WizardStep = "welcome" | "config" | "progress" | "complete";

type SetupStep =
  | "db_connect"
  | "db_migrate"
  | "admin_create"
  | "config_save"
  | "lock_write"
  | "restart";

const STEP_LABELS: Record<SetupStep, string> = {
  db_connect: "데이터베이스 연결",
  db_migrate: "스키마 마이그레이션",
  admin_create: "관리자 계정 생성",
  config_save: "설정 저장",
  lock_write: "설치 완료 처리",
  restart: "서버 재시작",
};

interface ProgressEntry {
  step: SetupStep;
  status: "idle" | "running" | "done" | "error";
  message: string;
}

// ─── API helpers ──────────────────────────────────────────────────────────────

const API_BASE = "";

async function detectRuntimes(): Promise<{ runtimes: RuntimeOption[] }> {
  const res = await fetch(`${API_BASE}/setup/db/detect`);
  if (!res.ok) throw new Error("런타임 감지에 실패했습니다.");
  const json = await res.json() as { success: boolean; data: { runtimes: RuntimeOption[] } };
  return json.data;
}

async function testDbConnection(
  provider: DbProvider,
  url?: string,
  sqlitePath?: string,
): Promise<void> {
  const res = await fetch(`${API_BASE}/setup/db/test`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ provider, url, sqlitePath }),
  });
  if (!res.ok) {
    const err = await res.json() as { error?: string };
    throw new Error(err.error ?? "연결 테스트에 실패했습니다.");
  }
}

// ─── Step indicators ──────────────────────────────────────────────────────────

const WIZARD_STEPS: WizardStep[] = ["welcome", "config", "progress", "complete"];

function StepDots({ current }: { current: WizardStep }) {
  const labels = ["시작", "구성", "설치", "완료"];
  return (
    <div className="setup-steps">
      {WIZARD_STEPS.map((s, i) => {
        const idx = WIZARD_STEPS.indexOf(current);
        const cls =
          i < idx ? "done" : i === idx ? "active" : "";
        return <div key={s} className={`setup-step-dot ${cls}`} />;
      })}
      <span className="setup-step-label">{labels[WIZARD_STEPS.indexOf(current)]}</span>
    </div>
  );
}

// ─── Step 1: Welcome ──────────────────────────────────────────────────────────

function WelcomeStep({ onNext }: { onNext: () => void }) {
  return (
    <>
      <div className="setup-welcome">
        <div className="setup-welcome-hero">
          <h2 className="setup-title">Fieldstack에 오신 것을 환영합니다</h2>
          <p className="setup-desc">
            몇 가지 설정만 완료하면 바로 사용할 수 있습니다.
            설치는 약 1~2분 내에 완료됩니다.
          </p>
        </div>
        <div className="setup-feature-list">
          <div className="setup-feature-item">
            <span className="setup-feature-item-icon">✓</span>
            <span>PostgreSQL 데이터베이스 자동 설치 및 구성 (Docker 지원)</span>
          </div>
          <div className="setup-feature-item">
            <span className="setup-feature-item-icon">✓</span>
            <span>관리자 계정 및 PIN 설정</span>
          </div>
          <div className="setup-feature-item">
            <span className="setup-feature-item-icon">✓</span>
            <span>모듈별 기능 활성화 및 마켓플레이스 연동</span>
          </div>
        </div>
      </div>
      <div className="setup-footer">
        <button className="setup-btn primary" onClick={onNext}>
          설치 시작 →
        </button>
      </div>
    </>
  );
}

// ─── Step 2: Configuration ────────────────────────────────────────────────────

interface ConfigFormData {
  email: string;
  password: string;
  confirmPassword: string;
  pin: string;
  dbProvider: DbProvider;
  postgresUrl: string;
  sqlitePath: string;
  selectedRuntime: RuntimeId | null;
}

interface ConfigStepProps {
  onNext: (data: ConfigFormData) => void;
  onBack: () => void;
}

function ConfigStep({ onNext, onBack }: ConfigStepProps) {
  const [form, setForm] = useState<ConfigFormData>({
    email: "",
    password: "",
    confirmPassword: "",
    pin: "",
    dbProvider: "postgres",
    postgresUrl: "",
    sqlitePath: "./data/database.db",
    selectedRuntime: null,
  });
  const [errors, setErrors] = useState<Partial<Record<keyof ConfigFormData | "general", string>>>({});
  const [runtimes, setRuntimes] = useState<RuntimeOption[] | null>(null);
  const [runtimeLoading, setRuntimeLoading] = useState(false);
  const [runtimeError, setRuntimeError] = useState<string | null>(null);
  const [provisionStatus, setProvisionStatus] = useState<string | null>(null);
  const [provisioning, setProvisioning] = useState(false);
  const [showManualUrl, setShowManualUrl] = useState(false);
  const [testingConn, setTestingConn] = useState(false);
  const [connOk, setConnOk] = useState(false);
  const provisionRef = useRef<AbortController | null>(null);

  const set = <K extends keyof ConfigFormData>(key: K, val: ConfigFormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: val }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
    if (key === "postgresUrl") setConnOk(false);
  };

  // 런타임 감지 (postgres 탭 클릭 시)
  useEffect(() => {
    if (form.dbProvider !== "postgres" || runtimes !== null) return;
    setRuntimeLoading(true);
    setRuntimeError(null);
    detectRuntimes()
      .then(({ runtimes: r }) => {
        setRuntimes(r);
        // 자동으로 가장 좋은 런타임 선택
        const best = r.find((rt) => rt.status === "ready") ?? r[0];
        if (best) set("selectedRuntime", best.id);
      })
      .catch((e: unknown) => {
        setRuntimeError((e as Error).message);
      })
      .finally(() => setRuntimeLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.dbProvider]);

  // DB 자동 프로비저닝 (SSE)
  const handleProvision = async () => {
    if (!form.selectedRuntime) return;
    setProvisioning(true);
    setProvisionStatus("프로비저닝을 시작하는 중...");
    setConnOk(false);
    setErrors((prev) => ({ ...prev, postgresUrl: undefined, general: undefined }));

    const ctrl = new AbortController();
    provisionRef.current = ctrl;

    try {
      const res = await fetch(`${API_BASE}/setup/db/provision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ runtime: form.selectedRuntime }),
        signal: ctrl.signal,
      });

      const reader = res.body?.getReader();
      if (!reader) throw new Error("SSE 스트림을 읽을 수 없습니다.");
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const payload = JSON.parse(line.slice(6)) as {
            step: string;
            status: string;
            message: string;
            connectionUrl?: string;
            error?: string;
          };
          setProvisionStatus(payload.message);
          if (payload.status === "error") {
            setErrors((prev) => ({ ...prev, general: payload.message + (payload.error ? `: ${payload.error}` : "") }));
            setProvisioning(false);
            return;
          }
          if (payload.connectionUrl) {
            set("postgresUrl", payload.connectionUrl);
            setConnOk(true);
          }
        }
      }
    } catch (e: unknown) {
      if ((e as Error).name !== "AbortError") {
        setErrors((prev) => ({ ...prev, general: (e as Error).message }));
      }
    } finally {
      setProvisioning(false);
      provisionRef.current = null;
    }
  };

  // 수동 연결 테스트
  const handleTestConnection = async () => {
    if (!form.postgresUrl) {
      setErrors((prev) => ({ ...prev, postgresUrl: "PostgreSQL URL을 입력해 주세요." }));
      return;
    }
    setTestingConn(true);
    setConnOk(false);
    setErrors((prev) => ({ ...prev, postgresUrl: undefined, general: undefined }));
    try {
      await testDbConnection("postgres", form.postgresUrl);
      setConnOk(true);
    } catch (e: unknown) {
      setErrors((prev) => ({ ...prev, postgresUrl: (e as Error).message }));
    } finally {
      setTestingConn(false);
    }
  };

  const validate = (): boolean => {
    const next: typeof errors = {};
    if (!form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      next.email = "올바른 이메일을 입력해 주세요.";
    }
    if (!form.password || form.password.length < 8) {
      next.password = "비밀번호는 8자 이상이어야 합니다.";
    }
    if (form.password !== form.confirmPassword) {
      next.confirmPassword = "비밀번호가 일치하지 않습니다.";
    }
    if (!form.pin || form.pin.length < 4 || form.pin.length > 12 || !/^\d+$/.test(form.pin)) {
      next.pin = "PIN은 숫자 4~12자리여야 합니다.";
    }
    if (form.dbProvider === "postgres" && !connOk) {
      if (!form.postgresUrl) {
        next.postgresUrl = "PostgreSQL URL을 입력하거나 자동 설치를 완료해 주세요.";
      } else {
        next.postgresUrl = "연결 테스트를 먼저 통과해야 합니다.";
      }
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (validate()) onNext(form);
  };

  const selectedRuntime = runtimes?.find((r) => r.id === form.selectedRuntime);
  const canProvision =
    form.dbProvider === "postgres" &&
    selectedRuntime?.canAutoProvision === true &&
    !provisioning;

  return (
    <form onSubmit={handleSubmit} noValidate>
      {/* 관리자 계정 */}
      <div className="setup-section">
        <div className="setup-section-title">관리자 계정</div>

        <div className="setup-field">
          <label className="setup-label" htmlFor="sw-email">이메일</label>
          <input
            id="sw-email"
            type="email"
            className={`setup-input${errors.email ? " error" : ""}`}
            value={form.email}
            onChange={(e: ChangeEvent<HTMLInputElement>) => set("email", e.target.value)}
            placeholder="admin@example.com"
            autoComplete="email"
          />
          {errors.email && <span className="setup-input-error">{errors.email}</span>}
        </div>

        <div className="setup-field">
          <label className="setup-label" htmlFor="sw-pw">비밀번호</label>
          <input
            id="sw-pw"
            type="password"
            className={`setup-input${errors.password ? " error" : ""}`}
            value={form.password}
            onChange={(e: ChangeEvent<HTMLInputElement>) => set("password", e.target.value)}
            placeholder="8자 이상"
            autoComplete="new-password"
          />
          {errors.password
            ? <span className="setup-input-error">{errors.password}</span>
            : <span className="setup-input-hint">영문·숫자·특수문자 포함 8자 이상 권장</span>}
        </div>

        <div className="setup-field">
          <label className="setup-label" htmlFor="sw-pw2">비밀번호 확인</label>
          <input
            id="sw-pw2"
            type="password"
            className={`setup-input${errors.confirmPassword ? " error" : ""}`}
            value={form.confirmPassword}
            onChange={(e: ChangeEvent<HTMLInputElement>) => set("confirmPassword", e.target.value)}
            placeholder="비밀번호 재입력"
            autoComplete="new-password"
          />
          {errors.confirmPassword && <span className="setup-input-error">{errors.confirmPassword}</span>}
        </div>

        <div className="setup-field">
          <label className="setup-label" htmlFor="sw-pin">관리자 PIN</label>
          <input
            id="sw-pin"
            type="password"
            inputMode="numeric"
            className={`setup-input${errors.pin ? " error" : ""}`}
            value={form.pin}
            onChange={(e: ChangeEvent<HTMLInputElement>) => set("pin", e.target.value.replace(/\D/g, ""))}
            placeholder="숫자 4~12자리"
            maxLength={12}
            autoComplete="new-password"
          />
          {errors.pin
            ? <span className="setup-input-error">{errors.pin}</span>
            : <span className="setup-input-hint">관리자 기능 접근 시 추가 인증에 사용됩니다.</span>}
        </div>
      </div>

      {/* 데이터베이스 */}
      <div className="setup-section">
        <div className="setup-section-title">데이터베이스</div>

        <div className="setup-db-tabs">
          <button
            type="button"
            className={`setup-db-tab${form.dbProvider === "postgres" ? " selected" : ""}`}
            onClick={() => { set("dbProvider", "postgres"); setConnOk(false); }}
          >
            <div className="setup-db-tab-name">PostgreSQL</div>
            <div className="setup-db-tab-desc">권장 · 모든 기능 지원</div>
          </button>
          <button
            type="button"
            className={`setup-db-tab${form.dbProvider === "sqlite" ? " selected" : ""}`}
            onClick={() => set("dbProvider", "sqlite")}
          >
            <div className="setup-db-tab-name">SQLite</div>
            <div className="setup-db-tab-desc">개발·테스트 전용</div>
          </button>
        </div>

        {form.dbProvider === "sqlite" && (
          <>
            <div className="setup-alert warn">
              일부 모듈 기능이 정상적으로 작동하지 않을 수 있습니다.
              프로덕션 환경에서는 PostgreSQL을 사용하세요.
            </div>
            <div className="setup-field">
              <label className="setup-label" htmlFor="sw-sqlite">SQLite 파일 경로</label>
              <input
                id="sw-sqlite"
                type="text"
                className="setup-input"
                value={form.sqlitePath}
                onChange={(e: ChangeEvent<HTMLInputElement>) => set("sqlitePath", e.target.value)}
              />
            </div>
          </>
        )}

        {form.dbProvider === "postgres" && (
          <>
            {/* 런타임 선택 */}
            {runtimeLoading && (
              <p className="setup-input-hint">
                <span className="setup-spinner" /> 사용 가능한 런타임을 감지하는 중...
              </p>
            )}
            {runtimeError && (
              <div className="setup-alert error">{runtimeError}</div>
            )}
            {runtimes && (
              <div className="setup-runtime-list">
                {runtimes.map((rt) => {
                  const badgeCls =
                    rt.status === "ready" ? "ready" :
                    rt.status === "installed_not_running" ? "warn" : "error";
                  const badgeLabel =
                    rt.status === "ready" ? "사용 가능" :
                    rt.status === "installed_not_running" ? "중지됨" : "미설치";
                  return (
                    <div
                      key={rt.id}
                      className={`setup-runtime-item${form.selectedRuntime === rt.id ? " selected" : ""}${!rt.canAutoProvision && rt.status !== "ready" ? " disabled" : ""}`}
                      onClick={() => {
                        if (rt.canAutoProvision || rt.status === "ready") {
                          set("selectedRuntime", rt.id);
                        }
                      }}
                    >
                      <div className="setup-runtime-radio">
                        <div className="setup-runtime-radio-dot" />
                      </div>
                      <div className="setup-runtime-info">
                        <div className="setup-runtime-label">{rt.label}</div>
                        <div className="setup-runtime-desc">{rt.description}</div>
                      </div>
                      <span className={`setup-runtime-badge ${badgeCls}`}>{badgeLabel}</span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* 자동 설치 버튼 */}
            {runtimes && !showManualUrl && (
              <div className="setup-provision-row">
                <button
                  type="button"
                  className="setup-btn-provision"
                  disabled={!canProvision || connOk}
                  onClick={handleProvision}
                >
                  {provisioning ? (
                    <><span className="setup-spinner" /> 설치 중...</>
                  ) : connOk ? "✓ 연결됨" : "자동 설치 및 연결"}
                </button>
                {provisionStatus && (
                  <span className="setup-provision-status">{provisionStatus}</span>
                )}
              </div>
            )}

            {errors.general && (
              <div className="setup-alert error">{errors.general}</div>
            )}

            {/* 수동 URL 입력 토글 */}
            <button
              type="button"
              className="setup-manual-toggle"
              onClick={() => { setShowManualUrl((v) => !v); setConnOk(false); }}
            >
              {showManualUrl ? "▲ 자동 설치로 돌아가기" : "직접 URL 입력하기"}
            </button>

            {showManualUrl && (
              <div className="setup-field">
                <label className="setup-label" htmlFor="sw-pg-url">PostgreSQL URL</label>
                <input
                  id="sw-pg-url"
                  type="text"
                  className={`setup-input${errors.postgresUrl ? " error" : ""}`}
                  value={form.postgresUrl}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => set("postgresUrl", e.target.value)}
                  placeholder="postgresql://user:pass@localhost:5432/db"
                />
                {errors.postgresUrl && <span className="setup-input-error">{errors.postgresUrl}</span>}
                <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                  <button
                    type="button"
                    className="setup-btn-provision"
                    onClick={handleTestConnection}
                    disabled={testingConn}
                  >
                    {testingConn ? <><span className="setup-spinner" /> 테스트 중...</> : "연결 테스트"}
                  </button>
                  {connOk && <span className="setup-provision-status" style={{ color: "var(--ok)" }}>✓ 연결 성공</span>}
                </div>
              </div>
            )}

            {/* 프로비저닝 후 URL 표시 */}
            {!showManualUrl && form.postgresUrl && connOk && (
              <div className="setup-alert ok" style={{ wordBreak: "break-all" }}>
                ✓ 연결 완료: <code style={{ fontSize: "11px" }}>{form.postgresUrl}</code>
              </div>
            )}

            {!showManualUrl && errors.postgresUrl && (
              <div className="setup-alert error">{errors.postgresUrl}</div>
            )}
          </>
        )}
      </div>

      <div className="setup-footer">
        <button type="button" className="setup-btn secondary" onClick={onBack}>
          이전
        </button>
        <button type="submit" className="setup-btn primary">
          설치 시작 →
        </button>
      </div>
    </form>
  );
}

// ─── Step 3: Progress ──────────────────────────────────────────────────────────

const SETUP_STEPS_ORDER: SetupStep[] = [
  "db_connect",
  "db_migrate",
  "admin_create",
  "config_save",
  "lock_write",
  "restart",
];

interface ProgressStepProps {
  entries: ProgressEntry[];
  hasError: boolean;
}

function ProgressStep({ entries, hasError }: ProgressStepProps) {
  const iconFor = (status: ProgressEntry["status"]) => {
    if (status === "done") return "✓";
    if (status === "running") return <span className="setup-spinner" />;
    if (status === "error") return "✗";
    return "·";
  };

  return (
    <>
      <h2 className="setup-title">설치 진행 중</h2>
      <p className="setup-desc">잠시 기다려 주세요. 창을 닫지 마세요.</p>
      <div className="setup-progress-list">
        {SETUP_STEPS_ORDER.map((step) => {
          const entry = entries.find((e) => e.step === step);
          const status = entry?.status ?? "idle";
          return (
            <div key={step} className="setup-progress-item">
              <div className={`setup-progress-icon ${status}`}>
                {iconFor(status)}
              </div>
              <div className="setup-progress-content">
                <div className="setup-progress-step-name">{STEP_LABELS[step]}</div>
                {entry && (
                  <div className="setup-progress-step-msg">{entry.message}</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {hasError && (
        <div className="setup-alert error">
          설치 중 오류가 발생했습니다. 위 오류 메시지를 확인하고 다시 시도해 주세요.
        </div>
      )}
    </>
  );
}

// ─── Step 4: Complete ──────────────────────────────────────────────────────────

function CompleteStep({ onGoLogin }: { onGoLogin: () => void }) {
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((n) => {
        if (n <= 1) {
          clearInterval(timer);
          onGoLogin();
          return 0;
        }
        return n - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [onGoLogin]);

  return (
    <div className="setup-complete">
      <div className="setup-complete-icon">✓</div>
      <h2 className="setup-complete-title">설치가 완료되었습니다!</h2>
      <p className="setup-complete-desc">
        Fieldstack이 성공적으로 설치되었습니다.<br />
        서버가 재시작되면 로그인 페이지로 이동합니다.
      </p>
      <p className="setup-complete-counter">{countdown}초 후 자동으로 이동합니다...</p>
      <button className="setup-btn primary" onClick={onGoLogin}>
        지금 로그인 페이지로 이동
      </button>
    </div>
  );
}

// ─── 새로고침 복구 ────────────────────────────────────────────────────────────

const RECOVERY_KEY = 'fs_setup_recovery';

interface RecoveryData {
  entries: ProgressEntry[];
  hasError: boolean;
}

function saveRecovery(entries: ProgressEntry[], hasError: boolean) {
  try {
    sessionStorage.setItem(RECOVERY_KEY, JSON.stringify({ entries, hasError } satisfies RecoveryData));
  } catch { /* ignore */ }
}

function loadRecovery(): RecoveryData | null {
  try {
    const raw = sessionStorage.getItem(RECOVERY_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as RecoveryData;
  } catch { return null; }
}

function clearRecovery() {
  try { sessionStorage.removeItem(RECOVERY_KEY); } catch { /* ignore */ }
}

// ─── Root Wizard ──────────────────────────────────────────────────────────────

export function SetupWizardView({ onComplete }: { onComplete: () => void }) {
  // 새로고침 시 progress 단계 복원
  const recovered = loadRecovery();

  const [step, setStep] = useState<WizardStep>(recovered ? "progress" : "welcome");
  const [formData, setFormData] = useState<ConfigFormData | null>(null);
  const [progressEntries, setProgressEntries] = useState<ProgressEntry[]>(recovered?.entries ?? []);
  const [hasError, setHasError] = useState(recovered?.hasError ?? false);
  const [isRestored, setIsRestored] = useState(recovered !== null);

  // 복원된 상태: /setup/status 폴링 → 서버가 이미 완료했으면 complete로 이동
  useEffect(() => {
    if (!isRestored) return;
    let cancelled = false;

    const poll = async () => {
      for (let i = 0; i < 8 && !cancelled; i++) {
        try {
          const res = await fetch('/setup/status');
          const json = await res.json() as { success: boolean; data?: { installed?: boolean } };
          if (json.data?.installed === true) {
            clearRecovery();
            setStep('complete');
            return;
          }
        } catch { /* API 아직 재시작 중 */ }
        await new Promise<void>((r) => setTimeout(r, 1500));
      }
      // 폴링 종료 — 설치 상태 미확정: 복구 배너 유지, 유저가 재시도 가능
    };

    void poll();
    return () => { cancelled = true; };
  }, [isRestored]);

  // progress 단계의 상태가 바뀔 때마다 sessionStorage에 저장
  useEffect(() => {
    if (step === 'progress') {
      saveRecovery(progressEntries, hasError);
    }
  }, [step, progressEntries, hasError]);

  const handleConfigNext = (data: ConfigFormData) => {
    setFormData(data);
    setIsRestored(false);
    setStep("progress");
    void runSetup(data);
  };

  const runSetup = async (data: ConfigFormData) => {
    setProgressEntries([]);
    setHasError(false);

    const body = {
      admin: {
        email: data.email,
        password: data.password,
        pin: data.pin,
      },
      db: {
        provider: data.dbProvider,
        url: data.dbProvider === "postgres" ? data.postgresUrl : undefined,
        sqlitePath: data.dbProvider === "sqlite" ? data.sqlitePath : undefined,
      },
    };

    try {
      const res = await fetch(`${API_BASE}/setup/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const reader = res.body?.getReader();
      if (!reader) throw new Error("응답 스트림을 읽을 수 없습니다.");
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const payload = JSON.parse(line.slice(6)) as {
            step: SetupStep;
            status: "running" | "done" | "error";
            message: string;
            error?: string;
          };
          setProgressEntries((prev) => {
            const existing = prev.findIndex((e) => e.step === payload.step);
            const entry: ProgressEntry = {
              step: payload.step,
              status: payload.status,
              message: payload.message + (payload.error ? `: ${payload.error}` : ""),
            };
            if (existing >= 0) {
              return prev.map((e, i) => (i === existing ? entry : e));
            }
            return [...prev, entry];
          });
          if (payload.status === "error") {
            setHasError(true);
            return;
          }
        }
      }

      // 성공 완료 — 복구 데이터 제거 후 complete step으로 이동
      clearRecovery();
      setTimeout(() => setStep("complete"), 1000);
    } catch (e: unknown) {
      setProgressEntries((prev) => [
        ...prev,
        { step: "db_connect", status: "error", message: (e as Error).message },
      ]);
      setHasError(true);
    }
  };

  const handleGoLogin = () => {
    // 서버 재시작 중이므로 새로고침으로 연결
    window.location.href = "/";
  };

  return (
    <div className="setup-shell">
      <div className="setup-card">
        <div className="setup-header">
          <div className="setup-brand">
            <div className="setup-brand-logo">F</div>
            <span className="setup-brand-name">Fieldstack 설치</span>
          </div>
          <StepDots current={step} />
        </div>
        <div className="setup-body">
          {step === "welcome" && (
            <WelcomeStep onNext={() => setStep("config")} />
          )}
          {step === "config" && (
            <ConfigStep
              onNext={handleConfigNext}
              onBack={() => setStep("welcome")}
            />
          )}
          {step === "progress" && (
            <>
              {/* 새로고침/재접속 복구 배너 */}
              {isRestored && (
                <div className="setup-alert warn" style={{ marginBottom: 16 }}>
                  <strong>재접속 감지됨</strong> — 이전 설치 진행 상태를 복원했습니다.
                  서버가 아직 설치 중이라면 자동으로 완료 단계로 이동합니다.
                  설치가 중단된 경우 아래 버튼으로 다시 시도할 수 있습니다.
                </div>
              )}
              <ProgressStep entries={progressEntries} hasError={hasError} />
              {(hasError || isRestored) && (
                <div className="setup-footer">
                  <button
                    className="setup-btn secondary"
                    onClick={() => { clearRecovery(); setIsRestored(false); setStep("config"); }}
                  >
                    ← 구성으로 돌아가기
                  </button>
                  {formData && !isRestored && (
                    <button
                      className="setup-btn primary"
                      onClick={() => { void runSetup(formData); }}
                    >
                      다시 시도
                    </button>
                  )}
                </div>
              )}
            </>
          )}
          {step === "complete" && (
            <CompleteStep onGoLogin={handleGoLogin} />
          )}
        </div>
      </div>
    </div>
  );
}

// ─── re-export form type for main.tsx ─────────────────────────────────────────
export type { ConfigFormData };
