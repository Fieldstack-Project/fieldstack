# 데이터베이스 정책

> 📌 **핵심 아키텍처 결정:**  
> → `architecture/decisions.md § 결정 #3: DB 추상화` - Multi-provider 지원 + 통일된 인터페이스

**최종 업데이트:** 2025-01-29

---

## 멀티 DB 지원

사용자가 선택 가능:
- **Local PostgreSQL** (권장)
- **SQLite** (간단한 배포)
- **Supabase** (클라우드)
- **MongoDB** (NoSQL 선호 시)

---

## 설정 예시

### Local PostgreSQL

DB_PROVIDER를 'local'로 설정하고, DATABASE_URL에 로컬 PostgreSQL의 연결 주소를 넣습니다.

### Supabase

DB_PROVIDER를 'supabase'로 설정하고, SUPABASE_URL에 Supabase 프로젝트 URL을, SUPABASE_KEY에 API 키를 넣습니다.

### MongoDB

DB_PROVIDER를 'mongodb'로 설정하고, MONGODB_URI에 MongoDB의 연결 주소를 넣습니다.

---

## DB 추상화

> 📌 **설계 결정:**  
> → `architecture/decisions.md § 결정 #3: DB 추상화`  
> - 단일 인터페이스로 모든 DB 지원  
> - 모듈은 DB 종류를 신경쓰지 않음  
> - Provider 패턴으로 확장 가능

Core에서 DB Provider를 추상화하여 **모듈은 DB 종류를 신경쓰지 않음**

### 추상화 레이어 구조

DBProvider 인터페이스를 정의합니다. 모든 DB Provider는 동일하게 connect(연결), disconnect(연결 종료), query(쿼리 실행), transaction(트랜잭션 실행)의 네 가지 메서드를 제공해야 합니다. 이 인터페이스를 구현하는 Provider는 PostgresProvider, MongoDBProvider, SupabaseProvider, SQLiteProvider의 네 종류가 있습니다.

### 모듈에서의 사용

> 📖 **모듈 개발 가이드:**  
> → `modules/development-guide.md § Backend 개발 § service.ts`

모듈에서는 Core의 db 객체를 가져와 사용합니다. 실제로 뒤에서 어떤 DB가 돌고 있는지와 관계없이 동일한 인터페이스로 쿼리를 실행할 수 있습니다. 예시로는 ledger_entries 테이블에 새 항목을 삽입하는 것을 보여줍니다.

---

## 모듈별 DB 테이블 격리

> 📖 **모듈 시스템:**  
> → `modules/system-design.md § 데이터베이스 격리`

### 원칙

- 각 모듈은 **자신이 소유한 테이블만** 접근 가능
- 테이블명은 **모듈명을 prefix**로 사용 (예: `ledger_entries`, `subscription_services`)
- 모듈 간 데이터 공유는 **Event Bus** 또는 **API**를 통해서만 가능

### 예시

자신의 테이블인 ledger_entries에서 조회하는 것은 허용됩니다. 다른 모듈의 테이블인 subscription_services에 직접 접근하는 것은 금지됩니다. 다른 모듈의 데이터가 필요하면 Event Bus를 통해 요청해야 합니다.

---

## 마이그레이션 전략

> 📖 **모듈 구조:**  
> → `modules/development-guide.md § 프로젝트 구조`

각 모듈은 자체 마이그레이션 파일 관리:

```
modules/ledger/
└── backend/
    └── migrations/
        ├── 001_create_ledger_entries.sql
        └── 002_add_category_field.sql
```

### 마이그레이션 실행

Core가 모든 모듈의 마이그레이션을 자동으로 감지하고 실행:

runAllMigrations 함수는 활성화된 모든 모듈을 조회한 후, 각 모듈의 migrations 폴더가 존재하는지 확인하고 있으면 해당 모듈의 마이그레이션을 실행합니다.

runModuleMigrations 함수는 해당 폴더의 .sql 파일을 이름순으로 정렬한 후, 각 파일에 대해 이미 실행된 마이그레이션인지 확인합니다. 아직 실행되지 않은 파일이면 SQL을 읽어 실행하고, 실행 완료를 기록합니다.

### 마이그레이션 기록

_migrations 테이블을 생성합니다. 이 테이블은 어떤 모듈의 어떤 마이그레이션 파일이 언제 실행되었는지를 기록합니다. 같은 모듈의 같은 파일은 중복 실행되지 않도록 고유 제약조건이 있습니다.

---

