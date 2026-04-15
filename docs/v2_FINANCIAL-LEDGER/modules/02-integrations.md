# 통합 서비스 시스템

> 📖 **아키텍처 위치:**  
> → `architecture/00-overview.md § Core Layer § AI Abstraction` - 통합 서비스 추상화  
> → `modules/03-system-design.md § 외부 서비스 통합` - 모듈에서의 사용

**최종 업데이트:** 2025-01-30

---

## 개요

Core는 다양한 외부 서비스와의 통합을 위한 추상화 레이어를 제공합니다. 모듈은 이를 활용하여 쉽게 외부 서비스를 연동할 수 있습니다.

> 💡 **설계 철학:**  
> → `architecture/02-core-principles.md § 5. 최소한의 의존성` - Core는 필수만, 모듈은 자유

---

## 아키텍처

```
packages/core/integrations/
├── base.ts              # 통합 기본 클래스
├── security.ts          # 토큰 암호화
├── google/
│   ├── calendar.ts
│   ├── drive.ts
│   ├── sheets.ts
│   ├── gmail.ts
│   └── tasks.ts
├── microsoft/
│   ├── calendar.ts
│   ├── onedrive.ts
│   └── todo.ts
└── webhook.ts           # 커스텀 Webhook
```

> 📖 **디렉터리 구조:**  
> → `architecture/04-directory-structure.md § packages/core/integrations`

---

## 기본 인터페이스

> 📌 **Provider 패턴:**  
> → `technical/01-database.md § DB 추상화` - 동일한 추상화 패턴 사용

Integration 인터페이스는 모든 통합 서비스가 공통으로 제공해야 할 기능을 정의합니다: name(서비스 이름), authenticate(인증 실행), isAuthenticated(인증 여부 확인), disconnect(연결 종료)입니다.

BaseIntegration은 이 인터페이스를 구현하는 추상 클래스입니다. authenticate 메서드는 받은 자격증명을 암호화하여 저장합니다. isAuthenticated는 자격증명이 저장되어 있으면 true를 반환합니다. disconnect는 저장된 자격증명을 초기화합니다.

---

## Google 서비스 통합

### Google Calendar

> 📖 **실제 사용 예시:**  
> → `modules/00-default-modules.md § Subscription § Google Calendar 연동`  
> → `technical/06-scheduler.md § 작업 예시 § Google Drive 자동 백업`

GoogleCalendar 클래스는 BaseIntegration을 상속받습니다.

authenticate 메서드는 OAuth 클라이언트를 생성하고, 제공된 토큰으로 인증을 완료한 후 Google Calendar API 클라이언트를 초기화합니다.

createEvent 메서드는 CalendarEvent 객체를 받아 기본 캘린더에 이벤트를 생성합니다. 제목, 설명, 시작·종료 시간, 반복 규칙을 설정합니다.

listEvents 메서드는 시작 시간과 종료 시간 범위를 받아 해당 기간의 이벤트 목록을 조회합니다. 단일 이벤트 기준으로 시작 시간순으로 정렬합니다.

updateEvent 메서드는 이벤트 ID와 수정할 내용을 받아 해당 이벤트를 업데이트합니다.

deleteEvent 메서드는 이벤트 ID로 해당 이벤트를 삭제합니다.

### Google Drive

GoogleDrive 클래스는 파일 관리 기능을 제공합니다.

uploadFile 메서드는 파일 버퍼, 파일명, MIME 타입을 받아 Google Drive에 파일을 업로드합니다. 업로드 완료 후 파일 ID, 파일명, 웹 뷰 링크를 반환합니다.

downloadFile 메서드는 파일 ID로 해당 파일을 스트리밍하여 다운로드합니다.

listFiles 메서드는 선택사항인 검색 키워드로 파일 목록을 조회합니다. 각 파일의 ID, 이름, MIME 타입, 생성 시간을 반환합니다.

shareFile 메서드는 파일 ID, 공유할 이메일, 권한 역할(reader 또는 writer)을 받아 해당 파일을 특정 사용자와 공유합니다.

### Google Sheets

GoogleSheets 클래스는 스프레드시트 관리 기능을 제공합니다.

createSpreadsheet 메서드는 제목을 받아 새 스프레드시트를 생성합니다.

appendData 메서드는 스프레드시트 ID, 범위, 데이터 배열을 받아 해당 범위의 끝에 데이터를 추가합니다.

readData 메서드는 스프레드시트 ID와 범위로 해당 영역의 데이터를 읽어옵니다.

updateData 메서드는 스프레드시트 ID, 범위, 새 데이터를 받아 해당 영역의 값을 덮어씁니다.

### Gmail

Gmail 클래스는 이메일 발송과 조회 기능을 제공합니다.

