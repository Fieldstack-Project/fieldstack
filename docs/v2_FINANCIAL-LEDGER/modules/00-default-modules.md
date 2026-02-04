# 기본 제공 Modules (MVP)

## Ledger (가계부)

### 기능 개요
수입과 지출을 기록하고 관리하는 기본 가계부 모듈

### 데이터 구조

LedgerEntry는 가계부 항목 하나의 구조입니다.<br>
id는 고유 식별자, userId는 해당 사용자 ID, date는 날짜, amount는 금액으로 양수이면 수입이고 음수이면 지출입니다.<br>
category는 식비·교통비·월급 등의 카테고리, description은 내용 메모, paymentMethod는 현금·카드·계좌이체 등의 결제 수단, tags는 사용자 정의 태그 목록이며, createdAt과 updatedAt은 생성·수정 시간입니다.

### 주요 기능

#### 1. 수입/지출 기록
- 날짜, 금액, 카테고리 입력
- 메모 및 태그 추가
- 영수증 사진 첨부 (선택)

#### 2. 카테고리 관리
- 기본 카테고리: 식비, 교통비, 쇼핑, 의료, 문화생활 등
- 사용자 정의 카테고리 추가/수정
- 카테고리별 예산 설정

#### 3. 결제 수단
- 현금
- 신용카드
- 체크카드
- 계좌이체
- 사용자 정의 결제 수단

#### 4. 통계 및 분석
- 월별/연도별 수입/지출 요약
- 카테고리별 지출 분석
- 차트 시각화 (파이 차트, 막대 그래프)
- AI 기반 지출 패턴 분석 (선택)

### API 엔드포인트

```
GET    /api/ledger/entries         # 목록 조회
GET    /api/ledger/entries/:id     # 상세 조회
POST   /api/ledger/entries         # 신규 생성
PUT    /api/ledger/entries/:id     # 수정
DELETE /api/ledger/entries/:id     # 삭제
GET    /api/ledger/summary          # 요약 통계
GET    /api/ledger/categories       # 카테고리 목록
```

---

## Subscription (정기 구독)

### 기능 개요
Netflix, Spotify 등 정기 구독 서비스를 관리하고 결제일을 추적

### 데이터 구조

Subscription은 구독 서비스 하나의 구조입니다.<br>
id는 고유 식별자, userId는 사용자 ID, serviceName은 Netflix·Spotify 등의 서비스명, amount는 금액, currency는 KRW·USD 등의 통화 단위입니다.<br>
billingCycle은 결제 주기로 monthly(월간) 또는 yearly(연간) 중 하나이며, billingDay는 결제일(1~31), nextPaymentDate는 다음 결제 날짜, isActive는 활성화 여부입니다.<br>
category는 스트리밍·클라우드·게임 등의 카테고리, description은 설명, url은 구독 관리 페이지 링크, tags는 태그 목록이고, createdAt과 updatedAt은 생성·수정 시간입니다.

### 주요 기능

#### 1. 구독 관리
- 구독 서비스 등록
- 금액, 결제 주기, 결제일 입력
- 구독 활성화/비활성화
- 구독 해지일 기록

#### 2. 결제 알림
- 결제일 D-7, D-3, D-1 알림
- 이메일/푸시 알림 지원
- dicsord, Slack 알림 연동 (선택)

#### 3. 통계
- 월간/연간 총 구독료 계산
- 카테고리별 구독료 분석
- 구독 서비스 수 추적
- 가장 비싼 구독 서비스 표시

#### 4. Google Calendar 연동
- 결제일을 자동으로 Google Calendar에 등록
- 캘린더에서 바로 확인 가능
- 결제일 변경 시 자동 동기화

### API 엔드포인트

```
GET    /api/subscription/services         # 목록 조회
GET    /api/subscription/services/:id     # 상세 조회
POST   /api/subscription/services         # 신규 생성
PUT    /api/subscription/services/:id     # 수정
DELETE /api/subscription/services/:id     # 삭제
GET    /api/subscription/summary           # 요약 통계
POST   /api/subscription/sync-calendar     # Calendar 동기화
```

### Google Calendar 연동 구현

Google의 Calendar API를 사용하여 구독 결제일을 캘린더 이벤트로 생성합니다.<br>
이벤트의 제목은 서비스명에 카드 이모지를 붙인 형태로, 설명에는 금액을 표시합니다.<br>
이벤트의 시작일과 종료일은 모두 다음 결제일로 설정하고, 결제 주기에 따라 월간이면 매월 반복, 연간이면 매년 반복하도록 반복 규칙을 적용합니다.

---

