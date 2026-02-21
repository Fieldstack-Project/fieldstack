# GitHub 공개 정책

## 저장소 구조

```
github.com/Fieldstack-Project/
├── finance-system/              # 메인 프로젝트
├── module-registry/             # 인증된 모듈 레지스트리 (JSON)
├── website/                     # 공식 웹사이트 (Marketplace + Docs)
├── module-ledger/              # 공식 모듈들
├── module-subscription/
├── module-todo/
└── module-example/             # 모듈 개발 템플릿
```

## 공개 범위

### 공개하는 것
- ✅ 전체 소스 코드
- ✅ 모든 문서
- ✅ 이슈 트래커
- ✅ Pull Request
- ✅ 개발 로드맵
- ✅ 기여 가이드

### 공개하지 않는 것
- ❌ 배포본 (Self-hosted 전제)
- ❌ 호스팅 서비스
- ❌ 사용자 데이터
- ❌ API Key 등 민감 정보

## 라이선스

### MIT License

```
MIT License

Copyright (c) 2026 Fieldstack Project Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### 허용 사항
- ✅ 상업적 이용
- ✅ 수정
- ✅ 배포
- ✅ 재배포
- ✅ 사적 이용
- ✅ 특허 사용

### 조건
- 📋 라이선스 및 저작권 명시 필요
- 📋 변경 사항 명시 (선택)

## README 명시 사항

### 프로젝트 소개
```markdown
# Fieldstack Project

> 개인용 · 소수 지인용 self-hosted 내부 관리 시스템

**중요:** 이 프로젝트는 개인/소규모 팀을 위한 Self-hosted 솔루션입니다. 
호스팅 서비스나 SaaS 형태로 제공되지 않습니다.
```

### 대상 사용자
```markdown
## 대상 사용자

- 개인 사용자
- 소규모 팀 (가족, 친구, 소규모 회사)
- Self-hosted 환경
- 개인정보 보호 우선
```

### 명확한 제한 사항
```markdown
## 이것은 무엇이 아닌가요?

❌ SaaS 서비스가 아닙니다
❌ 호스팅 서비스가 제공되지 않습니다
❌ 대규모 엔터프라이즈용이 아닙니다
❌ 클라우드 기반 서비스가 아닙니다
```

### 설치 안내
```markdown
## 빠른 시작

### Docker Compose (권장)

\`\`\`bash
git clone https://github.com/Fieldstack-Project/Fieldstack.git
cd finance-system
docker-compose up -d

# 브라우저 자동 열림
→ http://localhost:3000/install
\`\`\`

### 수동 설치

\`\`\`bash
git clone https://github.com/Fieldstack-Project/Fieldstack.git
cd finance-system
npm install
npm run start
\`\`\`
```

### 문서 링크
```markdown
## 📚 문서

- [📦 설치 가이드](deployment/01-installation.md)
- [🛠️ 개발 가이드](modules/01-development-guide.md)
- [🏗️ 아키텍처](architecture/00-overview.md)
- [🏪 마켓플레이스](https://your-finance-system.dev/marketplace)
```

### 커뮤니티 링크
```markdown
## 🤝 커뮤니티

- 💬 [Discord](https://discord.gg/5m4aHKmWgg)
- 🐙 [GitHub Discussions](https://github.com/Fieldstack-Project/Fieldstack/discussions)
- 📺 [YouTube](https://youtube.com/@...)
```

## 이슈 관리

### 이슈 템플릿

**버그 리포트:**
```markdown
---
name: 버그 리포트
about: 버그를 발견하셨나요?
title: '[BUG] '
labels: bug
---

**버그 설명**
명확하고 간결한 버그 설명

**재현 방법**
1. '...'로 이동
2. '...' 클릭
3. '...'까지 스크롤
4. 에러 발생

**예상 동작**
예상했던 동작 설명

**스크린샷**
가능하다면 스크린샷 첨부

**환경:**
- OS: [e.g. Ubuntu 22.04]
- Node.js: [e.g. 20.10.0]
- 버전: [e.g. 2.1.0]
- 브라우저: [e.g. Chrome 120]

**추가 정보**
기타 추가 정보
```

**기능 요청:**
```markdown
---
name: 기능 요청
about: 새로운 기능을 제안하세요
title: '[FEATURE] '
labels: enhancement
---

**문제 설명**
현재 어떤 문제가 있나요?

**제안하는 해결책**
어떻게 해결하고 싶으신가요?

**대안**
고려한 다른 대안들

**추가 정보**
기타 정보 또는 스크린샷
```

**모듈 제출:**
```markdown
---
name: 모듈 제출
about: 새로운 모듈을 레지스트리에 등록
title: '[MODULE] '
labels: module
---

**모듈 정보**
- 이름: 
- 버전: 
- 카테고리: 
- 저장소: 

**설명**
모듈이 하는 일

**체크리스트**
- [ ] README.md 작성
- [ ] module.json 작성
- [ ] MIT 라이선스
- [ ] 테스트 작성
- [ ] 악성 코드 없음
- [ ] 개인정보 수집 없음
```

### 라벨 시스템

