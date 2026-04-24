import { useState, useEffect, useCallback, useRef, type FormEvent } from "react";

import { Button, FormField, Input, PinInput, Select } from "@fieldstack/controls";

import "../styles/admin.css";

import { apiFetch } from "../lib/apiFetch";


// 초기화 플로우 단계
type ResetPhase =
  | "idle"
  | "p-confirm"   // 부분 초기화 확인
  | "p-pin"       // 부분 초기화 PIN 입력
  | "p-done"      // 부분 초기화 완료
  | "f-confirm-1" // 완전 초기화 1차 확인
  | "f-confirm-2" // 완전 초기화 2차 경고
  | "f-pin"       // 완전 초기화 PIN 입력
  | "f-done";     // 완전 초기화 완료 (서버 재시작 예정)

interface ModuleInfo {
  name: string;
  basePath: string;
  version: string;
  dependencies: string[];
}

interface AdminViewProps {
  isPinVerified: boolean;
  onRequestPin: () => void;
}

const MOCK_STATS = [
  { label: "활성 사용자", value: "1", detail: "허용 목록 기준" },
  { label: "권한 요청", value: "2", detail: "검토 필요" },
  { label: "시스템 상태", value: "정상", detail: "마지막 체크 1m" },
];

const ADMIN_SECTIONS = [
  { id: "overview", icon: "⊟",  name: "개요",           desc: "시스템 상태 및 통계" },
  { id: "users",    icon: "👥", name: "사용자 관리",      desc: "Whitelist 추가·제거, 역할 관리" },
  { id: "modules",  icon: "📦", name: "모듈 레지스트리",  desc: "모듈 활성화·비활성화, 버전 관리" },
  { id: "tunnel",   icon: "🌐", name: "터널",            desc: "Cloudflare Tunnel 외부 접근 설정" },
  { id: "system",   icon: "🗄️", name: "시스템 설정",     desc: "DB 설정, 업데이트, 백업" },
  { id: "security", icon: "🔐", name: "보안 설정",        desc: "PIN 변경, 세션 정책" },
  { id: "audit",    icon: "📋", name: "감사 로그",        desc: "PIN 실패, 주요 설정 변경 이력" },
];

type AuditType = "login" | "settings" | "pin";
type AuditFilter = "all" | AuditType;

const MOCK_AUDIT_LOG: { id: number; type: AuditType; text: string; time: string; dot: "ok" | "warn" | "info" }[] = [
  { id: 1,  type: "login",    text: "관리자 로그인 성공",              time: "방금 전",   dot: "ok"   },
  { id: 2,  type: "settings", text: "권한 변경 요청 감지",             time: "3분 전",   dot: "warn" },
  { id: 3,  type: "settings", text: "설정 저장 이벤트",                time: "12분 전",  dot: "info" },
  { id: 4,  type: "pin",      text: "PIN 인증 성공",                  time: "14분 전",  dot: "ok"   },
  { id: 5,  type: "login",    text: "사용자 로그인 성공",               time: "28분 전",  dot: "ok"   },
  { id: 6,  type: "pin",      text: "PIN 인증 실패 (1/5)",            time: "45분 전",  dot: "warn" },
  { id: 7,  type: "settings", text: "모듈 설정 변경",                  time: "1시간 전", dot: "info" },
  { id: 8,  type: "login",    text: "로그인 실패 — 잘못된 비밀번호",     time: "2시간 전", dot: "warn" },
  { id: 9,  type: "settings", text: "테마 설정 변경 (dark)",           time: "3시간 전", dot: "info" },
  { id: 10, type: "pin",      text: "관리자 세션 만료",                 time: "4시간 전", dot: "warn" },
];

const AUDIT_FILTER_LABELS: Record<AuditFilter, string> = {
  all:      "전체",
  login:    "로그인",
  settings: "설정 변경",
  pin:      "PIN",
};

type TunnelMode = "quick" | "named";
type ActiveSection = "overview" | "users" | "modules" | "tunnel" | "system" | "security" | "audit";

