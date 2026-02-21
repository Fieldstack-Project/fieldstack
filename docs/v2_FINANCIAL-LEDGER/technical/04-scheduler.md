# Scheduler 설계

> 📖 **관련 아키텍처:**  
> → `architecture/00-overview.md § Plugin Layer` - Scheduler는 Backend Plugin으로 구현  
> → `modules/system-design.md § 모듈 생명주기` - initialize() Hook에서 작업 등록

**최종 업데이트:** 2025-01-29

---

## 개요

Scheduler는 **Backend Plugin**으로 구현되며, 모듈이 주기적인 작업을 등록하고 실행할 수 있도록 지원합니다.

---

## 아키텍처

```
apps/api/src/plugins/scheduler/
├── index.ts              # Scheduler 엔진
├── registry.ts           # 작업 등록 레지스트리
├── executor.ts           # 작업 실행기
└── types.ts              # 타입 정의
```

---

## 작업 등록 방식

> 📖 **모듈 초기화:**  
> → `modules/development-guide.md § Backend 개발 § index.ts`  
> → `modules/system-design.md § 모듈 생명주기`

모듈은 **초기화 시 작업을 등록**:

Core의 scheduler를 가져와 초기화 함수 내에서 작업을 등록합니다. 예시로 '월간 요약' 작업을 등록하며, 스케줄은 매월 1일 자정으로 설정합니다. 작업이 실행되면 월간 요약을 생성한 후 사용자에게 알림을 보냅니다.

---

## 스케줄 표현식

**Cron 표현식 사용:**

```
┌───────────── 분 (0 - 59)
│ ┌───────────── 시 (0 - 23)
│ │ ┌───────────── 일 (1 - 31)
│ │ │ ┌───────────── 월 (1 - 12)
│ │ │ │ ┌───────────── 요일 (0 - 7, 0과 7은 일요일)
│ │ │ │ │
* * * * *
```

### 예시

- `* * * * *` - 매분
- `0 * * * *` - 매시간 정각
- `0 0 * * *` - 매일 자정
- `0 0 1 * *` - 매월 1일 자정
- `0 0 * * 0` - 매주 일요일 자정
- `0 9 * * 1-5` - 평일 오전 9시
- `*/15 * * * *` - 15분마다
- `0 */6 * * *` - 6시간마다

---

## 작업 예시

### 1. 월간 가계부 요약

작업명은 'ledger-monthly-summary'이며, 매월 1일 오전 9시에 실행됩니다. 실행되면 지난 달의 가계부 항목을 조회한 후 요약을 계산하고, 사용자에게 요약 알림을 보냅니다.

### 2. 구독 결제일 체크

> 📖 **기본 모듈:**  
> → `modules/default-modules.md § Subscription`

작업명은 'subscription-payment-check'이며, 매일 오전 9시에 실행됩니다. 실행되면 오늘 날짜와 결제일이 일치하는 구독 목록을 조회하고, 각각에 대해 결제일 안내 알림을 보냅니다.

### 3. 외주 정산 알림

작업명은 'project-settlement-reminder'이며, 매주 월요일 오전 10시에 실행됩니다. 실행되면 정산 대기 중인 프로젝트들을 조회하고, 정산 안내 알림을 보냅니다.

### 4. Google Drive 자동 백업

> 📖 **통합 서비스:**  
> → `modules/integrations.md § Google Drive`

작업명은 'backup-to-drive'이며, 매일 새벽 2시에 실행됩니다. 실행되면 데이터베이스 백업 파일을 생성한 후 Google Drive에 업로드합니다.

### 5. Slack 리포트 전송

> 📖 **통합 서비스:**  
> → `modules/integrations.md § Slack`

작업명은 'weekly-slack-report'이며, 매주 월요일 오전 9시에 실행됩니다. 실행되면 주간 통계를 생성한 후 Slack으로 전송합니다.

---

## 실행 로그

모든 작업 실행은 로그로 기록:

