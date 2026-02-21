# 설정 관리

## 웹 UI를 통한 설정

모든 설정은 웹 UI에서 변경 가능하며, 환경 변수를 직접 수정할 필요가 없습니다.

## 설정 페이지 구조

```
설정
├── 일반 설정
│   ├── 프로필
│   ├── 언어
│   └── 테마
├── AI 설정
│   ├── Provider 변경
│   ├── API Key 관리
│   └── 연결 테스트
├── 데이터베이스
│   ├── 연결 정보
│   └── 연결 테스트
├── 통합 서비스
│   ├── Google (OAuth)
│   ├── Notion, Slack, GitHub
│   └── 커스텀 Webhook
├── 모듈 관리
│   ├── 설치된 모듈
│   ├── 마켓플레이스
│   └── 업데이트
├── 시스템
│   ├── 자동 업데이트
│   ├── 백업
│   └── 로그
└── 개발자 도구
    ├── API Keys
    ├── Webhooks
    └── 로그 뷰어
```

## 1. 일반 설정

### 프로필

프로필 설정 폼입니다. 이름 필드는 직접 입력 가능하며, 이메일 필드는 `disabled` 상태로 변경할 수 없습니다. 저장 버튼 클릭 시 `handleUpdateProfile`이 실행됩니다.

### 언어 설정

언어를 Select 컴포넌트로 선택합니다. 한국어, English, 일본어 세 가지 옵션이 제공되며, 변경 시 `setLanguage`로 상태를 업데이트합니다.

### 테마 설정

테마를 RadioGroup로 선택합니다. 라이트, 다크, 시스템 설정 따르기(auto) 세 가지 옵션이 있으며, 변경 시 `setTheme`로 상태를 업데이트합니다.

## 2. AI 설정

AI 설정 페이지는 Provider 선택과 API Key 입력, 연결 테스트 기능을 제공합니다.

**Frontend (`apps/web/src/pages/Settings/AI.tsx`):**

`AISettings` 컴포넌트는 provider, apiKey, testing 상태를 관리합니다. Provider는 Google Gemini, OpenAI, Anthropic Claude, Ollama(로컬) 네 가지 옵션을 Select로 제공합니다. Ollama를 제외한 경우에만 API Key 입력 필드가 표시되며, 해당 Provider의 API Key 발급 페이지 링크도 함께 표시됩니다. 연결 테스트 버튼 클릭 시 `/api/settings/ai/test`에 POST 요청을 보내고, 응답에 따라 성공 또는 실패 알림을 표시합니다.

**Backend (`apps/api/src/routes/settings.ts`):**

`POST /ai` 라우트는 요청본문에서 provider와 apiKey를 받아 API Key를 암호화한 후 `user_settings` 테이블에 upsert합니다. 해당 사용자의 `ai` 키가 이미 있으면 update, 없으면 create가 실행됩니다.

`POST /ai/test` 라우트는 provider와 apiKey를 받아 해당 Provider의 AI 클라이언트를 생성하고 테스트 문자열로 생성 요청을 실행합니다. 성공하면 응답을 반환하고, 실패하면 400 상태와 오류 메시지를 반환합니다.

## 3. 데이터베이스 설정

`DatabaseSettings` 컴포넌트는 provider와 연결 정보를 상태로 관리합니다. Provider를 PostgreSQL, SQLite, Supabase 중 하나로 선택할 수 있으며, PostgreSQL을 선택하면 호스트, 포트, 데이터베이스명, 사용자, 비밀번호 입력 필드가 추가로 표시됩니다. 변경 시 시스템이 재시작됨을 경고하는 Alert가 표시됩니다. 연결 테스트와 저장 및 재시작 버튼이 제공됩니다.

## 4. 통합 서비스 설정

### Google OAuth

`GoogleIntegration` 컴포넌트는 OAuth Client ID와 Client Secret 입력 필드를 제공합니다. 아래에는 Google Cloud Console에서 OAuth 클라이언트를 생성하고 리다이렉션 URI를 등록하는 방법을 안내하는 Alert가 표시됩니다. 리다이렉션 URI는 현재 페이지의 origin에 `/auth/google/callback`을 붙인 값입니다. Google Calendar, Google Drive, Gmail, Google Sheets 중 연동할 서비스를 Checkbox로 선택할 수 있습니다.

### Slack, Notion 등

Slack은 Bot Token을, Notion은 Integration Token을 비밀번호 타입 입력 필드로 받습니다. 각각 연결 테스트 버튼이 제공됩니다.

## 5. 시스템 설정

### 자동 업데이트

`UpdateSettings` 컴포넌트는 자동 업데이트 활성화 여부를 Switch로 제어합니다. 활성화하면 업데이트 주기(매일/매주/매월), 업데이트 시간, 업데이트 전 확인 받기, 유지보수 모드 사용 옵션이 추가로 표시됩니다. 유지보수 모드는 업데이트 중 일반 사용자 접근을 차단합니다.

### 백업 설정

백업 설정 카드는 자동 백업 활성화 Switch, 백업 주기(매일/매주) Select, 백업 시간 입력, 백업 위치 선택(로컬 `./backups`, Google Drive, 커스텀 경로)을 제공합니다. 지금 백업하기와 복원하기 두 가지 액션 버튼이 있습니다.

## 설정 저장 위치

### 1. 데이터베이스 (user_settings 테이블)

```sql
CREATE TABLE user_settings (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  key VARCHAR(100) NOT NULL,
  value JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, key)
);
```

### 2. .env 파일 (시스템 설정)

`updateEnvFile` 함수는 `.env` 파일을 읽고, 전달받은 키-값 쌍들을 순회하며 각 키가 이미 파일에 존재하면 정규식으로 값을 교체하고, 존재하지 않으면 파일 끝에 추가합니다. 파일 수정 후 `process.env`에도 동일한 값을 반영하여 즉시 환경 변수가 적용되도록 합니다.

## 설정 변경 시 재시작

`gracefulRestart` 함수는 단계별로 안전한 재시작을 수행합니다. 먼저 `server.close()`로 새 요청을 거부한 후, 5초를 대기하여 진행 중인 요청이 완료되도록 합니다. 이후 기존 연결을 종료하고, PM2가 프로세스를 재시작할 수 있도록 `process.exit(0)`으로 종료합니다.

## 설정 내보내기/가져오기

**내보내기 (`GET /export`):** 해당 사용자의 `user_settings` 테이블 전체를 조회하여, 키를 속성명으로 하고 값을 파싱한 객체로 변환하여 반환합니다.

**가져오기 (`POST /import`):** 요청본문의 키-값 쌍들을 순회하며, 각 키에 대해 해당 사용자의 설정을 upsert합니다. 키가 이미 있으면 값을 update하고, 없으면 새로 create합니다.

## 설정 초기화

설정 초기화 버튼은 `variant="danger"`로 표시됩니다. 클릭 시 `confirm` 다이얼로그로 사용자 확인을 받고, 승인하면 `POST /api/settings/reset`을 호출한 후 페이지를 리로드합니다.