sendEmail 메서드는 수신자, 제목, 본문을 받아 이메일을 구성합니다. To, Subject, 본문을 줄바꿈으로 연결한 후 Base64로 인코딩하여 Gmail API로 발송합니다.

listEmails 메서드는 선택사항인 검색 키워드와 최대 조회 건수를 받아 이메일 목록을 조회합니다. 기본 조회 건수는 10건입니다.

---

## Microsoft 서비스 통합 (예정)

### Outlook Calendar
MicrosoftCalendar 클래스와 연동하여 `GoogleCalendar`와 완벽히 1:1로 대응되는 API 구조를 제공합니다. 모듈 개발자는 구글이든 마소든 동일한 `createEvent` 인터페이스를 사용할 수 있도록 추상화될 예정입니다.

### OneDrive
MicrosoftDrive 클래스와 연동하여 가계부 백업 파일 등을 업로드하거나 다운로드하는 기능을 제공합니다.

### Microsoft To Do
일정 예약이나 가계부 리마인더 등을 Microsoft To Do의 태스크로 생성합니다.

## 커스텀 Webhook

Webhook 클래스는 사용자 정의 외부 서비스와의 통합을 위한 범용 Webhook입니다.

authenticate 메서드는 URL과 선택사항인 헤더를 받아 저장합니다.

send 메서드는 전송할 데이터와 HTTP 메서드(POST 또는 PUT, 기본값 POST)를 받아 저장된 URL로 요청을 보냅니다. 응답이 실패하면 에러를 발생시키고, 성공하면 응답 본문을 JSON으로 파싱하여 반환합니다.

---

## 통합 서비스 팩토리

> 📌 **Factory 패턴:**  
> → `technical/01-database.md § Provider 팩토리` - 동일한 패턴 사용

IntegrationFactory 클래스는 통합 서비스들을 관리하는 팩토리입니다. 내부에는 서비스명과 Integration 객체를 매핑하는 Map을 사용합니다.

register 메서드는 새 통합 서비스를 등록합니다.

get 메서드는 서비스 이름으로 해당 Integration 객체를 조회합니다.

authenticate 메서드는 서비스 이름과 자격증명을 받아, 해당 서비스를 먼저 조회한 후 인증을 실행합니다. 해당 서비스가 없으면 에러를 발생시킵니다.

마지막에서 전역 인스턴스를 생성하고, `GoogleCalendar`, `GoogleDrive`, `GoogleSheets`, `Gmail`, `MicrosoftCalendar` 등의 통합 서비스를 기본으로 등록합니다.

---

## 모듈에서 사용

> 📖 **모듈 개발 가이드:**  
> → `modules/development-guide.md § Backend 개발`

Core의 integrations 팩토리에서 'google-calendar'를 조회합니다. 먼저 인증 여부를 확인하고, 인증되지 않은 경우 에러를 발생시킵니다. 인증된 경우 createEvent를 호출하여 구독 서비스 결제일 이벤트를 생성합니다. 이벤트의 제목은 서비스명에 카드 이모지를 붙이고, 설명에는 금액을 표시합니다. 반복 규칙은 결제 주기에 따라 월간 또는 연간으로 설정합니다.

---

## 보안

> 📖 **보안 정책:**  
> → `technical/04-authentication.md § 보안 고려사항`

### API Key 암호화

> 📌 **암호화 구현:**  
> → `technical/01-database.md § 보안 § 암호화`

AES-256-GCM 암호화를 사용합니다. 환경 변수의 ENCRYPTION_KEY를 사용하며, 없으면 자동으로 생성합니다.

encrypt 함수는 텍스트를 암호화합니다. 무작위 16바이트의 IV(초기화 벡터)를 생성한 후, AES-256-GCM으로 암호화합니다. 결과를 IV, 인증 태그, 암호화된 텍스트를 콜론(:)으로 구분하여 하나의 문자열로 반환합니다.

decrypt 함수는 암호화된 문자열을 복호화합니다. 콜론으로 분리하여 IV, 인증 태그, 암호화된 텍스트를 추출한 후, 역순으로 복호화하여 원본 텍스트를 반환합니다.

### 저장

API Key는 encrypt 함수로 암호화한 후, 사용자 ID, 통합 서비스 이름과 함께 userIntegrations 테이블에 저장합니다.

---

## 에러 처리

외부 서비스 호출 시 에러가 발생할 수 있습니다. 에러 코드에 따라 구분하여 처리합니다. 401 코드는 인증이 만료된 경우로, Google Calendar와 다시 인증해야 함을 안내합니다. 429 코드는 요청 횟수 제한에 걸린 경우로, 잠시 후 다시 시도해달라고 안내합니다. 그 외의 경우는 에러를 그대로 전달합니다.

---

## Scheduler 연계