실행 로그의 구조는 작업명(taskName), 실행 시간(executedAt, ISO 8601 형식), 결과 상태(success 또는 failed), 실행 소요 시간(duration, ms 단위), 실패 시 에러 메시지(error)로 구성됩니다.

### 로그 저장

executeTask 함수는 작업을 실행하고 로그를 저장합니다. 실행 시작 시간을 기록한 후 작업의 handler를 실행합니다. 성공하면 상태를 'success'로, 실패하면 'failed'로 설정하고 에러 메시지를 저장합니다. 실행이 완료되면 작업명, 실행 시간, 상태, 소요 시간, 에러 메시지를 scheduler_logs 테이블에 기록합니다.

---

## 관리 UI

설정 페이지에서 스케줄된 작업 관리:

### 기능

- ✅ 등록된 작업 목록 조회
- ✅ 작업 활성화/비활성화
- ✅ 다음 실행 시간 확인
- ✅ 실행 히스토리 조회
- ✅ 수동 실행 트리거

### UI 예시

SchedulerSettings 페이지 컴포넌트입니다. 컴포넌트가 열리면 백엔드에서 등록된 작업 목록을 가져옵니다. 작업 목록을 테이블로 표시하며, 각 행에는 작업명, 스케줄, 다음 실행 시간이 표시됩니다. 활성화 열에는 토글 스위치가 있어 클릭하면 백엔드에 활성화/비활성화 요청을 보내고 목록을 다시 조회합니다. 작업 열에는 '지금 실행' 버튼이 있어 클릭하면 백엔드에 수동 실행 요청을 보내고 성공 시 '작업이 실행되었습니다' 알림을 표시합니다.

---

## 통합 서비스 연계

> 📖 **외부 서비스 통합:**  
> → `modules/integrations.md`

Scheduler는 통합 서비스와 함께 사용하여 강력한 자동화 구현:

작업명은 'automated-workflow'이며, 매주 금요일 오후 6시에 실행됩니다. 실행되면 총 6단계로 진행됩니다. 첫째로 주간 데이터를 수집합니다. 둘째로 AI를 활용하여 데이터를 분석합니다. 셋째로 분석 결과로 리포트를 생성합니다. 넷째로 리포트를 Google Drive에 저장합니다. 다섯째로 Slack에 '주간 리포트가 생성되었습니다' 알림을 보냅니다. 여섯째로 리포트를 이메일로 발송합니다.

---

## 에러 처리

### 재시도 정책

작업을 등록할 때 retries와 retryDelay를 설정할 수 있습니다. retries는 최대 재시도 횟수이고 retryDelay는 재시도 간 대기 시간(밀리초)입니다. 예시로 retries를 3회, retryDelay를 5분(300000ms)으로 설정하며, 모든 재시도가 실패하면 onError 콜백에서 관리자에게 실패 알림을 보냅니다.

### 구현

executeWithRetry 함수는 작업을 실행하고 실패 시 재시도합니다. 최대 재시도 횟수까지 반복하며, 각 재시도 사이에 retryDelay만큼 대기합니다. 성공하면 즉시 종료합니다. 모든 재시도가 실패하면 onError 콜백이 있으면 실행하고, 마지막 에러를 발생시킵니다.

---

## Scheduler 엔진 구현

Scheduler 클래스는 전체 스케줄 엔진을 담당합니다. 내부에는 등록된 작업 목록과 실행 중인 cron 작업 목록을 각각 관리합니다.

register 메서드는 새 작업을 등록합니다. enabled가 명시적으로 false가 아니면 기본적으로 활성화로 설정하고, 활성화된 작업은 바로 cron에 등록하여 실행을 시작합니다.

startJob 메서드는 cron.schedule을 사용하여 지정된 스케줄에 따라 작업을 자동으로 실행하도록 설정합니다.

unregister 메서드는 해당 작업의 cron을 중지하고 등록 목록에서도 제거합니다.

runNow 메서드는 스케줄과 무관하게 즉시 작업을 실행합니다.

