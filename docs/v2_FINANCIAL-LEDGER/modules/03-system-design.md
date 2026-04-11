# 모듈 시스템 설계 (System Design)

## 설계 원칙

### 1. 모듈 간 독립성 (Isolation)
모듈은 서로 직접적으로 `import` 할 수 없습니다. 이는 순환 참조를 방지하고 모듈의 탈부착을 자유롭게 하기 위함입니다.

### 2. 느슨한 결합 (Loose Coupling)
모듈 간의 데이터 교환이나 기능 호출은 **Event Bus** 또는 **Core Service Registry**를 통해서만 이루어집니다.

### 3. 단일 책임 (Single Responsibility)
각 모듈은 특정 비즈니스 도메인(가계부, 구독, 할 일 등)에 집중하며, 공통 인프라는 Core에 위임합니다.

## 서비스 호출 규약 (Service-to-Service)

### Core Service Registry
Core는 로드된 모든 모듈의 `Service` 인스턴스를 중앙 저장소(Registry)에서 관리합니다.

### 서비스 가져오기 (Dependency Injection)
모듈 내에서 다른 모듈의 기능을 사용해야 할 경우, Core Context를 통해 해당 모듈의 서비스를 요청합니다.

```typescript
// modules/subscription/backend/service.ts
class SubscriptionService {
  async handlePayment(userId: string, amount: number) {
    // Ledger 모듈의 서비스를 동적으로 가져옴
    const ledgerService = this.core.getService('ledger');
    
    if (ledgerService) {
      await ledgerService.createEntry({
        userId,
        amount,
        category: 'Fixed Expense',
        note: 'Subscription Payment'
      });
    }
  }
}
```

## 이벤트 버스 (Event Bus) 기반 통신
실시간 데이터 동기화나 백그라운드 작업은 이벤트를 발행(Publish)하고 구독(Subscribe)하는 방식으로 처리합니다.

### 시나리오 예시
1. **발행 (Module A)**: 사용자가 새 거래를 등록하면 `ledger:created` 이벤트를 발행합니다.
2. **구독 (Module B)**: 통계 모듈은 `ledger:created` 이벤트를 리스닝하고 있다가 자신의 통계 캐시를 갱신합니다.

## 보안 및 권한 격리

### DB 테이블 격리
모듈은 자신의 `module.json`에 정의된 테이블에만 직접 접근할 수 있습니다. 다른 모듈의 테이블을 직접 쿼리하는 것은 금지되며, 반드시 해당 모듈의 서비스를 통해 요청해야 합니다.

### 권한 체크 (Permission)
서비스 간 호출 시에도 현재 호출을 발생시킨 사용자의 권한을 체크하여 데이터 유출을 방지합니다.

## 모듈 생명주기 (Lifecycle Hooks)
모듈은 로드 및 언로드 시점에 특정 작업을 수행할 수 있도록 훅을 제공받습니다.

- **initialize()**: DB 마이그레이션, 이벤트 리스너 등록, 스케줄러 등록 등 초기 설정 수행.
- **shutdown()**: 리소스 해제, 리스너 제거 등 정리 작업 수행.

## 📚 관련 문서
- 📖 `modules/01-development-guide.md` - 상세 개발 방법
- 📖 `architecture/01-decisions.md § 결정 #1` - 모듈 로더 설계
