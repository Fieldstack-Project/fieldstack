import { useState, type FormEvent } from "react";

import { Button, FormField, PinInput } from "@fieldstack/controls";

import "../styles/admin.css";

// 개발 mock PIN — 실제 구현 시 API 검증으로 교체
const MOCK_ADMIN_PIN = "1234";

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
  { id: "users",    icon: "👥", name: "사용자 관리",    desc: "Whitelist 추가·제거, 역할 관리" },
  { id: "modules",  icon: "📦", name: "모듈 레지스트리", desc: "모듈 활성화·비활성화, 버전 관리" },
  { id: "system",   icon: "🗄️", name: "시스템 설정",    desc: "DB 설정, 업데이트, 백업" },
  { id: "security", icon: "🔐", name: "보안 설정",       desc: "PIN 변경, 세션 정책" },
  { id: "audit",    icon: "📋", name: "감사 로그",       desc: "PIN 실패, 주요 설정 변경 이력" },
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

type ActiveSection = "users" | "modules" | "system" | "security" | "audit" | null;

export function AdminView({ isPinVerified, onRequestPin }: AdminViewProps) {
  const [activeSection, setActiveSection] = useState<ActiveSection>(null);

  // 감사 로그 필터
  const [auditFilter, setAuditFilter] = useState<AuditFilter>("all");

  // PIN 변경 폼
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [pinError, setPinError] = useState("");
  const [pinSuccess, setPinSuccess] = useState(false);

  // 초기화 플로우
  const [resetPhase, setResetPhase] = useState<ResetPhase>("idle");
  const [resetPin, setResetPin] = useState("");
  const [resetPinError, setResetPinError] = useState("");

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
    const next = (activeSection === id ? null : id) as ActiveSection;
    setActiveSection(next);
    if (next !== "security") resetPinForm();
    if (next !== "audit") setAuditFilter("all");
    if (next !== "system") resetResetFlow();
  };

  // 부분 초기화 PIN 확인 (mock)
  const handlePartialResetSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (resetPin !== MOCK_ADMIN_PIN) {
      setResetPinError("PIN이 올바르지 않습니다.");
      setResetPin("");
      return;
    }
    setResetPinError("");
    setResetPhase("p-done");
    // 실제 구현 시: POST /admin/partial-reset { pin } 호출
  };

  // 완전 초기화 PIN 확인 (mock)
  const handleFactoryResetSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (resetPin !== MOCK_ADMIN_PIN) {
      setResetPinError("PIN이 올바르지 않습니다.");
      setResetPin("");
      return;
    }
    setResetPinError("");
    setResetPhase("f-done");
    // 실제 구현 시: POST /admin/factory-reset { pin } 호출 → 서버 재시작
  };

  const handlePinChange = (e: FormEvent) => {
    e.preventDefault();
    if (currentPin !== MOCK_ADMIN_PIN) {
      setPinError("현재 PIN이 올바르지 않습니다.");
      setCurrentPin("");
      return;
    }
    if (newPin.length < 4) {
      setPinError("새 PIN은 4자리 이상이어야 합니다.");
      return;
    }
    if (newPin !== confirmPin) {
      setPinError("새 PIN이 일치하지 않습니다.");
      setConfirmPin("");
      return;
    }
    if (newPin === MOCK_ADMIN_PIN) {
      setPinError("현재 PIN과 동일한 PIN은 사용할 수 없습니다.");
      return;
    }
    setPinError("");
    setPinSuccess(true);
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
    <section className="panel admin-root" aria-labelledby="admin-title">
      <div className="admin-hero">
        <div>
          <p className="admin-kicker">Operations Console</p>
          <h1 className="admin-title" id="admin-title">Admin</h1>
          <p className="admin-subtitle">사용자/보안/시스템 설정의 중앙 관리 화면</p>
        </div>
        <span className="admin-badge">Verified Admin</span>
      </div>

      <div className="admin-layout">
        <div className="admin-stats-grid">
          {MOCK_STATS.map((stat) => (
            <div key={stat.label} className="admin-stat-card">
              <p className="admin-stat-label">{stat.label}</p>
              <p className="admin-stat-value">{stat.value}</p>
              <p className="admin-stat-detail">{stat.detail}</p>
            </div>
          ))}
        </div>

        <div className="admin-columns">
          {/* 왼쪽: 섹션 목록 */}
          <div className="admin-sections">
            <h2 className="admin-block-title">관리 영역</h2>
            {ADMIN_SECTIONS.map((section) => (
              <button
                key={section.id}
                className="admin-section-row"
                type="button"
                aria-pressed={activeSection === section.id}
                onClick={() => handleSectionClick(section.id)}
              >
                <div className="admin-section-info">
                  <span className="admin-section-name">{section.icon} {section.name}</span>
                  <span className="admin-section-desc">{section.desc}</span>
                </div>
                <span className="admin-section-arrow" aria-hidden="true">
                  {activeSection === section.id ? "‹" : "›"}
                </span>
              </button>
            ))}
          </div>

          {/* 오른쪽: 패널 */}
          <div className="admin-panel">
            {/* 기본: 최근 감사 로그 미리보기 */}
            {activeSection === null && (
              <>
                <h2 className="admin-block-title">최근 감사 로그</h2>
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
                <Button
                  size="sm"
                  type="button"
                  onClick={() => handleSectionClick("audit")}
                >
                  전체 로그 보기 →
                </Button>
              </>
            )}

            {/* 보안 설정: PIN 변경 */}
            {activeSection === "security" && (
              <>
                <h2 className="admin-block-title">보안 설정</h2>
                <div className="admin-panel-sub-title">관리자 PIN 변경</div>

                {pinSuccess ? (
                  <div className="admin-pin-success">
                    <p className="admin-pin-success-icon" aria-hidden="true">✓</p>
                    <p className="admin-pin-success-title">PIN이 변경되었습니다</p>
                    <p className="admin-pin-success-desc">
                      다음 로그인 시 새 PIN을 사용합니다. (Mock: PIN 실제 저장 안 됨)
                    </p>
                    <Button size="sm" type="button" onClick={resetPinForm}>
                      다시 변경
                    </Button>
                  </div>
                ) : (
                  <form className="admin-pin-form" onSubmit={handlePinChange} noValidate>
                    <FormField label="현재 PIN" htmlFor="pin-current">
                      <PinInput
                        length={4}
                        value={currentPin}
                        onChange={(val: string) => { setCurrentPin(val); setPinError(""); }}
                      />
                    </FormField>
                    <FormField label="새 PIN" htmlFor="pin-new">
                      <PinInput
                        length={4}
                        value={newPin}
                        onChange={(val: string) => { setNewPin(val); setPinError(""); }}
                      />
                    </FormField>
                    <FormField label="새 PIN 확인" htmlFor="pin-confirm">
                      <PinInput
                        length={4}
                        value={confirmPin}
                        onChange={(val: string) => { setConfirmPin(val); setPinError(""); }}
                      />
                    </FormField>
                    {pinError && <p className="admin-pin-error" role="alert">{pinError}</p>}
                    <Button
                      variant="primary"
                      type="submit"
                      disabled={currentPin.length < 4 || newPin.length < 4 || confirmPin.length < 4}
                    >
                      PIN 변경
                    </Button>
                    <p className="admin-pin-hint">개발 mock 현재 PIN: 1234</p>
                  </form>
                )}
              </>
            )}

            {/* 감사 로그: 전체 */}
            {activeSection === "audit" && (
              <>
                <h2 className="admin-block-title">감사 로그</h2>
                <div className="admin-audit-filters" role="group" aria-label="로그 필터">
                  {(["all", "login", "settings", "pin"] as AuditFilter[]).map((f) => (
                    <button
                      key={f}
                      type="button"
                      className="admin-audit-filter-btn"
                      aria-pressed={auditFilter === f}
                      onClick={() => setAuditFilter(f)}
                    >
                      {AUDIT_FILTER_LABELS[f]}
                    </button>
                  ))}
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

            {/* 시스템 설정: 초기화 */}
            {activeSection === "system" && (
              <>
                <h2 className="admin-block-title">시스템 설정</h2>

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
                      <Button
                        size="sm"
                        type="button"
                        onClick={() => setResetPhase("p-confirm")}
                      >
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
                        <Button
                          size="sm"
                          variant="primary"
                          type="button"
                          onClick={() => { setResetPin(""); setResetPhase("p-pin"); }}
                        >
                          계속
                        </Button>
                      </div>
                    </div>
                  )}

                  {resetPhase === "p-pin" && (
                    <div className="admin-reset-confirm">
                      <form onSubmit={handlePartialResetSubmit} noValidate style={{ display: "grid", gap: "10px" }}>
                        <FormField label="관리자 PIN 확인" htmlFor="reset-p-pin">
                          <PinInput
                            length={4}
                            value={resetPin}
                            onChange={(v: string) => { setResetPin(v); setResetPinError(""); }}
                          />
                        </FormField>
                        {resetPinError && (
                          <p className="admin-pin-error" role="alert">{resetPinError}</p>
                        )}
                        <div className="admin-reset-actions">
                          <Button size="sm" type="button" onClick={resetResetFlow}>취소</Button>
                          <Button
                            size="sm"
                            variant="primary"
                            type="submit"
                            disabled={resetPin.length < 4}
                          >
                            초기화 실행
                          </Button>
                        </div>
                        <p className="admin-pin-hint">개발 mock PIN: 1234</p>
                      </form>
                    </div>
                  )}

                  {resetPhase === "p-done" && (
                    <div className="admin-reset-done admin-reset-done-ok">
                      <p className="admin-reset-done-icon" aria-hidden="true">✓</p>
                      <p className="admin-reset-done-title">부분 초기화 완료</p>
                      <p className="admin-reset-done-desc">데이터가 삭제되었습니다. (Mock: 실제 삭제 안 됨)</p>
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
                        <Button
                          size="sm"
                          variant="danger"
                          type="button"
                          onClick={() => setResetPhase("f-confirm-1")}
                        >
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
                          <Button
                            size="sm"
                            variant="danger"
                            type="button"
                            onClick={() => setResetPhase("f-confirm-2")}
                          >
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
                          <Button
                            size="sm"
                            variant="danger"
                            type="button"
                            onClick={() => { setResetPin(""); setResetPhase("f-pin"); }}
                          >
                            PIN으로 확인
                          </Button>
                        </div>
                      </div>
                    )}

                    {resetPhase === "f-pin" && (
                      <div className="admin-reset-confirm">
                        <form onSubmit={handleFactoryResetSubmit} noValidate style={{ display: "grid", gap: "10px" }}>
                          <FormField label="관리자 PIN 입력" htmlFor="reset-f-pin">
                            <PinInput
                              length={4}
                              value={resetPin}
                              onChange={(v: string) => { setResetPin(v); setResetPinError(""); }}
                            />
                          </FormField>
                          {resetPinError && (
                            <p className="admin-pin-error" role="alert">{resetPinError}</p>
                          )}
                          <div className="admin-reset-actions">
                            <Button size="sm" type="button" onClick={resetResetFlow}>취소</Button>
                            <Button
                              size="sm"
                              variant="danger"
                              type="submit"
                              disabled={resetPin.length < 4}
                            >
                              완전 초기화 실행
                            </Button>
                          </div>
                          <p className="admin-pin-hint">개발 mock PIN: 1234</p>
                        </form>
                      </div>
                    )}

                    {resetPhase === "f-done" && (
                      <div className="admin-reset-done" style={{ borderColor: "rgba(239,68,68,0.25)", background: "rgba(239,68,68,0.06)" }}>
                        <p className="admin-reset-done-icon" aria-hidden="true">⚠</p>
                        <p className="admin-reset-done-title" style={{ color: "var(--err)" }}>완전 초기화 완료</p>
                        <p className="admin-reset-done-desc">서버가 재시작됩니다. (Mock: 실제 재시작 안 됨)</p>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            {/* 미구현 섹션 플레이스홀더 */}
            {(activeSection === "users" || activeSection === "modules") && (
              <div className="admin-panel-placeholder">
                <p className="admin-panel-placeholder-icon" aria-hidden="true">🚧</p>
                <p className="admin-panel-placeholder-title">
                  {ADMIN_SECTIONS.find((s) => s.id === activeSection)?.name} — 준비 중
                </p>
                <p className="admin-panel-placeholder-desc">
                  Phase 2에서 구현 예정입니다.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