toggle 메서드는 작업을 활성화하거나 비활성화합니다. 활성화하면 cron을 시작하고, 비활성화하면 cron을 중지합니다.

마지막에서 전역 인스턴스로 Scheduler를 하나 생성하여 앱 전체에서 공유합니다.

---

## API 엔드포인트

GET /tasks 엔드포인트는 등록된 작업 전체를 조회하여 작업명, 스케줄, 활성화 여부, 다음 실행 시간을 반환합니다.

POST /tasks/:name/toggle 엔드포인트는 요청 본문의 enabled 값으로 해당 작업의 활성화 상태를 변경합니다.

POST /tasks/:name/run 엔드포인트는 해당 작업을 즉시 실행합니다. 성공하면 success를 반환하고, 실패하면 에러 메시지를 반환합니다.

GET /tasks/:name/history 엔드포인트는 해당 작업의 실행 로그를 실행 시간 내림차순으로 최근 100건까지 조회합니다.

---

## 모듈 종료 시 정리

> 📖 **모듈 생명주기:**  
> → `modules/system-design.md § 모듈 생명주기 § shutdown()`

모듈의 shutdown 함수에서 scheduler.unregister를 호출하여 해당 모듈이 등록한 작업을 제거합니다. 예시로 ledger 모듈은 종료 시 'ledger-monthly-summary' 작업을 제거합니다.

---

## 다음 실행 시간 계산

getNextRunTime 함수는 cron-parser 라이브러리를 사용하여 주어진 Cron 표현식의 다음 실행 시간을 계산합니다. 예시로 '0 9 * * *'(매일 오전 9시)의 다음 실행 시간을 반환합니다.

---

## 타임존 처리

cron-parser에 타임존 옵션을 설정할 수 있습니다. 예시로 'Asia/Seoul'로 설정하면 한국 시간 기준으로 다음 실행 시간을 계산합니다.

---

## 모니터링

### 대시보드

SchedulerDashboard 컴포넌트는 스케줄 현황을 요약하여 표시합니다. 전체 작업 수, 활성 작업 수, 성공률, 마지막 실행 시간의 네 가지 정보를 카드 형태로 보여줍니다.

### 알림

작업을 등록할 때 onError 콜백을 설정할 수 있습니다. 예시로 'important-task'는 실패 시 관리자 이메일로 '작업 실패 알림'을 발송하며, 본문에는 실패한 에러 메시지를 포함합니다.

---

## 성능 최적화

### 병렬 실행 제한

p-limit 라이브러리를 사용하여 동시에 실행되는 작업 수를 제한합니다. 예시로 최대 5개의 작업만 동시에 실행되도록 설정합니다. 대기 중인 작업들은 앞선 작업이 완료되면 순차적으로 실행됩니다.

### 중복 실행 방지

runningTasks라는 집합(Set)을 사용하여 현재 실행 중인 작업명을 추적합니다. executeTask가 호출될 때 이미 같은 작업이 실행 중이면 실행하지 않고 경고를 출력합니다. 작업이 완료되면 (성공이든 실패든) 해당 작업명을 집합에서 제거합니다.

---

## 📚 관련 문서

### 아키텍처
- 📖 `architecture/00-overview.md § Plugin Layer` - Scheduler의 위치
- 📖 `modules/system-design.md § 모듈 생명주기` - 작업 등록 시점

### 모듈 개발
- 📖 `modules/development-guide.md § Backend § index.ts` - 초기화 Hook
- 📖 `modules/default-modules.md § Subscription` - Scheduler 사용 예시

### 통합 서비스
- 📖 `modules/integrations.md` - 자동화 워크플로우

### 배포
- 📖 `deployment/updates.md § 자동 업데이트` - Scheduler 활용

---

## 🚀 다음 단계

Scheduler를 이해했다면:

1. **모듈 개발** → `modules/development-guide.md`
2. **통합 서비스** → `modules/integrations.md`
3. **자동화 구축** → 워크플로우 설계