# 자동 업데이트 시스템

## 개요

사용자가 설정한 시간대에 자동으로 시스템을 최신 버전으로 업데이트합니다.

## 업데이트 설정

### 웹 UI

```
설정 → 시스템 → 자동 업데이트

[✓] 자동 업데이트 활성화

업데이트 주기: [매일 ▼]
  - 매일
  - 매주 (요일 선택)
  - 매월

업데이트 시간: [03:00]

[ ] 업데이트 전 확인 받기
[✓] 유지보수 모드 사용

[저장]
```

### 설정 예시

**개인 사용자:**
```json
{
  "enabled": true,
  "schedule": "daily",
  "time": "03:00",
  "confirmBefore": false,
  "maintenanceMode": true
}
```

**팀 사용 (회사):**
```json
{
  "enabled": true,
  "schedule": "weekly",
  "day": "sunday",
  "time": "02:00",
  "confirmBefore": true,
  "maintenanceMode": true
}
```

**파워유저:**
```json
{
  "enabled": false
}
```

## 자동 업데이트 프로세스

```
1. 설정된 시간에 업데이트 체크
   ↓
2. 새 버전 발견?
   - 없으면 → 종료
   - 있으면 → 계속
   ↓
3. 활성 사용자 확인
   - 있으면 → 1시간 후 재시도
   - 없으면 → 계속
   ↓
4. 업데이트 전 확인 설정?
   - Yes → 관리자에게 알림 → 승인 대기
   - No → 바로 진행
   ↓
5. 유지보수 모드 활성화 (선택)
   ↓
6. 백업 생성
   - DB 백업
   - 코드 백업 (Git tag)
   - 설정 파일 백업
   ↓
7. 업데이트 실행
   - git pull (또는 Docker image pull)
   - npm install (의존성 업데이트)
   - DB 마이그레이션
   - 빌드
   ↓
8. 검증
   - Health check
   - 기본 API 테스트
   ↓
9. 서버 재시작
   ↓
10. 유지보수 모드 해제
    ↓
11. 완료 알림
```

## Backend 구현

### 업데이트 체커 (Scheduler)

`apps/api/src/services/update-checker.ts`의 `initUpdateChecker` 함수는 자동 업데이트를 초기화합니다.

먼저 업데이트 설정을 읽어 활성화 여부를 확인합니다. 비활성화되어 있으면 종료합니다.

활성화된 경우 `buildCronExpression` 함수로 cron 표현식을 생성합니다. 설정의 시간을 시와 분으로 분리하고, 주기에 따라 다음과 같이 변환합니다: daily는 매일 해당 시간, weekly는 해당 요일의 해당 시간(요일은 0=일요일), monthly는 매월 1일 해당 시간입니다.

생성된 cron 표현식으로 scheduler에 `auto-update` 작업을 등록합니다. 핸들러는 `runAutoUpdate`를 호출하며, 오류가 발생하면 관리자에게 "자동 업데이트 실패" 알림을 전송합니다.

### 업데이트 실행

`apps/api/src/services/updater.ts`의 `runAutoUpdate` 함수는 전체 업데이트 과정을 관리합니다.

먼저 최신 버전과 현재 버전을 확인합니다. 이미 최신이면 로그를 남기고 `{ upToDate: true }`를 반환합니다.

새 버전이 있으면 활성 사용자를 확인합니다. 활성 사용자가 있으면 업데이트를 연기하고 `{ postponed: true, reason: 'active_users' }`를 반환합니다.

업데이트 설정에서 `confirmBefore`가 활성화되어 있으면 관리자에게 승인 요청을 보내고 `{ pending: true, reason: 'awaiting_approval' }`을 반환합니다.

승인이 필요 없거나 승인된 경우, `maintenanceMode`가 활성화되어 있으면 유지보수 모드를 켭니다.

try 블록 내에서 백업을 생성하고, `gitPull`로 최신 코드를 가져오고, `installDependencies`로 의존성을 설치하고, `runMigrations`로 DB 마이그레이션을 실행하고, `build`로 빌드합니다. 이후 `validateUpdate`로 업데이트를 검증하고, `gracefulRestart`로 서버를 재시작합니다.

catch 블록에서 오류가 발생하면 롤백을 실행하고 오류를 throw합니다. finally 블록에서는 유지보수 모드가 활성화되어 있었다면 해제합니다.

`checkLatestVersion` 함수는 GitHub API의 `/releases/latest` 엔드포인트를 호출하여 최신 릴리스의 `tag_name`에서 `v`를 제거하여 반환합니다.

`gitPull` 함수는 `git pull origin main`을 실행하고 표준 출력과 에러를 로그로 기록합니다.

`installDependencies` 함수는 `pnpm install`을 실행합니다.

`runMigrations` 함수는 설치된 모듈 목록을 조회하여 각 모듈의 마이그레이션을 실행합니다.

`build` 함수는 `pnpm build`를 실행합니다.

`validateUpdate` 함수는 `http://localhost:3000/health`와 `/api/ping`에 fetch 요청을 보내 응답이 정상인지 확인합니다. 비정상이면 오류를 발생시킵니다.

### 백업 & 롤백

`apps/api/src/services/backup.ts`의 `createBackup` 함수는 현재 타임스탬프로 백업 디렉터리를 생성합니다.