## Provider 구현

### PostgreSQL Provider

PostgresProvider는 pg 라이브러리의 Pool을 사용합니다. connect 메서드는 환경 변수의 DATABASE_URL로 연결 풀을 생성합니다. query 메서드는 SQL과 파라미터를 받아 실행하고 결과의 행(rows)을 반환합니다. transaction 메서드는 연결 풀에서 클라이언트를 빌려 BEGIN을 실행한 후, 콜백 함수를 실행합니다. 콜백이 성공하면 COMMIT하고 실패하면 ROLLBACK한 후, 빌린 클라이언트를 반환합니다. disconnect 메서드는 연결 풀을 종료합니다.

### SQLite Provider

SQLiteProvider는 sqlite3 라이브러리를 사용합니다. connect 메서드는 ./data/database.db 경로의 파일을 열거나 없으면 생성합니다. query 메서드는 SQL과 파라미터를 받아 실행하고 결과를 반환합니다. transaction 메서드는 BEGIN TRANSACTION을 실행한 후 콜백을 실행하고, 성공하면 COMMIT, 실패하면 ROLLBACK합니다. disconnect 메서드는 데이터베이스 파일 연결을 닫습니다.

### Supabase Provider

SupabaseProvider는 @supabase/supabase-js 클라이언트를 사용합니다. connect 메서드는 환경 변수의 SUPABASE_URL과 SUPABASE_KEY로 클라이언트를 생성합니다. query 메서드는 Supabase의 RPC 기능을 활용하여 SQL과 파라미터를 실행합니다. 에러가 발생하면 바로 throw합니다. transaction 메서드는 콜백을 바로 실행합니다 (Supabase는 함수 단위로 트랜잭션을 처리). disconnect는 Supabase의 특성상 명시적 종료가 불필요합니다.

### MongoDB Provider

MongoDBProvider는 mongodb 라이브러리의 MongoClient를 사용합니다. connect 메서드는 환경 변수의 MONGODB_URI로 연결하고, 기본 데이터베이스를 참조합니다. query 메서드는 컬렉션 이름과 작업 정보를 받아 해당 컬렉션에 지정된 메서드를 실행합니다 (MongoDB는 SQL이 아니므로 API 형태로 변환). transaction 메서드는 세션을 시작하고 withTransaction을 사용하여 콜백을 실행하고, 완료되면 세션을 종료합니다. disconnect 메서드는 MongoClient 연결을 닫습니다.

---

## Provider 팩토리

> 📌 **Provider 선택 로직:**  
> → `architecture/decisions.md § 결정 #3`

createDBProvider 함수는 환경 변수의 DB_PROVIDER 값에 따라 적절한 Provider 객체를 생성합니다. 기본값은 'sqlite'이며, 'postgres', 'sqlite', 'supabase', 'mongodb' 중 하나를 지정할 수 있습니다. 알 수 없는 Provider 이름이면 에러를 발생시킵니다.

getDB 함수는 전역 DB 인스턴스를 관리합니다. 처음 호출되면 createDBProvider로 Provider를 생성하고 연결한 후, 이후 호출에서는 같은 인스턴스를 반환합니다.

---

## 모듈에서의 DB 사용

> 📖 **모듈 개발:**  
> → `modules/development-guide.md § Backend 개발`

### 기본 쿼리

Core의 db 객체를 가져와 사용합니다. list 함수는 해당 사용자의 ledger_entries를 날짜 내림차순으로 조회합니다. create 함수는 새 항목의 ID, 사용자 ID, 금액, 날짜를 받아 테이블에 삽입합니다.

### 트랜잭션

transferFunds 함수는 한 계좌에서 다른 계좌로 금액을 이체하는 작업을 트랜잭션으로 묶습니다. 트랜잭션 내에서 출금 계좌의 잔액을 줄이고, 입금 계좌의 잔액을 늘리고, 이체 기록을 남깁니다. 중간에 에러가 발생하면 세 작업 모두 되돌려집니다.

---

## 스키마 정의

> 📖 **모듈 구조:**  
> → `modules/development-guide.md § schema.ts`

ledger_entries 테이블의 스키마를 정의합니다. 열 구성은 다음과 같습니다: id는 기본키인 UUID, user_id는 필수의 UUID, amount는 소수점 2자리까지 가능한 숫자, category는 최대 100자의 문자열, date는 필수의 날짜, created_at과 updated_at은 자동으로 현재 시간으로 설정됩니다.

