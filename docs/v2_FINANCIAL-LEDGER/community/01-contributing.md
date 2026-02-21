# 기여 가이드

## 환영합니다! 🎉

Fieldstack Project에 기여해주셔서 감사합니다! 이 가이드는 어떻게 기여할 수 있는지 설명합니다.

## 기여 방법

### 1. 코드 기여

#### 버그 수정
1. [이슈 검색](https://github.com/Fieldstack-Project/fieldstack/issues)에서 `bug` 라벨 확인
2. 수정하고 싶은 버그 찾기
3. 이슈에 "이 버그를 수정하겠습니다" 코멘트 남기기
4. Fork & PR

#### 새 기능 개발
1. 먼저 이슈로 제안
2. 커뮤니티 피드백 받기
3. 승인 후 개발 시작
4. PR 제출

#### 처음 기여하시나요?
- `good first issue` 라벨 확인
- 간단한 문서 수정부터 시작
- 궁금한 점은 언제든 질문

### 2. 문서 기여

#### 문서 개선
- 오타 수정
- 설명 추가/개선
- 예제 추가
- 번역

#### 튜토리얼 작성
- 블로그 포스트
- YouTube 영상
- 가이드 문서

### 3. 모듈 개발

#### 새 모듈 만들기
1. [모듈 개발 가이드](../modules/development-guide.md) 참고
2. 모듈 개발
3. README 작성
4. module-registry에 제출

#### 기존 모듈 개선
- 버그 수정
- 기능 추가
- 성능 개선

### 4. 커뮤니티 기여

#### 질문 답변
- GitHub Discussions
- Discord
- Stack Overflow

#### 이슈 트리아징
- 새 이슈 확인
- 재현 테스트
- 라벨 추가

#### 버그 리포트
- 명확한 재현 방법
- 환경 정보
- 스크린샷/로그

### 5. 홍보

#### SNS 공유
- Twitter/X
- Reddit
- Facebook

#### 콘텐츠 제작
- 블로그 포스트
- YouTube 리뷰
- 튜토리얼 영상

## 개발 환경 설정

### 1. Fork & Clone

```bash
# Fork 후
git clone https://github.com/Fieldstack-Project/fieldstack.git
cd finance-system

# Upstream 추가
git remote add upstream https://github.com/Fieldstack-Project/fieldstack.git
```

### 2. 의존성 설치

```bash
# pnpm 설치 (없는 경우)
npm install -g pnpm

# 의존성 설치
pnpm install
```

### 3. 개발 서버 실행

```bash
# 전체 실행
pnpm dev

# Backend만
pnpm dev:api

# Frontend만
pnpm dev:web
```

### 4. 테스트

```bash
# 전체 테스트
pnpm test

# 특정 패키지
pnpm test:core
pnpm test:api
pnpm test:web
```

### 5. 빌드

```bash
pnpm build
```

## PR 제출 프로세스

### 1. 브랜치 생성

```bash
# 최신 코드 받기
git checkout main
git pull upstream main

# 새 브랜치 생성
git checkout -b feature/amazing-feature
```

### 2. 코드 작성

```bash
# 변경 사항 커밋
git add .
git commit -m "feat: add amazing feature"
```

### 3. 코드 푸시

```bash
git push origin feature/amazing-feature
```

### 4. PR 생성

GitHub에서 "Create Pull Request" 클릭

**PR 템플릿 작성:**
```markdown
## 변경 사항
무엇을 변경했는지 설명

## 변경 이유
왜 이 변경이 필요한지

## 테스트 방법
1. ...
2. ...

## 체크리스트
- [ ] 테스트 추가/업데이트
- [ ] 문서 업데이트
- [ ] Lint 통과
- [ ] 빌드 성공

## 스크린샷 (UI 변경 시)
```

### 5. 리뷰 대응

- 리뷰어 피드백 확인
- 필요시 수정
- 토론 참여

### 6. 머지

- 승인 후 메인테이너가 머지
- 축하합니다! 🎉

## 코드 스타일

### ESLint & Prettier

```bash
# Lint 검사
pnpm lint

# 자동 수정
pnpm lint:fix

# 포맷팅
pnpm format
```

### TypeScript

- 모든 코드에 타입 지정
- `any` 사용 지양
- 명확한 인터페이스 정의

### 명명 규칙

**변수/함수:** camelCase를 사용합니다. 예를 들어 변수는 `userName`이고, 함수는 `getUserName()`과 같이 작성합니다.

**컴포넌트:** PascalCase를 사용합니다. 예를 들어 `UserProfile`과 같이 작성하고, default export로 내보냅니다.

**상수:** UPPER_SNAKE_CASE를 사용합니다. 예를 들어 `MAX_LENGTH`, `API_URL`과 같이 작성합니다.

**파일명:** 컴포넌트는 `components/UserProfile.tsx`, 유틸리티는 `utils/formatDate.ts`, 훅은 `hooks/useUser.ts`와 같이 구성합니다.

## 커밋 메시지 규칙

### Conventional Commits

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Type

- `feat`: 새 기능
- `fix`: 버그 수정
- `docs`: 문서 변경
- `style`: 코드 포맷팅 (기능 변경 없음)
- `refactor`: 리팩토링
- `test`: 테스트 추가/수정
- `chore`: 빌드/도구 변경

### 예시

```bash
feat(ledger): add category filter

사용자가 카테고리별로 필터링할 수 있도록 기능 추가

Closes #123
```

```bash
fix(auth): resolve login redirect issue

로그인 후 잘못된 페이지로 리다이렉트되는 버그 수정

Fixes #456
```

```bash
docs(readme): update installation guide

Docker Compose 설치 방법 추가
```

## 테스트 작성

### 단위 테스트

테스트 파일은 `modules/ledger/backend/__tests__/service.test.ts` 경로에 작성합니다. Vitest의 describe와 it를 사용하여 구성합니다.

'Ledger Service' 테스트 스위트 안에 'should create entry' 테스트가 있습니다. service.create()를 호출하여 amount 1000, category 'food'인 항목을 생성하고, userId 'user-123'을 전달합니다. 반환된 항목의 amount가 1000이고 category가 'food'인지 expect로 검증합니다.

### 컴포넌트 테스트

테스트 파일은 `modules/ledger/frontend/__tests__/List.test.tsx` 경로에 작성합니다.

'Ledger List' 테스트 스위트 안에 'should render title' 테스트가 있습니다. @testing-library/react의 render로 List 컴포넌트를 렌더링하고, screen.getByText('가계부')가 문서에 존재하는지 검증합니다.

## 문서 작성

### README

모듈에는 반드시 README.md 포함:

```markdown
# Module Name

간단한 설명

## 설치

\`\`\`bash
git clone ...
\`\`\`

## 사용법

\`\`\`typescript
// 예제 코드
\`\`\`

## 설정

...

## 라이선스

MIT
```

### 코드 주석

코드 주석은 JSDoc 형식으로 작성합니다. 함수의 목적을 첫 줄에 간결하게 설명하고, @param 태그로 각 파라미터와 그 역할을 기술합니다. @returns 태그로 반환값을 설명합니다. 예를 들어 가계부 항목을 생성하는 create 함수는 data(항목 데이터)와 userId(사용자 ID)를 받고, 생성된 항목을 반환한다고 문서화합니다.

## 모듈 제출

### 1. 모듈 개발

[모듈 개발 가이드](../modules/development-guide.md) 참고

### 2. 레지스트리 제출

```bash
# module-registry 저장소 Fork
git clone https://github.com/Fieldstack-Project/module-registry.git
cd module-registry

# submissions/ 폴더에 JSON 생성
cat > submissions/my-module.json <<EOF
{
  "name": "my-module",
  "displayName": "내 모듈",
  "repository": "https://github.com/username/my-module",
  "version": "1.0.0",
  "category": "finance"
}
EOF

# PR 제출
git add .
git commit -m "feat: add my-module"
git push origin main
```

### 3. 검토 대기

- 메인테이너가 검토
- 코드 리뷰
- 보안 체크
- 승인 시 레지스트리에 추가

## 이슈 작성

### 버그 리포트

```markdown
**버그 설명**
로그인 후 대시보드로 이동하지 않음

**재현 방법**
1. 로그인 페이지 접속
2. 이메일/비밀번호 입력
3. 로그인 버튼 클릭
4. 빈 화면 표시됨

**예상 동작**
대시보드로 이동해야 함

**환경**
- OS: macOS 14.0
- Node.js: 20.10.0
- Browser: Chrome 120
- Version: 2.1.0

**로그**
\`\`\`
Error: ...
\`\`\`
```

### 기능 요청

```markdown
**문제**
현재 카테고리를 수동으로 입력해야 함

**제안**
드롭다운에서 선택할 수 있으면 좋겠음

**대안**
자동완성 기능

**추가 정보**
스크린샷 첨부
```

## 행동 강령

### 환영하는 행동

✅ 존중하는 태도
✅ 건설적인 피드백
✅ 다양한 관점 인정
✅ 협력적인 자세

### 용납할 수 없는 행동

❌ 모욕적 발언
❌ 괴롭힘
❌ 개인정보 공개
❌ 트롤링

위반 시: 경고 → 일시 정지 → 영구 추방

## 도움 받기

### 질문하기

**GitHub Discussions:**
- 일반적인 질문
- 사용 방법
- 아이디어 논의

**Discord:**
- 실시간 채팅
- 빠른 질문
- 커뮤니티 교류

**이슈:**
- 버그 리포트
- 기능 요청
- 기술적 문제

### 멘토링

- `good first issue` 확인
- 메인테이너에게 질문
- 페어 프로그래밍 (선택)

## 기여자 인정

### 모든 기여는 가치있습니다

- 코드 기여
- 문서 개선
- 버그 리포트
- 질문 답변
- 홍보

### Contributors 페이지

기여자 명단에 자동으로 추가됩니다.

### 감사 인사

README에 기여자로 표시됩니다.

## 라이선스

기여하신 코드는 [MIT License](../LICENSE)로 배포됩니다.

## 연락처

- Email: contribute@fieldstack.dev
- Discord: https://discord.gg/5m4aHKmWgg
- GitHub: https://github.com/Fieldstack-Project/fieldstack

---

**다시 한 번 감사합니다! 🙏**

함께 멋진 프로젝트를 만들어가요! 💪