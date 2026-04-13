# 모듈 개발 가이드

> 📌 **핵심 아키텍처 결정:**  
> → `architecture/01-decisions.md § 결정 #1: Module Loader` - 런타임 동적 로드 방식

**최종 업데이트:** 2025-01-29

---

## 시작하기

> 📖 **모듈 시스템 개요:**  
> → `modules/03-system-design.md`

### 1. 모듈 템플릿 복사

example 폴더를 복사하여 my-module이라는 새 폴더로 만들고, 해당 폴더로 이동합니다.

### 2. module.json 수정

모듈의 메타데이터를 정의하는 파일입니다.

```json
{
  "name": "my-module",
  "version": "1.0.0",
  "displayName": "내 모듈",
  "exposedSkills": [
    {
      "id": "get-summary",
      "path": "/summary",
      "description": "모듈 데이터 요약을 외부 AI에 제공합니다."
    }
  ]
}
```
`exposedSkills`는 OpenClaw 같은 외부 AI 에이전트에게 노출할 기능을 정의합니다.

---

## 프로젝트 구조

```
modules/my-module/
├── module.json          # 모듈 메타데이터
├── README.md            # 모듈 설명
├── frontend/
│   ├── index.tsx       # Frontend 진입점
│   ├── pages/
│   │   ├── List.tsx
│   │   ├── Detail.tsx
│   │   └── Create.tsx
│   ├── components/
│   │   └── MyComponent.tsx
│   └── hooks/
│       └── useMyModule.ts
├── backend/
│   ├── index.ts        # Backend 진입점
│   ├── routes.ts
│   ├── service.ts
│   ├── schema.ts
│   ├── validation.ts
│   └── migrations/
│       └── 001_initial.sql
└── types/
    └── index.ts
```

> 📖 **디렉터리 구조 전체:**  
> → `architecture/04-directory-structure.md § modules/`

---

## Backend 개발

### routes.ts

Express Router를 사용하여 CRUD 엔드포인트를 정의합니다.

GET / 엔드포인트는 목록 조회입니다. 현재 로그인 사용자의 ID로 service.list를 호출하여 항목 목록을 반환합니다. 에러가 발생하면 500 상태와 에러 메시지를 반환합니다.

GET /:id 엔드포인트는 상세 조회입니다. URL의 항목 ID와 사용자 ID로 service.getById를 호출합니다. 해당 항목이 없으면 404를 반환하고, 있으면 항목 정보를 반환합니다.

POST / 엔드포인트는 신규 생성입니다. validateCreate 미들웨어를 거쳐 입력 데이터의 유효성을 먼저 검증하고, 통과하면 service.create를 호출하여 새 항목을 생성합니다. 성공 시 201 상태와 생성된 항목을 반환합니다.

PUT /:id 엔드포인트는 수정입니다. validateUpdate 미들웨어를 거쳐 유효성 검증 후, service.update를 호출하여 해당 항목을 수정합니다.

DELETE /:id 엔드포인트는 삭제입니다. service.remove를 호출하여 해당 항목을 삭제하고, 성공 시 204 상태(본문 없음)를 반환합니다.

### service.ts

> 📖 **DB 추상화 레이어:**  
> → `technical/01-database.md`  
> → `architecture/01-decisions.md § 결정 #3: DB 추상화`

Core의 `db`, `eventBus`, `core` 컨텍스트를 주입받아 사용합니다.

### 서비스 호출 (Service-to-Service)
다른 모듈의 기능이 필요한 경우 Core의 Registry를 통해 서비스를 요청합니다.
```typescript
const ledgerService = this.core.getService('ledger');
if (ledgerService) {
  await ledgerService.createEntry({...});
}
```

### DB 및 이벤트

create 함수는 새 항목을 생성합니다. 완료 후 'my-module:created' 이벤트를 Event Bus에 발행합니다.

---

Core의 db와 eventBus를 가져와 사용합니다.

list 함수는 해당 사용자의 my_module_items를 생성 시간 내림차순으로 조회합니다.

getById 함수는 항목 ID와 사용자 ID로 특정 항목을 조회하고, 결과의 첫 번째 항목을 반환합니다.

create 함수는 새 항목을 생성합니다. 무임의 ID를 생성하고, 입력 데이터에 사용자 ID와 생성·수정 시간을 추가한 후 테이블에 삽입합니다. 삽입 완료 후 'my-module:created' 이벤트를 Event Bus에 발행합니다.

update 함수는 먼저 해당 항목이 존재하는지 확인하고, 없으면 에러를 발생시킵니다. 존재하면 기존 데이터에 새 데이터를 덮어씀하고 수정 시간을 업데이트한 후 저장합니다. 완료 후 'my-module:updated' 이벤트를 발행합니다.