## 차후 개발 및 제공 가능 리스트
- TODO / Scheduler
  - 참고: [TickTick](https://ticktick.com/)
  - 포모도로는 추가되지 않음
- 프로젝트·외주 관리
  - 정산 시스템 포함
- 플레너
  - 여행 계획(국내, 해외 등)

---

## API 제공 데이터

아레 작성된 API는 사용자가 직접 API키를 등록하는 방식으로 사용이 가능합니다.<br>
발급 및 등록 방법은 사용자 문서에 작성될 예정

### 한국 사용자 전용 API(한국 내 IP로만 사용 가능)
- 하나은행 Open API(환율에 한하여)
- 공공데이터포털
- 한국전력공사
- 기상청
- 환경부

### 해외 사용자 API(한국 사용자도 이용 가능)
- Frankfurter
- ExchangeRate-API

---

## 모듈 간 연동 규칙

### 모듈간의 연동시 처리 규칙

Fieldstack는 모듈 간 연동을 위해<br>
Event Bus와 직접 인터페이스 방식을 모두 제공한다.

일부 모듈 간 연동은 Event Bus를 통해 이루어질 수 있다.<br>
이 경우 이벤트는 상태 변화 또는 발생한 사실을 전달하며,<br>
수신 모듈은 이를 어떻게 처리할지 스스로 결정한다.

단, 처리 결과에 대한 즉각적인 응답이나<br>
강한 일관성이 필요한 경우에는<br>
직접 연동 방식을 사용할 수 있다.

직접 연동 방식은 연동을 목적으로 공개된 인터페이스를 통해서만 허용되며,<br>
모듈의 내부 구현에 대한 직접 참조는 지양한다.

### Subscription → Ledger 자동 기록

구독 결제일에 자동으로 가계부에 지출 기록:

Subscription 모듈에서 매일 자정에 실행되는 스케줄 작업을 등록합니다.<br>
실행되면 오늘이 결제일인 구독 목록을 조회한 후,<br>
각 구독에 대해 Event Bus를 통해 'subscription:payment' 이벤트를 발행합니다.

이벤트의 내용에는 음수 금액(지출), 카테고리 'subscription',<br>
설명으로 서비스명 구독료, 날짜로 오늘 날짜를 포함합니다.

Ledger 모듈의 초기화 함수에서 해당 이벤트를 구독합니다.<br>
'subscription:payment' 이벤트가 들어오면 전달된 데이터로<br>
가계부 항목을 자동으로 생성하고, 생성 완료 시 로그를 남깁니다.

---

## UI 예시

### Ledger 목록 화면

Core의 PageLayout과 DataTable 컴포넌트를 사용하여 가계부 목록 페이지를 구성합니다.<br>
PageLayout의 제목을 '가계부'로 설정하고, 우측 상단에 '+ 추가' 버튼을 배치합니다.<br>
DataTable에는 날짜(정렬 가능), 카테고리, 내용, 금액 열을 정의하며, 검색·필터·페이지네이션 기능을 모두 활성화합니다.

### Subscription 대시보드

Core의 PageLayout과 Card, StatCard 컴포넌트를 사용하여 구독 관리 대시보드를 구성합니다.<br>
상단에는 3개의 요약 카드를 배치합니다: 월간 구독료 합계, 활성 구독 수, 다음 결제일.<br>
그 아래에는 Card 안에 구독 목록을 루프를 돌며 카드 형태로 하나씩 표시합니다.

---

## 모듈의 파일 처리 선언 규칙

모듈은 업로드된 파일 처리에 대한 지원을 선언할 수 있습니다.

각 모듈은 다음을 지정할 수 있습니다.
- 지원되는 파일 확장자
- 지원되는 MIME 유형
- 의도된 처리 목적

이 선언은 코어에서 업로드된 파일을<br>
적합한 모듈로 라우팅하는 데 사용됩니다.

```jsonc
{
  "fileHandlers": [
    {
      "extensions": ["csv"],
      "mime": ["text/csv"],
      "purpose": "ledger-import"
    }
  ]
}
```

### 책임 경계

- 코어:
    - 업로드된 파일을 수신합니다.
    - 파일 메타데이터를 추출합니다.
    - 지정된 모듈로 파일을 전달합니다.
- 모듈:
    - 파일 구조 및 내용을 검증합니다.
    - 파일 사용 가능 여부를 판단합니다.
    - 구문 분석, 미리보기 및 데이터 적용을 처리합니다.

### 예시: 원장 CSV 가져오기 모듈

원장 모듈은 거래 내역 가져오기에 사용되는 CSV 파일 지원을 선언합니다.

이 모듈은 다음과 같은 기능을 수행합니다.
- CSV 헤더 및 행 검사
- 원장별 구조 유효성 검사
- 미리보기 및 가져오기 흐름 처리

코어는 CSV 파일이 유효한 원장 파일인지 여부를 검증하지 않습니다.