# 데이터베이스 마이그레이션 자동화 (DB Migrations)

## 개요

Fieldstack은 모듈형 시스템으로, 각 모듈이 필요한 데이터베이스 테이블과 스키마를 독립적으로 관리합니다.
모듈이 설치되거나 업데이트될 때, Core는 자동으로 해당 모듈의 마이그레이션 파일을 실행하여 스키마를 최신 상태로 유지합니다.

## 마이그레이션 파일 관리

### 디렉터리 구조
각 모듈의 `backend/migrations/` 폴더 내에 SQL 파일을 배치합니다.

```
modules/ledger/backend/migrations/
├── 001_initial.sql
├── 002_add_tags_column.sql
└── 003_fix_indexes.sql
```

### 파일 명명 규칙
`NNN_description.sql` 형식을 따르며, `NNN`은 3자리 숫자(001, 002...)로 실행 순서를 나타냅니다.

## 마이그레이션 실행 로직

### 1. 버전 추적 (`_migrations` 테이블)
Core는 데이터베이스 내에 `_migrations` 테이블을 생성하여 각 모듈별 현재 적용된 마이그레이션 버전을 기록합니다.

```sql
CREATE TABLE _migrations (
  module_name TEXT PRIMARY KEY,
  current_version INTEGER NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 2. 자동 실행 프로세스
1. **모듈 로드**: 모듈 로더가 모듈을 활성화할 때 `migrations/` 폴더를 스캔합니다.
2. **버전 비교**: `_migrations` 테이블에 기록된 버전보다 높은 숫자의 SQL 파일들만 필터링합니다.
3. **트랜잭션 실행**: 필터링된 파일들을 숫자 순서대로 하나의 트랜잭션 내에서 실행합니다.
4. **버전 갱신**: 성공 시 `_migrations` 테이블의 `current_version`을 최신 파일 번호로 업데이트합니다.

## DB Dialect 추상화

### SQL 문법 차이 해결
PostgreSQL과 SQLite 간의 문법 차이를 극복하기 위해, Core는 간단한 전처리기(Preprocessor)를 제공합니다.

#### 예시 (UUID / ID 생성)
```sql
-- migration.sql
CREATE TABLE items (
  id {{UUID_PRIMARY_KEY}},
  name TEXT NOT NULL
);
```

Core는 실행 전 `{{UUID_PRIMARY_KEY}}`를 다음과 같이 치환합니다:
- **PostgreSQL**: `UUID PRIMARY KEY DEFAULT gen_random_uuid()`
- **SQLite**: `TEXT PRIMARY KEY` (또는 로직에서 UUID 생성 주입)

## 마이그레이션 실패 시 대응

### 자동 롤백 (Atomic)
단일 마이그레이션 파일 내의 작업은 모두 하나의 트랜잭션으로 묶여 실행됩니다. 하나라도 실패하면 해당 파일 전체가 롤백되며, 모듈 로드가 중단됩니다.

### 복구 가이드
에러 로그를 확인하고, SQL 문법 오류를 수정한 후 서버를 재시작하거나 모듈을 다시 활성화하면 중단된 지점부터 다시 시도합니다.

## 📚 관련 문서
- 📖 `technical/01-database.md` - 데이터베이스 아키텍처
- 📖 `modules/01-development-guide.md` - 모듈 개발 가이드