먼저 `backupDatabase`로 DB를 gzip 압축하여 백업하고, `git tag backup-{timestamp}-v{version}`으로 현재 코드 상태를 태그로 기록합니다. 이후 `.env` 파일과 `modules` 디렉터리를 백업 디렉터리로 복사합니다. 백업 완료 후 백업 경로를 반환합니다.

`rollback` 함수는 롤백을 수행합니다. 백업 디렉터리 목록을 조회하여 가장 최근 백업을 찾습니다. 해당 백업의 태그를 체크아웃하고, 백업된 DB를 복원하고, `pnpm install`로 의존성을 재설치하고, `pnpm build`로 빌드하고, 서버를 재시작합니다.

### 유지보수 모드

`apps/api/src/services/maintenance.ts`는 전역 변수 `maintenanceMode`로 상태를 관리합니다.

`enableMaintenanceMode` 함수는 이 변수를 `true`로 설정하고 로그를 기록합니다. `disableMaintenanceMode` 함수는 `false`로 설정합니다. `isMaintenanceMode` 함수는 현재 상태를 반환합니다.

`maintenanceMiddleware`는 Express 미들웨어로 사용됩니다. 유지보수 모드가 활성화되어 있고 사용자가 관리자가 아니면, 503 상태와 "시스템 업데이트 중입니다" 메시지, 5분 후 재시도 안내를 반환합니다. 관리자이거나 유지보수 모드가 아니면 다음 미들웨어로 진행합니다.

## Frontend 구현

### 업데이트 알림

`apps/web/src/components/UpdateNotification.tsx`의 `UpdateNotification` 컴포넌트는 1시간마다 `/api/system/update/check`를 호출하여 새 버전 확인합니다.

응답에서 `available`이 true이면 `updateAvailable` 상태를 true로 설정하고 새 버전 번호를 저장합니다.

업데이트가 가능하면 "새 버전 사용 가능!" 알림과 버전 번호, "지금 업데이트"와 "나중에" 버튼을 표시합니다. 업데이트가 없으면 아무것도 렌더링하지 않습니다.

### 유지보수 모드 화면

`apps/web/src/pages/Maintenance.tsx`는 유지보수 화면을 렌더링합니다.

중앙에 🔧 아이콘, "시스템 업데이트 중" 제목, 안내 문구를 표시합니다. 무한 로딩 프로그레스 바와 "예상 완료 시간: 약 5분" 안내, 그리고 "이 페이지는 자동으로 새로고침됩니다" 알림이 포함됩니다.

## 수동 업데이트

### UI

`apps/web/src/pages/Settings/System/Updates.tsx`는 현재 버전과 최신 버전을 표시합니다.

"업데이트 확인" 버튼을 클릭하면 `handleCheckUpdate`가 실행됩니다. 업데이트가 가능하면 새 버전 안내 Alert와 변경 사항 목록, "지금 업데이트" 버튼이 표시됩니다. 변경 사항은 changelog 배열을 순회하며 리스트 형태로 렌더링됩니다.

### API

`apps/api/src/routes/system.ts`에 두 가지 라우트가 정의됩니다.

**`GET /update/check`** — 관리자 권한을 확인한 후 최신 버전과 현재 버전을 조회합니다. 두 버전이 다르면 `available: true`와 함께 현재 버전, 최신 버전, changelog를 반환합니다.

**`POST /update/start`** — 관리자 권한을 확인한 후 백그라운드에서 `runAutoUpdate`를 실행합니다. 오류가 발생하면 로그에 기록합니다. 즉시 "백그라운드에서 업데이트 시작됨" 응답을 반환합니다.

## Docker 환경

### Watchtower 통합

```yaml
# docker-compose.yml

services:
  app:
    image: your-org/finance-system:latest
    # ...
  
  watchtower:
    image: containrrr/watchtower
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
    environment:
      - WATCHTOWER_SCHEDULE=0 0 3 * * *  # 매일 새벽 3시
      - WATCHTOWER_CLEANUP=true
      - WATCHTOWER_INCLUDE_STOPPED=true
      - WATCHTOWER_NOTIFICATION_URL=${WEBHOOK_URL}
    restart: unless-stopped
```

## 알림 시스템

### 업데이트 알림

`apps/api/src/services/notifications.ts`의 `sendUpdateNotifications` 함수는 업데이트 전 알림을 스케줄링합니다.

24시간 전 알림은 scheduler에 `update-notification-24h` 작업으로 등록되며, 24시간 후 실행되어 관리자에게 "내일 새벽 3시에 자동 업데이트됩니다" 메시지를 전송합니다.

1시간 전 경고는 `update-warning-1h` 작업으로 등록되며, 1시간 후 실행되어 "1시간 후 자동 업데이트가 시작됩니다. 작업 중인 내용을 저장하세요"라는 높은 우선순위 메시지를 전송합니다.

`notifyUpdateComplete` 함수는 업데이트 완료 후 관리자에게 버전 정보와 함께 완료 알림을 전송합니다.

`notifyUpdateFailed` 함수는 업데이트 실패 시 오류 메시지를 포함하여 critical 우선순위로 관리자에게 알림을 전송합니다.

## 롤백

### UI

롤백 설정 카드는 warning 타입의 Alert로 "이전 버전으로 되돌립니다. 최신 데이터가 손실될 수 있습니다"는 경고를 표시합니다.

백업 목록을 Select로 제공하며, 각 옵션은 백업 ID를 값으로, 버전과 날짜를 레이블로 표시합니다.

"롤백 실행" 버튼은 `variant="danger"`로 강조되어 표시됩니다.