```
버그: bug
개선: enhancement
문서: documentation
질문: question
도움 요청: help wanted
좋은 첫 이슈: good first issue
모듈: module
우선순위: 높음: priority-high
우선순위: 낮음: priority-low
```

## Pull Request 정책

### PR 템플릿

```markdown
## 변경 사항
무엇을 변경했는지 설명

## 변경 이유
왜 이 변경이 필요한지 설명

## 테스트 방법
어떻게 테스트했는지

## 체크리스트
- [ ] 코드가 프로젝트 스타일 가이드를 따름
- [ ] 자체 리뷰 완료
- [ ] 코드에 주석 추가 (어려운 부분)
- [ ] 문서 업데이트
- [ ] 테스트 추가/업데이트
- [ ] 모든 테스트 통과
- [ ] 브레이킹 체인지 없음 (또는 명시)

## 스크린샷 (UI 변경 시)
```

### 리뷰 프로세스

1. **자동 검사**
   - Lint 통과
   - 테스트 통과
   - 빌드 성공

2. **코드 리뷰**
   - 최소 1명의 승인 필요
   - 메인테이너 승인 권장

3. **머지**
   - Squash and merge (권장)
   - 명확한 커밋 메시지

## 브랜치 전략

```
main                 # 프로덕션 코드
  ├── develop        # 개발 브랜치
  │   ├── feature/*  # 기능 개발
  │   ├── fix/*      # 버그 수정
  │   └── docs/*     # 문서 업데이트
  └── hotfix/*       # 긴급 수정
```

### 브랜치 명명 규칙

```
feature/add-crypto-module
fix/ledger-calculation-bug
docs/update-installation-guide
hotfix/security-patch
```

## 릴리스 프로세스

### 버전 관리 (Semantic Versioning)

```
MAJOR.MINOR.PATCH

예: 2.1.0
- 2: Major version (호환성 깨지는 변경)
- 1: Minor version (새 기능 추가)
- 0: Patch version (버그 수정)
```

### 릴리스 체크리스트

```markdown
- [ ] CHANGELOG.md 업데이트
- [ ] 버전 번호 업데이트 (package.json)
- [ ] 문서 업데이트
- [ ] 테스트 전체 통과
- [ ] 빌드 성공
- [ ] Git tag 생성 (v2.1.0)
- [ ] GitHub Release 생성
- [ ] 릴리스 노트 작성
- [ ] 커뮤니티 공지
```

## 코드 소유권

### CODEOWNERS

```
# 전체 프로젝트
* @maintainer1 @maintainer2

# Core
/packages/core/ @core-team

# 문서
/docs/ @doc-team

# 특정 모듈
/modules/ledger/ @ledger-maintainer
```

## 보안 정책

### 취약점 보고

```markdown
# Security Policy

## 보안 이슈 보고

보안 취약점을 발견하셨다면:

1. **공개적으로 이슈를 생성하지 마세요**
2. security@fieldstack.dev로 이메일 전송
3. 또는 GitHub Security Advisories 사용

## 대응 시간
- 24시간 내 확인
- 7일 내 수정 (심각도에 따라)
```

### 보안 업데이트

- 보안 패치는 즉시 릴리스
- 모든 지원 버전에 백포트
- 사용자에게 즉시 알림

## 기여자 인정

### Contributors 페이지

```markdown
## 💝 기여자

이 프로젝트는 다음 분들의 기여로 만들어졌습니다:

### Core Team
- @maintainer1 - Project Lead
- @maintainer2 - Core Developer

### Top Contributors
- @contributor1 - 50+ commits
- @contributor2 - 30+ commits

### All Contributors
[전체 기여자 목록](https://github.com/Fieldstack-Project/Fieldstack/graphs/contributors)
```

### README에 표시

```markdown
## 기여자 ✨

<!-- ALL-CONTRIBUTORS-LIST:START -->
<!-- ALL-CONTRIBUTORS-LIST:END -->
```

## 프로젝트 거버넌스

### 의사결정 프로세스

**일반 변경:**
- PR 생성 → 리뷰 → 머지

**중요 변경:**
- RFC (Request for Comments) 생성
- 커뮤니티 토론 (최소 7일)
- 투표
- 결정

**긴급 변경:**
- 보안 이슈
- 심각한 버그
- 즉시 머지 가능

## 행동 강령

### Code of Conduct

```markdown
# Contributor Covenant Code of Conduct

## Our Pledge
우리는 개방적이고 환영하는 환경을 만들기 위해 노력합니다.

## Our Standards
✅ 환영하는 행동
- 다른 관점과 경험 존중
- 건설적인 비판 수용
- 커뮤니티에 최선을 다함

❌ 용납할 수 없는 행동
- 성적인 언어나 이미지 사용
- 트롤링, 모욕적 발언
- 괴롭힘
- 개인정보 공개

## Enforcement
위반 시 경고 → 일시 정지 → 영구 추방
```

## 스폰서십 정책

```markdown
## 💝 후원

이 프로젝트가 도움이 되었다면 선택적으로 후원할 수 있습니다.

**후원 방법:**
- [GitHub Sponsors](https://github.com/sponsors/your-name)
- [Buy Me a Coffee](https://buymeacoffee.com/your-name)

**중요:** 후원 여부와 관계없이 모든 기능은 동일합니다.
```