remove 함수도 먼저 존재 여부를 확인한 후, 해당 항목을 삭제합니다. 완료 후 'my-module:deleted' 이벤트를 발행합니다.

### validation.ts

Zod 라이브러리를 사용하여 입력 데이터의 유효성을 검증합니다.

createSchema는 생성 시 필요한 규칙을 정의합니다: name은 1자 이상 100자 이하의 문자열, description은 선택사항인 문자열, amount는 양수인 숫자입니다.

updateSchema는 createSchema의 모든 필드를 선택사항으로 변경합니다 (부분 수정 가능).

validateCreate 미들웨어는 요청 본문을 createSchema로 검증하고, 통과하면 다음 단계로 넘깁니다. 실패하면 400 상태와 에러 내용을 반환합니다. validateUpdate도 동일하게 updateSchema로 검증합니다.

### schema.ts

my_module_items 테이블의 스키마를 정의합니다. id는 기본키인 UUID, user_id는 필수의 UUID, name은 최대 100자의 문자열, description은 선택사항인 텍스트, amount는 소수점 2자리까지의 숫자입니다. created_at과 updated_at은 기본값으로 현재 시간을 설정합니다. 인덱스는 user_id와 created_at에 각각 생성됩니다.

### index.ts (Backend Entry)

> 📌 **핵심:** Module Loader가 이 파일을 런타임에 동적으로 Import합니다.  
> → `architecture/01-decisions.md § 결정 #1: Module Loader`

백엔드의 진입점입니다. routes를 기본 export하고, initialize와 shutdown 두 함수를 제공합니다.

initialize 함수는 모듈이 시작될 때 호출됩니다. 먼저 DB 마이그레이션을 실행합니다. 그 다음 Scheduler에 'my-module-daily-task'라는 매일 자정에 실행되는 작업을 등록합니다. 마지막으로 Event Bus에서 'user:created' 이벤트를 구독하여 새 사용자가 생성되면 handleNewUser 함수를 실행하도록 합니다.

shutdown 함수는 모듈이 종료될 때 호출됩니다. Event Bus에서 등록한 이벤트 리스너를 제거합니다.

> 📖 **Scheduler 사용법:**  
> → `technical/04-scheduler.md`

---

## Frontend 개발

### index.tsx (Frontend Entry)

> 📌 **핵심:** Module Loader가 이 파일을 런타임에 동적으로 Import합니다.  
> → `architecture/01-decisions.md § 결정 #1`

프론트엔드의 진입점입니다. React Router를 사용하여 라우팅을 정의합니다. 루트 경로(/)에는 List 페이지, /:id 경로에는 Detail 페이지, /create 경로에는 Create 페이지를 배치합니다.

navigation 객체를 별도로 export합니다. 이 정보는 앱의 네비게이션 메뉄에 자동으로 표시되며, 라벨은 '내 모듈', 아이콘은 🎯, 경로는 /my-module입니다.

### pages/List.tsx

> 📖 **Core UI 컴포넌트:**  
> → `ui/02-core-components.md`

목록 페이지입니다. useNavigate 훅으로 페이지 이동을 준비하고, useMyModule 훅에서 항목 목록, 로딩 상태, 삭제 함수를 가져옵니다.

테이블 열을 4개로 정의합니다: 이름(정렬 가능), 설명, 금액(통화 형식으로 포맷), 작업(각 행에 빨간색 삭제 버튼 표시). 삭제 버튼을 클릭하면 확인 팝업을 표시하고, 확인하면 해당 항목을 삭제합니다.

PageLayout에 제목을 '내 모듈'로 설정하고 우측 상단에 '+ 추가' 버튼을 배치합니다. DataTable에 열과 데이터를 넘기고, 검색·정렬·페이지네이션을 활성화합니다. 행을 클릭하면 해당 항목의 상세 페이지로 이동합니다.

### pages/Create.tsx

생성 페이지입니다. useNavigate로 이동을 준비하고, useNotification 훅으로 성공/실패 알림을 표시할 준비를 합니다. useMyModule 훅에서 createItem 함수를 가져옵니다.

폼 데이터의 초기값은 name은 빈 문자열, description은 빈 문자열, amount는 0입니다.

handleSubmit 함수는 제출 시 createItem을 호출합니다. 성공하면 '생성되었습니다' 알림을 표시하고 목록 페이지로 이동합니다. 실패하면 '생성에 실패했습니다' 알림을 표시합니다.

FormLayout에 제목을 '새 항목 추가'로 설정하고, 저장과 취소 버튼의 액션을 연결합니다. 본문에는 이름(필수), 설명, 금액(숫자 타입, 필수) 세 개의 Input 컴포넌트를 배치합니다. 각 입력의 값이 변경되면 폼 데이터 상태가 업데이트됩니다.

### hooks/useMyModule.ts

모듈 전용 훅입니다. 항목 목록과 로딩 상태를 상태로 관리합니다. 컴포넌트가 마운트되면 백엔드에서 항목 목록을 가져옵니다.

