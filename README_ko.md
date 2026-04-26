# Fieldstack

> 개인용 모듈형 생산성 프레임워크

[![English](https://img.shields.io/badge/README-English-red)](README.md)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub Org](https://img.shields.io/badge/GitHub-fieldstack--project-181717?logo=github)](https://github.com/fieldstack-project)

---

## 소개

Fieldstack은 개인 생산성과 재무 관리를 위한 오픈소스 기반의 셀프호스팅 모듈형 프레임워크입니다.

**개발 및 유지관리:** [PSquare DIVISION](https://github.com/psquare-division)

### 핵심 가치
- ✅ **완전 무료** - 기능 제한 없음
- ✅ **셀프호스팅** - 내 데이터는 내가 통제
- ✅ **모듈형** - 필요한 것만 설치
- ✅ **오픈소스** - MIT 라이선스
- ✅ **커뮤니티 중심** - 함께 만들어가는 프로젝트

---

## 개발 현황

현재 단계: **Phase 2.2 — Subscription 모듈 진행 중**

- Phase 1 · 1.5 · 1.9 · 1.95 — 전 항목 완료
- Phase 2 사전 작업 (ModuleRegistry · 모듈 관리 API · 유저별 활성화) — 완료
- Phase 2.1 Ledger (백엔드 + 프론트, CSV import/export, 예산, 영수증 첨부) — 완료
- Phase 2.x 코어 인프라 (i18n · Event Bus · Core Scheduler · 환율 시스템) — 대부분 완료
- Phase 2.2 Subscription — 핵심 기능 완료, 잔여: Google Calendar · 캘린더 뷰 · 시간대 전략
- 전체 목표 타임라인: **2026–2027**

### Phase 진행 현황

| 단계(Phase) | 범위(로드맵) | 상태 | 진행률 |
| ----------- | ----------- | ---- | ----- |
| Phase 1 | Core 기반 구축 | 완료 ✅ | 100% |
| Phase 1.5 | Core Control Plane UI/UX | 완료 ✅ | 100% |
| Phase 1.9 | API 서버 · DB · 인증 백엔드 · 공유 링크 | 완료 ✅ | 100% |
| Phase 1.95 | Setup 설치 마법사 (모드 전환 · 백엔드 API · UI · 초기화) | 완료 ✅ | 100% |
| Phase 2 Pre | ModuleRegistry · 모듈 관리 API · 유저별 활성화 | 완료 ✅ | 100% |
| Phase 2.1 | Ledger 모듈 (백엔드 + 프론트엔드) | 완료 ✅ | 100% |
| Phase 2.x | 코어 시스템 보완 (i18n · Event Bus · Scheduler · 환율) | 대부분 완료 ⏳ | ~80% |
| Phase 2.2 | Subscription 모듈 | 진행 중 ⏳ | ~70% |
| Phase 3 | 마켓플레이스 및 웹사이트 | 시작 전 🚧 | 0% |
| Phase 4 | 배포 최적화 | 시작 전 🚧 | 0% |
| Phase 5 | 확장 및 생태계 | 시작 전 🚧 | 0% |
| Phase 6 | 커뮤니티 성장(지속) | 시작 전 🚧 | 0% |

#### Phase 2.2 Subscription — 잔여 항목

| 항목 | 상태 |
| ---- | ---- |
| 핵심 기능 (CRUD · 가격 히스토리 · 통계 · 메모 · Scheduler · Event Bus) | 완료 ✅ |
| 구독 상태 이력 기반 누적 통계 (해지 기간 제외 계산) | 완료 ✅ |
| 결제일 캘린더 뷰 | 예정 ⏳ |
| Ledger 자동 연동 (`subscription:payment` 이벤트 수신) | 예정 ⏳ |
| 시간대 전략 (표시 시간대 / 결제 계산 시간대 분리) | 예정 ⏳ |
| Google Calendar 연동 | 예정 ⏳ |

> 참고: 본 Phase 표는 `docs/v2_FINANCIAL-LEDGER/roadmap/01-development-plan.md` 기준이며, 구현 진행에 따라 갱신됩니다.

---

## 기술 스택

| 레이어 | 기술 |
| ------ | ---- |
| 프론트엔드 | React 19, Vite, TypeScript (strict) |
| 백엔드 | Node.js, Express 5, tsx |
| 데이터베이스 | PostgreSQL (1순위) · SQLite (`better-sqlite3`) |
| 인증 | JWT, TOTP 2FA, Argon2id |
| 국제화 | i18next · react-i18next (ko / en) |
| 스케줄러 | node-cron (DB 로그 포함 Core Scheduler) |
| 환율 | Frankfurter API (DB 캐시) |
| 모노레포 | pnpm workspaces |
| 테스트 | Vitest |
| UI 컴포넌트 | `@fieldstack/controls` (내부 패키지), Storybook |
| 스타일링 | CSS 커스텀 프로퍼티 (디자인 토큰 시스템) |
| 터널링 | Cloudflare Tunnel (Quick / Named) |

---

## 시작하기

> **프로덕션 배포 가이드는 Phase 2 완료 시점에 공개됩니다.**<br>
> 그 전까지는 아래 방법으로 로컬 개발 환경에서 실행할 수 있습니다.

### 로컬 개발 환경

```bash
git clone https://github.com/fieldstack-project/fieldstack.git
cd fieldstack
pnpm install

# PostgreSQL 실행 (Docker 필요)
docker-compose up -d

# 개발 서버 실행 (web + api 병렬)
pnpm dev:bypass       # 설치 마법사 스킵
# → Web:  http://localhost:5173
# → API:  http://localhost:3000

# Storybook (UI 컴포넌트 확인)
pnpm storybook        # http://localhost:6007
```

**개발용 mock 계정**

| 역할 | 이메일 | 비밀번호 |
| ---- | ------ | -------- |
| 관리자 | `admin@fieldstack.dev` | `Admin1234!` |
| 일반 사용자 | `user@fieldstack.dev` | `User1234!` |

---

## 문서

📚 [공식 문서](https://docs.fieldstack.dev)<br>
🏪 [마켓플레이스](https://marketplace.fieldstack.dev)<br>
💬 [커뮤니티 디스코드](https://discord.gg/5m4aHKmWgg)

---

## 라이선스

MIT 라이선스 - 자세한 내용은 [LICENSE](LICENSE)를 확인하세요.

**Copyright © 2026 Fieldstack Project Contributors**<br>
**개발 및 유지관리: PSquare DIVISION**