export function AdminView({ isPinVerified, onRequestPin }: AdminViewProps) {
  const [activeSection, setActiveSection] = useState<ActiveSection>("overview");

  // 모듈 레지스트리 상태
  const [modules, setModules] = useState<ModuleInfo[]>([]);
  const [modulesLoading, setModulesLoading] = useState(false);
  const [modulesError, setModulesError] = useState<string | null>(null);
  const [reloadMessage, setReloadMessage] = useState<string | null>(null);
  const [reloading, setReloading] = useState(false);

  // 감사 로그 필터
  const [auditFilter, setAuditFilter] = useState<AuditFilter>("all");

  // PIN 변경 폼
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [pinError, setPinError] = useState("");
  const [pinSuccess, setPinSuccess] = useState(false);

  // 터널
  const [tunnelRunning, setTunnelRunning] = useState(false);
  const [tunnelUrl, setTunnelUrl] = useState<string | null>(null);
  const [tunnelMode, setTunnelMode] = useState<TunnelMode>("quick");
  const [tunnelToken, setTunnelToken] = useState("");
  const [tunnelLoading, setTunnelLoading] = useState(false);
  const [tunnelError, setTunnelError] = useState<string | null>(null);
  const [tunnelCopied, setTunnelCopied] = useState(false);
  const tunnelCopyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 초기화 플로우
  const [resetPhase, setResetPhase] = useState<ResetPhase>("idle");
  const [resetPin, setResetPin] = useState("");
  const [resetPinError, setResetPinError] = useState("");
  const [isResetting, setIsResetting] = useState(false);
  const [isPinChanging, setIsPinChanging] = useState(false);

  // 모듈 목록 조회
  const fetchModules = useCallback(async () => {
    setModulesLoading(true);
    setModulesError(null);
    try {
      const res = await apiFetch("/core/modules");
      type Resp = { success: boolean; error?: string; data?: { modules: ModuleInfo[] } };
      const json = await res.json() as Resp;
      if (!res.ok || !json.success) {
        setModulesError(json.error ?? "모듈 목록 조회 실패");
        return;
      }
      setModules(json.data?.modules ?? []);
    } catch {
      setModulesError("서버 연결 실패");
    } finally {
      setModulesLoading(false);
    }
  }, []);

  // 모듈 섹션 진입 시 목록 로드
  useEffect(() => {
    if (activeSection === "modules") {
      void fetchModules();
    }
  }, [activeSection, fetchModules]);

  // 터널 섹션 진입 시 상태 로드
  useEffect(() => {
    if (activeSection !== "tunnel") return;
    void (async () => {
      try {
        const [statusRes, configRes] = await Promise.all([
          apiFetch("/admin/tunnel/status"),
          apiFetch("/admin/tunnel/config"),
        ]);
        type StatusResp = { success: boolean; data: { running: boolean; url: string | null; mode: TunnelMode | null } };
        type ConfigResp = { success: boolean; data: { mode: TunnelMode; token: string } };
        const status = await statusRes.json() as StatusResp;
        const config = await configRes.json() as ConfigResp;
        if (status.success) {
          setTunnelRunning(status.data.running);
          setTunnelUrl(status.data.url);
        }
        if (config.success) {
          setTunnelMode(config.data.mode);
          setTunnelToken(config.data.token);
        }
      } catch { /* 무시 */ }
    })();
  }, [activeSection]);

  const handleTunnelSaveConfig = async () => {
    await apiFetch("/admin/tunnel/config", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: tunnelMode, token: tunnelToken }),
    });
  };

  const handleTunnelStart = async () => {
    setTunnelLoading(true);
    setTunnelError(null);
    try {
      await handleTunnelSaveConfig();
      const res = await apiFetch("/admin/tunnel/start", { method: "POST" });
      type Resp = { success: boolean; data?: { url: string }; error?: string };
      const json = await res.json() as Resp;
      if (!json.success) { setTunnelError(json.error ?? "시작 실패"); return; }
      setTunnelRunning(true);
      setTunnelUrl(json.data?.url ?? null);
    } catch {
      setTunnelError("서버 연결 실패");
    } finally {
      setTunnelLoading(false);
    }
  };

  const handleTunnelStop = async () => {
    setTunnelLoading(true);
    setTunnelError(null);
    try {
      await apiFetch("/admin/tunnel/stop", { method: "POST" });
      setTunnelRunning(false);
      setTunnelUrl(null);
    } catch {
      setTunnelError("서버 연결 실패");
    } finally {
      setTunnelLoading(false);
    }
  };

  const handleTunnelCopy = () => {
    if (!tunnelUrl) return;
    const doCopy = async () => {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(tunnelUrl);
      } else {
        // HTTP 또는 IP 주소 접근 시 fallback
        const el = document.createElement('textarea');
        el.value = tunnelUrl;
        el.style.position = 'fixed';
        el.style.opacity = '0';
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
      }
      setTunnelCopied(true);
      if (tunnelCopyTimer.current) clearTimeout(tunnelCopyTimer.current);
      tunnelCopyTimer.current = setTimeout(() => setTunnelCopied(false), 2000);
    };
    void doCopy();
  };

  const handleModuleReload = async () => {
    setReloading(true);
    setReloadMessage(null);
    try {
      const res = await apiFetch("/core/modules/reload", { method: "POST" });
      type Resp = { success: boolean; error?: string; data?: { message: string } };
      const json = await res.json() as Resp;
      if (!res.ok || !json.success) {
        setReloadMessage(`오류: ${json.error ?? "갱신 실패"}`);
        return;
      }
      setReloadMessage(json.data?.message ?? "갱신 완료");
      void fetchModules();
    } catch {
      setReloadMessage("서버 연결 실패");
    } finally {
      setReloading(false);
    }
  };

  const resetPinForm = () => {
    setCurrentPin("");
    setNewPin("");
    setConfirmPin("");
    setPinError("");
    setPinSuccess(false);
  };

  const resetResetFlow = () => {
    setResetPhase("idle");
    setResetPin("");
    setResetPinError("");
  };

  const handleSectionClick = (id: string) => {
    const next = id as ActiveSection;
    setActiveSection(next);
    if (next !== "security") resetPinForm();
    if (next !== "audit") setAuditFilter("all");
    if (next !== "system") resetResetFlow();
  };

  const handlePartialResetSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (isResetting) return;
    setIsResetting(true);
    setResetPinError("");
    try {
      const res = await apiFetch("/admin/partial-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: resetPin }),
      });
      const json = await res.json() as { success: boolean; error?: string };
      if (!res.ok || !json.success) {
        setResetPinError(json.error ?? "초기화 실패");
        setResetPin("");
        return;
      }
      setResetPhase("p-done");
    } catch {
      setResetPinError("서버 연결 오류");
    } finally {
      setIsResetting(false);
    }
  };

  const handleFactoryResetSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (isResetting) return;
    setIsResetting(true);
    setResetPinError("");
    try {
      const res = await apiFetch("/admin/factory-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: resetPin }),
      });
      const json = await res.json() as { success: boolean; error?: string };
      if (!res.ok || !json.success) {
        setResetPinError(json.error ?? "초기화 실패");
        setResetPin("");
        return;
      }
      setResetPhase("f-done");
    } catch {
      setResetPinError("서버 연결 오류");
    } finally {
      setIsResetting(false);
    }
  };

  const handlePinChange = async (e: FormEvent) => {
    e.preventDefault();
    if (isPinChanging) return;
    if (newPin.length < 4) { setPinError("새 PIN은 4자리 이상이어야 합니다."); return; }
    if (newPin !== confirmPin) { setPinError("새 PIN이 일치하지 않습니다."); setConfirmPin(""); return; }
    setIsPinChanging(true);
    setPinError("");
    try {
      const res = await apiFetch("/admin/change-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPin, newPin }),
      });
      const json = await res.json() as { success: boolean; error?: string };
      if (!res.ok || !json.success) {
        setPinError(json.error ?? "PIN 변경 실패");
        setCurrentPin("");
        return;
      }
      setPinSuccess(true);
    } catch {
      setPinError("서버 연결 오류");
    } finally {
      setIsPinChanging(false);
    }
  };

  if (!isPinVerified) {
    return (
      <section className="panel admin-root" aria-labelledby="admin-gate-title">
        <div className="admin-lock-wrap">
          <div className="admin-lock-icon" aria-hidden="true">🔒</div>
          <h1 className="admin-lock-title" id="admin-gate-title">
            Admin 인증이 필요합니다
          </h1>
          <p className="admin-lock-desc">
            관리자 콘솔은 PIN Step-up 인증 이후에만 접근 가능합니다.
          </p>
          <Button variant="primary" type="button" onClick={onRequestPin}>
            PIN 인증하기
          </Button>
        </div>
      </section>
    );
  }

  const filteredAuditLog = auditFilter === "all"
    ? MOCK_AUDIT_LOG
    : MOCK_AUDIT_LOG.filter((item) => item.type === auditFilter);

  return (
    <div className="admin-page">
      {/* ── 왼쪽 탭 네비게이션 ─────────────────────────────── */}
      <nav className="admin-tabs" aria-label="관리자 설정 섹션">
        <p className="admin-tabs-label">Admin</p>
        {ADMIN_SECTIONS.map((section) => (
          <button
            key={section.id}
            type="button"
            className="admin-tabs-item"
            aria-current={activeSection === section.id ? "page" : undefined}
            onClick={() => handleSectionClick(section.id)}
          >
            <span className="admin-tabs-item-icon" aria-hidden="true">{section.icon}</span>
            <span className="admin-tabs-item-label">{section.name}</span>
          </button>
        ))}
      </nav>

      {/* ── 오른쪽 콘텐츠 ──────────────────────────────────── */}
      <div className="admin-content">

        {/* 개요 */}
        {activeSection === "overview" && (
          <>
            <div className="admin-content-header">
              <div>
                <p className="admin-kicker">Operations Console</p>
                <h1 className="admin-content-title" id="admin-title">Admin</h1>
              </div>
              <span className="admin-badge">Verified Admin</span>
            </div>

            <div className="admin-stats-grid">
              {MOCK_STATS.map((stat) => (
                <div key={stat.label} className="admin-stat-card">
                  <p className="admin-stat-label">{stat.label}</p>
                  <p className="admin-stat-value">{stat.value}</p>
                  <p className="admin-stat-detail">{stat.detail}</p>
                </div>
              ))}
            </div>

            <div>
              <h2 className="admin-block-title" style={{ marginBottom: "10px" }}>최근 감사 로그</h2>
              <ul className="admin-audit-list" aria-label="감사 로그">
                {MOCK_AUDIT_LOG.slice(0, 4).map((item) => (
                  <li key={item.id} className="admin-audit-item">
                    <span className={`admin-audit-dot admin-audit-dot-${item.dot}`} aria-hidden="true" />
                    <span>
                      {item.text}
                      <br />
                      <span className="admin-audit-time">{item.time}</span>
                    </span>
                  </li>
                ))}
              </ul>
              <Button size="sm" type="button" style={{ marginTop: "10px" }} onClick={() => handleSectionClick("audit")}>
                전체 로그 보기 →
              </Button>
            </div>
          </>
        )}

        {/* 사용자 관리 */}
        {activeSection === "users" && (
          <>
            <div className="admin-content-header">
              <h1 className="admin-content-title">사용자 관리</h1>
            </div>
            <div className="admin-panel-placeholder">
              <p className="admin-panel-placeholder-icon" aria-hidden="true">🚧</p>
              <p className="admin-panel-placeholder-title">사용자 관리 — 준비 중</p>
              <p className="admin-panel-placeholder-desc">Phase 2에서 구현 예정입니다.</p>
            </div>
          </>
        )}

        {/* 모듈 레지스트리 */}
        {activeSection === "modules" && (
          <>
            <div className="admin-content-header">
              <h1 className="admin-content-title">모듈 레지스트리</h1>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <Button size="sm" type="button" onClick={() => void handleModuleReload()} disabled={reloading}>
                  {reloading ? "갱신 중..." : "모듈 새로고침"}
                </Button>
                {reloadMessage && (
                  <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>{reloadMessage}</span>
                )}
              </div>
            </div>

            {modulesLoading && (
              <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>목록 불러오는 중...</p>
            )}
            {modulesError && (
              <p style={{ fontSize: "13px", color: "var(--err)" }}>{modulesError}</p>
            )}
            {!modulesLoading && !modulesError && modules.length === 0 && (
              <div className="admin-panel-placeholder">
                <p className="admin-panel-placeholder-icon" aria-hidden="true">📦</p>
                <p className="admin-panel-placeholder-title">설치된 모듈 없음</p>
                <p className="admin-panel-placeholder-desc">
                  modules/ 디렉터리에 모듈을 추가하고 새로고침을 누르세요.
                </p>
              </div>
            )}
            {modules.length > 0 && (
              <ul className="admin-module-list">
                {modules.map((mod) => (
                  <li key={mod.name} className="admin-module-item">
                    <div className="admin-module-item-header">
                      <span className="admin-module-name">{mod.name}</span>
                      <span className="admin-module-version">v{mod.version}</span>
                    </div>
                    <span className="admin-module-path">경로: {mod.basePath}</span>
                    {mod.dependencies.length > 0 && (
                      <span className="admin-module-path">의존: {mod.dependencies.join(", ")}</span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </>
        )}

        {/* 터널 */}
        {activeSection === "tunnel" && (
          <>
            <div className="admin-content-header">
              <h1 className="admin-content-title">Cloudflare Tunnel</h1>
              <span className={`admin-badge ${tunnelRunning ? "admin-badge-ok" : ""}`}>
                {tunnelRunning ? "실행 중" : "중지됨"}
              </span>
            </div>

            {/* 모드 선택 */}
            <div className="admin-tunnel-section">
              <p className="admin-panel-sub-title">터널 모드</p>
              <FormField label="모드 선택">
                <Select
                  value={tunnelMode}
                  options={[
                    { value: "quick", label: "Quick Tunnel (임시 URL, 토큰 불필요)" },
                    { value: "named", label: "Named Tunnel (Zero Trust, 도메인 고정)" },
                  ]}
                  onChange={(e) => setTunnelMode(e.target.value as TunnelMode)}
                  disabled={tunnelRunning}
                />
              </FormField>

              {tunnelMode === "named" && (
                <FormField label="터널 토큰" helpText="Cloudflare Zero Trust 대시보드에서 발급한 토큰">
                  <Input
                    type="password"
                    value={tunnelToken}
                    onChange={(e) => setTunnelToken(e.target.value)}
                    placeholder="eyJ..."
                    disabled={tunnelRunning}
                  />
                </FormField>
              )}
            </div>

            {/* URL 표시 */}
            {tunnelRunning && tunnelUrl && (
              <div className="admin-tunnel-url-box">
                <span className="admin-tunnel-url-label">접속 URL</span>
                <div className="admin-tunnel-url-row">
                  <code className="admin-tunnel-url">{tunnelUrl}</code>
                  <Button size="sm" type="button" onClick={handleTunnelCopy}>
                    {tunnelCopied ? "복사됨 ✓" : "복사"}
                  </Button>
                </div>
              </div>
            )}

            {tunnelError && (
              <p style={{ fontSize: "13px", color: "var(--err)", margin: "0" }}>{tunnelError}</p>
            )}

            {/* 시작/중지 버튼 */}
            <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
              {!tunnelRunning ? (
                <Button
                  variant="primary"
                  type="button"
                  onClick={() => void handleTunnelStart()}
                  disabled={tunnelLoading || (tunnelMode === "named" && !tunnelToken)}
                  loading={tunnelLoading}
                >
                  터널 시작
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={() => void handleTunnelStop()}
                  disabled={tunnelLoading}
                  loading={tunnelLoading}
                >
                  터널 중지
                </Button>
              )}
            </div>

            <p className="admin-tunnel-notice">
              Quick Tunnel은 서버 재시작 시 URL이 변경됩니다.<br />
              고정 URL이 필요하면 Named Tunnel(Zero Trust)을 사용하세요.
            </p>
          </>
        )}

        {/* 시스템 설정 */}
        {activeSection === "system" && (
          <>
            <div className="admin-content-header">
              <h1 className="admin-content-title">시스템 설정</h1>
            </div>

            {/* 부분 초기화 */}
            <div className="admin-reset-zone admin-reset-zone-warn">
              <div className="admin-reset-zone-header">
                <div className="admin-reset-zone-info">
                  <p className="admin-reset-zone-title">부분 초기화</p>
                  <p className="admin-reset-zone-desc">
                    공유 링크 등 데이터를 삭제합니다.<br />
                    계정·설정·whitelist는 유지됩니다.
                  </p>
                </div>
                {resetPhase === "idle" && (
                  <Button size="sm" type="button" onClick={() => setResetPhase("p-confirm")}>
                    초기화
                  </Button>
                )}
              </div>

              {resetPhase === "p-confirm" && (
                <div className="admin-reset-confirm">
                  <p className="admin-reset-confirm-text">
                    공유 링크 데이터가 모두 삭제됩니다.<br />계속하시겠습니까?
                  </p>
                  <div className="admin-reset-actions">
                    <Button size="sm" type="button" onClick={resetResetFlow}>취소</Button>
                    <Button size="sm" variant="primary" type="button"
                      onClick={() => { setResetPin(""); setResetPhase("p-pin"); }}>
                      계속
                    </Button>
                  </div>
                </div>
              )}

              {resetPhase === "p-pin" && (
                <div className="admin-reset-confirm">
                  <form onSubmit={handlePartialResetSubmit} noValidate style={{ display: "grid", gap: "10px" }}>
                    <FormField label="관리자 PIN 확인" htmlFor="reset-p-pin">
                      <PinInput length={4} value={resetPin}
                        onChange={(v: string) => { setResetPin(v); setResetPinError(""); }} />
                    </FormField>
                    {resetPinError && <p className="admin-pin-error" role="alert">{resetPinError}</p>}
                    <div className="admin-reset-actions">
                      <Button size="sm" type="button" onClick={resetResetFlow}>취소</Button>
                      <Button size="sm" variant="primary" type="submit" disabled={resetPin.length < 4}>
                        초기화 실행
                      </Button>
                    </div>
                  </form>
                </div>
              )}

              {resetPhase === "p-done" && (
                <div className="admin-reset-done admin-reset-done-ok">
                  <p className="admin-reset-done-icon" aria-hidden="true">✓</p>
                  <p className="admin-reset-done-title">부분 초기화 완료</p>
                  <p className="admin-reset-done-desc">데이터가 삭제되었습니다.</p>
                  <Button size="sm" type="button" onClick={resetResetFlow}>닫기</Button>
                </div>
              )}
            </div>

            {/* 완전 초기화 */}
            {(resetPhase === "idle" ||
              resetPhase === "f-confirm-1" ||
              resetPhase === "f-confirm-2" ||
              resetPhase === "f-pin" ||
              resetPhase === "f-done") && (
              <div className="admin-reset-zone admin-reset-zone-danger">
                <div className="admin-reset-zone-header">
                  <div className="admin-reset-zone-info">
                    <p className="admin-reset-zone-title">완전 초기화</p>
                    <p className="admin-reset-zone-desc">
                      모든 데이터·계정·설정이 삭제됩니다.<br />
                      앱이 최초 설치 상태로 돌아갑니다.
                    </p>
                  </div>
                  {resetPhase === "idle" && (
                    <Button size="sm" variant="danger" type="button" onClick={() => setResetPhase("f-confirm-1")}>
                      초기화
                    </Button>
                  )}
                </div>

                {resetPhase === "f-confirm-1" && (
                  <div className="admin-reset-confirm">
                    <p className="admin-reset-confirm-text">
                      완전 초기화를 진행하겠습니까?<br />
                      모든 사용자 계정과 데이터가 삭제됩니다.
                    </p>
                    <div className="admin-reset-actions">
                      <Button size="sm" type="button" onClick={resetResetFlow}>취소</Button>
                      <Button size="sm" variant="danger" type="button" onClick={() => setResetPhase("f-confirm-2")}>
                        계속
                      </Button>
                    </div>
                  </div>
                )}

                {resetPhase === "f-confirm-2" && (
                  <div className="admin-reset-confirm">
                    <p className="admin-reset-confirm-text">
                      <strong>이 작업은 되돌릴 수 없습니다.</strong><br />
                      서버는 Setup 모드로 재시작됩니다.<br />
                      정말 진행하시겠습니까?
                    </p>
                    <div className="admin-reset-actions">
                      <Button size="sm" type="button" onClick={resetResetFlow}>취소</Button>
                      <Button size="sm" variant="danger" type="button"
                        onClick={() => { setResetPin(""); setResetPhase("f-pin"); }}>
                        PIN으로 확인
                      </Button>
                    </div>
                  </div>
                )}

                {resetPhase === "f-pin" && (
                  <div className="admin-reset-confirm">
                    <form onSubmit={handleFactoryResetSubmit} noValidate style={{ display: "grid", gap: "10px" }}>
                      <FormField label="관리자 PIN 입력" htmlFor="reset-f-pin">
                        <PinInput length={4} value={resetPin}
                          onChange={(v: string) => { setResetPin(v); setResetPinError(""); }} />
                      </FormField>
                      {resetPinError && <p className="admin-pin-error" role="alert">{resetPinError}</p>}
                      <div className="admin-reset-actions">
                        <Button size="sm" type="button" onClick={resetResetFlow}>취소</Button>
                        <Button size="sm" variant="danger" type="submit" disabled={resetPin.length < 4}>
                          완전 초기화 실행
                        </Button>
                      </div>
                    </form>
                  </div>
                )}

                {resetPhase === "f-done" && (
                  <div className="admin-reset-done" style={{ borderColor: "rgba(239,68,68,0.25)", background: "rgba(239,68,68,0.06)" }}>
                    <p className="admin-reset-done-icon" aria-hidden="true">⚠</p>
                    <p className="admin-reset-done-title" style={{ color: "var(--err)" }}>완전 초기화 완료</p>
                    <p className="admin-reset-done-desc">서버가 재시작됩니다.</p>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* 보안 설정 */}
        {activeSection === "security" && (
          <>
            <div className="admin-content-header">
              <h1 className="admin-content-title">보안 설정</h1>
            </div>
            <p className="admin-panel-sub-title">관리자 PIN 변경</p>

            {pinSuccess ? (
              <div className="admin-pin-success">
                <p className="admin-pin-success-icon" aria-hidden="true">✓</p>
                <p className="admin-pin-success-title">PIN이 변경되었습니다</p>
                <p className="admin-pin-success-desc">다음 로그인 시 새 PIN을 사용합니다.</p>
                <Button size="sm" type="button" onClick={resetPinForm}>다시 변경</Button>
              </div>
            ) : (
              <form className="admin-pin-form" onSubmit={handlePinChange} noValidate>
                <FormField label="현재 PIN" htmlFor="pin-current">
                  <PinInput length={4} value={currentPin}
                    onChange={(val: string) => { setCurrentPin(val); setPinError(""); }} />
                </FormField>
                <FormField label="새 PIN" htmlFor="pin-new">
                  <PinInput length={4} value={newPin}
                    onChange={(val: string) => { setNewPin(val); setPinError(""); }} />
                </FormField>
                <FormField label="새 PIN 확인" htmlFor="pin-confirm">
                  <PinInput length={4} value={confirmPin}
                    onChange={(val: string) => { setConfirmPin(val); setPinError(""); }} />
                </FormField>
                {pinError && <p className="admin-pin-error" role="alert">{pinError}</p>}
                <Button variant="primary" type="submit"
                  disabled={currentPin.length < 4 || newPin.length < 4 || confirmPin.length < 4 || isPinChanging}
                  loading={isPinChanging}>
                  PIN 변경
                </Button>
              </form>
            )}
          </>
        )}

        {/* 감사 로그 */}
        {activeSection === "audit" && (
          <>
            <div className="admin-content-header">
              <h1 className="admin-content-title">감사 로그</h1>
              <div className="admin-audit-filters" role="group" aria-label="로그 필터">
                {(["all", "login", "settings", "pin"] as AuditFilter[]).map((f) => (
                  <button key={f} type="button" className="admin-audit-filter-btn"
                    aria-pressed={auditFilter === f} onClick={() => setAuditFilter(f)}>
                    {AUDIT_FILTER_LABELS[f]}
                  </button>
                ))}
              </div>
            </div>

            {filteredAuditLog.length > 0 ? (
              <ul className="admin-audit-list" aria-label="감사 로그 목록">
                {filteredAuditLog.map((item) => (
                  <li key={item.id} className="admin-audit-item">
                    <span className={`admin-audit-dot admin-audit-dot-${item.dot}`} aria-hidden="true" />
                    <span>
                      {item.text}
                      <br />
                      <span className="admin-audit-time">{item.time}</span>
                    </span>
                    <span className="admin-audit-type-badge">
                      {item.type === "login" ? "로그인" : item.type === "settings" ? "설정" : "PIN"}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="admin-panel-empty">해당 필터에 맞는 로그가 없습니다.</p>
            )}
          </>
        )}

      </div>
    </div>
  );
}
