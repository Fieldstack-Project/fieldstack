# Personal Modular Finance & Productivity System

> 개인용 · 소수 지인용 self-hosted 내부 관리 시스템

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub Sponsors](https://img.shields.io/badge/Sponsor-GitHub-pink)](https://github.com/sponsors/Fieldstack-Project)

---

## 프로젝트 개요

본 프로젝트는 **가계부 / 정기 구독 관리**를 시작으로, 향후 **Scheduler, TODO, 프로젝트·외주 관리, 정산 시스템**까지 확장 가능한 **모듈형 개인 생산성 시스템**을 구축하는 것을 목표로 합니다.

### 핵심 가치

- ✅ **완전 무료** - 기능 제한 없음
- ✅ **Self-hosted** - 개인정보 보호
- ✅ **모듈 시스템** - 원하는 기능만 설치
- ✅ **오픈소스** - MIT License
- ✅ **커뮤니티 중심** - 함께 만드는 생태계

### 대상 사용자

- 본인 + 허용된 소수 지인
- Self-hosted 전제
- 개인정보 보호 우선

---

## 🚀 빠른 시작

### Docker Compose (권장)

```bash
git clone https://github.com/your-org/finance-system.git
cd finance-system
docker-compose up -d

# 브라우저 자동 열림
→ http://localhost:3000/install
```

### 수동 설치

```bash
git clone https://github.com/your-org/finance-system.git
cd finance-system
npm install
npm run start

# 브라우저 자동 열림
→ http://localhost:3000/install
```

웹 기반 설치 마법사가 자동으로 실행됩니다!

---

## 📚 문서

### 시작하기
- [📦 빠른 설치](deployment/installation.md)
- [🧙 설치 마법사](deployment/setup-wizard.md)
- [⚙️ 설정 관리](deployment/configuration.md)

### 아키텍처
- [🏗️ 전체 개요](architecture/overview.md)
- [📁 디렉터리 구조](architecture/directory-structure.md)
- [💡 핵심 원칙](architecture/core-principles.md)

### 기술 문서
- [🔧 기술 스택](technical/tech-stack.md)
- [🗄️ 데이터베이스](technical/database.md)
- [🤖 AI 통합](technical/ai-integration.md)
- [🔐 인증](technical/authentication.md)
- [⏰ Scheduler](technical/scheduler.md)

### 모듈 개발
- [📦 모듈 시스템](modules/system-design.md)
- [🛠️ 개발 가이드](modules/development-guide.md)
- [🔌 통합 서비스](modules/integrations.md)
- [📋 기본 모듈](modules/default-modules.md)

### UI/UX
- [🎨 Core Components](ui/core-components.md)
- [🖼️ 디자인 시스템](ui/design-system.md)

### 마켓플레이스
- [🏪 개요](marketplace/overview.md)
- [📥 모듈 설치](marketplace/installation.md)
- [📝 레지스트리](marketplace/registry.md)
- [🌐 공식 웹사이트](marketplace/website.md)

### 배포 & 운영
- [🚀 배포 전략](deployment/installation.md)
- [🔄 자동 업데이트](deployment/updates.md)

### 커뮤니티
- [💭 프로젝트 철학](community/philosophy.md)
- [🤝 기여 가이드](community/contributing.md)
- [💝 후원](community/sponsorship.md)
- [📜 GitHub 정책](community/github-policy.md)

### 로드맵
- [🗓️ 개발 계획](roadmap/development-plan.md)
- [🎯 프로젝트 목표](roadmap/goals.md)

---

## 🎯 주요 기능

### 기본 제공 모듈

**Default Module (내장)**
- 튜토리얼 및 사용 가이드
- 빠른 시작 안내

**Official Modules (선택 설치)**
- 💰 **Ledger** - 가계부 (수입/지출 관리, 예산, 리포트)
- 📅 **Subscription** - 정기 구독 관리 (결제일 알림, Google Calendar 연동)
- ✅ **TODO** - 할 일 관리
- 📊 **Project** - 프로젝트 및 외주 관리

### 핵심 기능

- 🔌 **모듈 시스템** - WordPress/VSCode 확장 모델
- 🏪 **마켓플레이스** - 웹 기반 모듈 검색 및 설치
- 🤖 **AI 통합** - Gemini, OpenAI, Claude 지원
- 📊 **RAW 데이터 뷰어** - 데이터 투명성
- 🔄 **자동 업데이트** - 시간대 지정 가능
- 🔐 **Google 통합** - Calendar, Drive, Sheets, Gmail
- 🌐 **다국어 지원** - 한국어 우선

---

## 🛠️ 기술 스택

- **Backend**: TypeScript + Node.js
- **Frontend**: React + TypeScript + Vite
- **Database**: PostgreSQL / SQLite / Supabase / MongoDB 외 모든 DB 종류 및 서비스
- **Monorepo**: pnpm workspace
- **AI**: Gemini / OpenAI / Claude / Ollama 등 API를 등록할 수 있는 모든 AI 서비스
- **Deployment**: Docker / Railway / Cloudflare

---

## 🤝 커뮤니티

- 💬 [Discord](https://discord.gg/5m4aHKmWgg)
- 🐙 [GitHub Discussions](https://github.com/Fieldstack-Project/fieldstack/discussions)
- 📺 [YouTube](https://youtube.com/@...)
- 🐦 [Twitter/X](https://x.com/PSquare_Studio)

---

## 💝 후원

이 프로젝트가 도움이 되었다면 선택적으로 후원할 수 있습니다.

**후원 방법:**
- [GitHub Sponsors](https://github.com/sponsors/Fieldstack-Project)
- [Buy Me a Coffee](https://buymeacoffee.com/your-name)

**중요**: 후원 여부와 관계없이 모든 기능은 동일합니다.

---

## 📄 라이선스

이 프로젝트는 **MIT License**로 배포됩니다.

- ✅ 상업적 이용 가능
- ✅ 수정 및 재배포 가능
- ✅ 사적 이용 가능
- ✅ 특허 사용 가능

자세한 내용은 [LICENSE](../../LICENSE) 파일을 참고하세요.

---

> "필요해서 만들기 시작했고,
> 혼자 쓰기엔 아까워서 공유합니다.
> 함께 만들어가는 도구가 되길 바랍니다."