> 📖 **Scheduler 활용:**  
> → `technical/06-scheduler.md § 통합 서비스 연계`

Scheduler는 통합 서비스와 함께 사용하여 강력한 자동화 구현:

작업명은 'automated-workflow'이며, 매주 금요일 오후 6시에 실행됩니다. 실행되면 총 6단계로 진행됩니다. 첫째로 주간 데이터를 수집합니다. 둘째로 AI를 활용하여 데이터를 분석합니다. 셋째로 분석 결과로 리포트를 생성합니다. 넷째로 리포트를 Google Drive에 저장합니다. 다섯째로 Slack에 '주간 리포트가 생성되었습니다' 알림을 보냅니다. 여섯째로 리포트를 이메일로 발송합니다.

---

## 설정 관리

> 📖 **설정 UI:**  
> → `deployment/configuration.md § 통합 서비스 설정`

### 웹 UI에서 설정

```
설정 → 통합 서비스

┌─────────────────────────────────────┐
│ Google 서비스                        │
│                                     │
│ OAuth Client ID:                    │
│ [                       ]           │
│                                     │
│ OAuth Client Secret:                │
│ [                       ]           │
│                                     │
│ 연동 서비스:                         │
│ [✓] Google Calendar                │
│ [✓] Google Drive                   │
│ [ ] Gmail                          │
│ [ ] Google Sheets                  │
│                                     │
│ [연결 테스트]  [저장]               │
└─────────────────────────────────────┘
```

### Backend API

POST /google/setup 엔드포인트는 Google OAuth 설정을 저장합니다. 요청 본문에서 clientId, clientSecret, 연동할 서비스 목록을 받아 사용자의 설정 테이블에 저장합니다. 기존 설정이 있으면 덮어씁니다.

POST /google/test 엔드포인트는 연결 테스트입니다. Google Calendar 통합을 조회한 후, listEvents를 호출하여 간단한 API 요청을 테스트합니다. 성공하면 success: true를 반환하고, 실패하면 에러 메시지를 반환합니다.

---

## 사용 사례

### 1. 구독 → Google Calendar 동기화

> 📖 **실제 구현:**  
> → `modules/00-default-modules.md § Subscription § Google Calendar 연동`

syncSubscriptionToCalendar 함수는 구독 정보를 Google Calendar에 동기화합니다. 먼저 Google Calendar 통합이 인증되었는지 확인합니다. 인증되지 않은 경우 경고를 로깅하고 종료합니다. 인증된 경우 서비스명·금액·결제일·반복 규칙으로 이벤트를 생성합니다. 이벤트 생성 완료 후 반환된 Calendar Event ID를 구독 테이블에 저장하여 추후 수정·삭제 시 사용할 수 있도록 합니다.

### 2. 백업 → Google Drive 업로드

> 📖 **백업 전략:**  
> → `deployment/01-installation.md § 백업 전략`

Scheduler에 'backup-to-drive' 작업을 등록합니다. 매일 새벽 3시에 실행되며, 총 4단계로 진행됩니다. 첫째로 데이터베이스 백업 파일을 생성합니다. 둘째로 Google Drive 통합이 인증되었는지 확인하고, 안 된 경우 로컬 백업만 유지하고 종료합니다. 셋째로 백업 파일을 읽어 Google Drive에 업로드합니다. 파일명에는 현재 타임스탬프를 포함시킵니다. 넷째로 업로드 완료 후 로컬 백업 파일을 선택적으로 삭제합니다.

---

## 📚 관련 문서

### 아키텍처
- 📖 `architecture/00-overview.md § Core Layer` - 통합 서비스 위치
- 📖 `modules/03-system-design.md § 외부 서비스 통합` - 모듈 사용법

### 기술
- 📖 `technical/01-database.md § Provider 패턴` - 유사한 추상화 패턴
- 📖 `technical/01-database.md § 암호화` - API Key 암호화
- 📖 `technical/04-authentication.md § 보안` - 보안 정책
- 📖 `technical/06-scheduler.md § 통합 서비스 연계` - 자동화 워크플로우

### 모듈 개발
- 📖 `modules/development-guide.md § Backend 개발` - 통합 서비스 사용
- 📖 `modules/00-default-modules.md § Subscription` - 실제 사용 예시

### 배포
- 📖 `deployment/configuration.md § 통합 서비스` - 설정 관리
- 📖 `deployment/01-installation.md § 백업` - Google Drive 백업

---

## 🚀 다음 단계

통합 서비스를 이해했다면:

1. **설정** → `deployment/configuration.md`
2. **모듈 개발** → `modules/development-guide.md`
3. **자동화** → `technical/06-scheduler.md`

> 💬 **도움이 필요하신가요?**  
> → Discord: https://discord.gg/5m4aHKmWgg
> → GitHub Discussions: https://github.com/.../discussions