fetchItems 함수는 로딩을 켜고 /api/my-module에 GET 요청을 보내 목록을 가져옵니다. 완료되면 로딩을 끕니다.

createItem 함수는 백엔드에 POST 요청으로 새 항목을 생성하고, 생성된 항목을 목록에 추가합니다.

updateItem 함수는 백엔드에 PUT 요청으로 항목을 수정하고, 목록에서 해당 항목을 교체합니다.

deleteItem 함수는 백엔드에 DELETE 요청으로 항목을 삭제하고, 목록에서 해당 항목을 제거합니다.

훅은 items, loading, createItem, updateItem, deleteItem, refresh를 반환합니다.

---

## 타입 정의

MyModuleItem은 항목의 전체 구조입니다: id, userId, name, 선택사항인 description, amount, createdAt, updatedAt.

CreateMyModuleItemDto는 항목 생성 시 필요한 데이터 구조입니다: name, 선택사항인 description, amount.

UpdateMyModuleItemDto는 항목 수정 시 사용되며, CreateMyModuleItemDto의 모든 필드를 선택사항으로 변경한 구조입니다 (부분 수정 가능).

---

## 테스트

### Backend 테스트

Vitest를 사용하여 service 함수를 테스트합니다. beforeEach에서 테스트용 DB를 초기화합니다.

첫 번째 테스트는 항목 생성을 확인합니다. name과 amount를 넘기고 create를 호출한 후, 반환된 항목의 name이 'Test'이고 amount가 1000인지 확인합니다.

두 번째 테스트는 목록 조회를 확인합니다. list를 호출한 후, 반환된 값이 배열인지 확인합니다.

### Frontend 테스트

React Testing Library를 사용하여 List 페이지를 테스트합니다. List 컴포넌트를 렌더링한 후, '내 모듈' 텍스트가 화면에 표시되는지 확인합니다.

---

## 배포

### 1. GitHub에 업로드

git init으로 저장소를 초기화하고, 전체 파일을 추가하여 커밋합니다. GitHub의 원본 저장소를 연결한 후 main 브랜치를 푸시합니다.

### 2. README 작성

모듈의 설명, 설치 방법(git clone 명령어), 사용법을 작성합니다.

### 3. 공식 레지스트리에 등록

> 📖 **레지스트리 제출:**  
> → `marketplace/registry.md § 모듈 인증 프로세스`

module-registry 저장소에 PR 제출

---

## 모범 사례

### ✅ 해야 할 것

> 📖 **Core UI 컴포넌트 사용:**  
> → `ui/02-core-components.md`

- Core UI 컴포넌트 사용
- 타입 정의 명확하게
- 에러 처리 철저하게
- 사용자 데이터만 접근
- Event Bus로 모듈 간 통신
- 테스트 작성

### ❌ 하지 말아야 할 것

- 다른 모듈 직접 import
- 전역 상태 오염
- 하드코딩된 값
- 다른 모듈의 DB 테이블 접근
- 민감한 정보 로그 출력

---

## 📚 관련 문서

### 아키텍처
- 📌 `architecture/01-decisions.md § 결정 #1` - Module Loader 설계
- 📖 `architecture/00-overview.md § Module Layer` - 모듈 레이어 설명
- 📖 `architecture/04-directory-structure.md` - 디렉터리 구조

### 기술
- 📖 `technical/01-database.md` - DB 추상화 레이어
- 📖 `technical/04-scheduler.md` - Scheduler 사용법
- 📖 `technical/05-openapi-baseline.yaml` - OpenAPI baseline
- 📖 `modules/02-integrations.md` - 외부 서비스 통합

### 테스트 베이스라인 (Phase 1.4)
- Vitest 기반 단위 테스트는 `packages/core/src/**/*.test.ts`에 추가합니다.
- API 통합 스모크 테스트는 `apps/api/src/integration/*.test.ts`에 추가합니다.
- 모듈 로더 계약 검증은 `apps/api/src/loader/index.test.ts`를 기준으로 확장합니다.

### UI
- 📖 `ui/02-core-components.md` - Core UI 컴포넌트
- 📖 `ui/00-design-system.md` - 디자인 시스템

### 마켓플레이스
- 📖 `marketplace/registry.md` - 레지스트리 등록
- 📖 `marketplace/02-installation.md` - 모듈 설치

---

## 🚀 다음 단계

모듈 개발을 완료했다면:

1. **테스트** - 철저한 테스트
2. **문서화** - README.md 작성
3. **등록** - 마켓플레이스에 제출
4. **공유** - 커뮤니티에 소개

> 💬 **도움이 필요하신가요?**  
> → Discord: https://discord.gg/5m4aHKmWgg
> → GitHub Discussions: https://github.com/.../discussions
