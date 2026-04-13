import "../styles/admin.css";

import { Button } from "@fieldstack/controls";

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

const MOCK_AUDIT_LOG = [
  { id: 1, text: "관리자 로그인 성공", time: "방금 전", dot: "ok" as const },
  { id: 2, text: "권한 변경 요청 감지", time: "3분 전", dot: "warn" as const },
  { id: 3, text: "설정 저장 이벤트", time: "12분 전", dot: "info" as const },
];

export function AdminView({ isPinVerified, onRequestPin }: AdminViewProps) {
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
          <div className="admin-sections">
            <h2 className="admin-block-title">관리 영역</h2>
            {ADMIN_SECTIONS.map((section) => (
              <button key={section.id} className="admin-section-row" type="button">
                <div className="admin-section-info">
                  <span className="admin-section-name">{section.icon} {section.name}</span>
                  <span className="admin-section-desc">{section.desc}</span>
                </div>
                <span className="admin-section-arrow" aria-hidden="true">›</span>
              </button>
            ))}
          </div>

          <section className="admin-audit-panel">
            <h2 className="admin-block-title">최근 감사 로그</h2>
            <ul className="admin-audit-list" aria-label="감사 로그">
              {MOCK_AUDIT_LOG.map((item) => (
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
          </section>
        </div>
      </div>
    </section>
  );
}
