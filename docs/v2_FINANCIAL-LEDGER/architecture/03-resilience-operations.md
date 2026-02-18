## 📄 시스템 탄력성 운영 아키텍처 (System Resilience Operations)

이 문서는 Fieldstack의 장애 대응 전략을 커널 계층이 아닌 사용자 공간(Ring 3) 기준으로 정의합니다.
본 설계의 목적은 특권 제어가 아니라 서비스 가용성 유지입니다.

---

### 1. 설계 원칙

* **Single Runtime, Clear Recovery:** 애플리케이션은 단일 런타임으로 유지하고 복구 경로를 명확히 합니다.
* **Supervisor First:** 프로세스 생명주기 관리는 `systemd` 같은 OS 서비스 매니저가 담당합니다.
* **Graceful Degradation:** 일부 의존성(DB/API) 장애 시 전체 종료보다 안전 모드로 축소 동작합니다.
* **Operational Transparency:** 장애 감지, 복구 시도, 결과를 로그와 UI 상태로 명확히 노출합니다.

---

### 2. 실행 계층 정의

| 계층 | 역할 | 실행 위치 |
| --- | --- | --- |
| Application Core | 금융 원장 로직, API 처리, 이벤트 기록 | User space (Ring 3) |
| Resilience Layer | 헬스체크, 재시도 정책, 안전 모드 전환, 장애 요약 | User space (Ring 3) |
| Service Supervisor | 프로세스 자동 재시작, 부팅 자동 시작, 시작 제한 정책 | OS 서비스 매니저 (`systemd`) |

> 참고: 본 문서의 탄력성 설계는 커널 드라이버/안티치트 모델과 다른 범주입니다.

---

### 3. 장애 대응 시퀀스

1. **감지:** 앱 내부 헬스체크가 DB/API 타임아웃 또는 하트비트 이상을 감지합니다.
2. **완화:** 재시도, 서킷 브레이커, 읽기 전용/제한 모드로 즉시 전환합니다.
3. **기록:** 실패 원인, 영향 범위, 요청 ID를 구조화 로그로 남깁니다.
4. **복구:** 프로세스 비정상 종료 시 `systemd`가 재시작 정책에 따라 자동 복구합니다.
5. **보고:** `/health` 및 운영 대시보드에 복구 상태를 반영합니다.

---

### 4. 운영 구성 권장안

#### 4.1 `systemd` 서비스 정책

* `Restart=always`
* `RestartSec=3`
* `StartLimitIntervalSec`, `StartLimitBurst`로 재시작 폭주 방지
* 부팅 자동 시작(`systemctl enable`)

#### 4.2 애플리케이션 내부 안정화

* DB/API 호출에 `timeout + retry + circuit breaker`
* 치명적 예외는 즉시 실패하고, 비치명적 예외는 안전 모드로 격리
* 종료 시그널 처리(SIGTERM/SIGINT)로 안전 종료 보장

#### 4.3 관측성

* `/health`를 liveness/readiness 관점으로 분리
* 구조화 로그(JSON)와 장애 이벤트 태깅
* 운영 알림(Webhook/Email) 연동 포인트 정의

---

### 5. 기대 효과

* **단순성:** 과도한 이중 코어 구조 없이 운영 복잡도를 낮춥니다.
* **가용성:** 프로세스 장애 시 자동 복구 경로가 표준화됩니다.
* **명확성:** 보안 계층(Ring 0)과 운영 안정성 계층(Ring 3)을 혼동하지 않습니다.

---

### 6. 향후 과제

* [ ] 장애 등급(critical/major/minor) 기반 복구 정책 세분화
* [ ] 안전 모드에서 허용/차단 API 목록 명세화
* [ ] 복구 리포트 템플릿(원인, 조치, 재발 방지) 표준화