인덱스는 세 종류를 정의합니다: user_id 단일 인덱스, date 단일 인덱스, user_id와 date의 복합 인덱스입니다.

외래키는 user_id가 users 테이블의 id를 참조하며, 해당 사용자가 삭제되면 관련 항목도 자동으로 삭제됩니다.

---

## 쿼리 빌더 (선택)

복잡한 쿼리를 위한 빌더 제공:

QueryBuilder 클래스는 테이블명을 받아 초기화됩니다. where 메서드는 조건을 추가하며, 여러 번 호출하면 AND로 연결됩니다. order 메서드는 정렬 열과 방향(오름차순/내림차순)을 지정합니다. get 메서드는 지금까지 설정된 조건과 정렬을 기반으로 SELECT 쿼리를 조립하여 실행하고 결과를 반환합니다.

사용 예시로 ledger_entries에서 특정 사용자의 금액이 0보다 큰 항목들을 날짜 내림차순으로 조회하는 것을 보여줍니다.

---

## 연결 풀 관리

ConnectionPool 클래스는 DB 연결 풀의 설정과 Provider를 관리합니다. 기본 설정은 최소 2개, 최대 10개의 연결을 유지하며, 30초 동안 사용되지 않은 연결은 자동으로 닫힙니다. getConnection 메서드는 연결 풀에서 사용 가능한 연결을 가져오고, releaseConnection 메서드는 사용한 연결을 풀로 반환합니다.

---

## 백업 & 복원

### PostgreSQL 백업

백업 스크립트는 실행 시간을 날짜와 시간으로 포맷하여 파일명에 포함시킵니다. pg_dump 명령으로 finance 데이터베이스를 전체 덤프한 후 gzip으로 압축하여 backups/ 폴더에 저장합니다.

### SQLite 백업

백업 스크립트는 동일하게 날짜·시간을 파일명에 포함시키며, ./data/database.db 파일을 backups/ 폴더로 복사합니다.

### 복원

restoreDatabase 함수는 환경 변수의 DB_PROVIDER에 따라 복원 방법을 나눕니다. PostgreSQL은 psql 명령으로 백업 파일을 복원합니다. SQLite는 백업 파일을 ./data/database.db 경로로 복사합니다. Supabase는 직접 복원이 불가하여 대시보드에서 복원하라는 안내를 에러로 반환합니다.

---

## 모니터링

### 쿼리 로깅

logQuery 함수는 실행된 SQL, 파라미터, 실행 소요 시간을 로그로 기록합니다. LOG_QUERIES 환경 변수가 'true'로 설정되어 있을 때만 로그를 출력합니다. 실행 시간이 1초(1000ms)를 초과하면 느린 쿼리 경고를 별도로 출력합니다.

### 연결 상태 체크

checkDatabaseHealth 함수는 간단한 SELECT 1 쿼리를 실행하여 DB 연결이 정상인지 확인합니다. 성공하면 true, 실패하면 에러를 로깅하고 false를 반환합니다.

---

## 보안

### SQL Injection 방지

직접 문자열을 이어붙여 SQL을 만드면 SQL Injection 공격이 가능합니다. 대신 파라미터를 ? 플레이스홀더로 표시하고 별도로 전달하는 Prepared Statement 방식을 사용해야 합니다. db.query의 두 번째 인수로 파라미터를 배열로 넘기면 자동으로 안전하게 처리됩니다.

### 암호화

민감한 데이터는 저장 전에 암호화합니다. Core의 encrypt 함수를 사용하여 API Key 등의 정보를 암호화한 후 저장하고, 읽을 때는 decrypt 함수로 복호화합니다.

---

## 📚 관련 문서

### 핵심 아키텍처
- 📌 `architecture/decisions.md § 결정 #3` - DB 추상화 설계 결정
- 📖 `architecture/overview.md` - 전체 아키텍처
- 📖 `architecture/directory-structure.md` - 디렉터리 구조

### 모듈 개발
- 📖 `modules/development-guide.md § Backend 개발` - DB 사용 예시
- 📖 `modules/system-design.md § 데이터베이스 격리` - 격리 원칙

### 배포
- 📖 `deployment/installation.md` - DB 설정
- 📖 `deployment/configuration.md § 데이터베이스` - 설정 관리

---

## 🚀 다음 단계

DB 추상화를 이해했다면:

1. **모듈 개발** → `modules/development-guide.md`
2. **스키마 설계** → 테이블 구조 계획
3. **마이그레이션** → 버전 관리