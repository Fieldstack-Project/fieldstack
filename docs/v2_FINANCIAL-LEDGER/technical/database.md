# 데이터베이스 정책

## 멀티 DB 지원

사용자가 선택 가능:
- **Local PostgreSQL** (권장)
- **SQLite** (간단한 배포)
- **Supabase** (클라우드)
- **MongoDB** (NoSQL 선호 시)

## 설정 예시

### Local PostgreSQL
```env
DB_PROVIDER=local
DATABASE_URL=postgresql://localhost:5432/mydb
```

### Supabase
```env
DB_PROVIDER=supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_KEY=xxx
```

### MongoDB
```env
DB_PROVIDER=mongodb
MONGODB_URI=mongodb://localhost:27017/mydb
```

## DB 추상화

Core에서 DB Provider를 추상화하여 모듈은 DB 종류를 신경쓰지 않음

### 추상화 레이어 구조

```typescript
// packages/core/db/index.ts
interface DBProvider {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  query(sql: string, params?: any[]): Promise<any>;
  transaction(callback: () => Promise<void>): Promise<void>;
}

class PostgresProvider implements DBProvider { ... }
class MongoDBProvider implements DBProvider { ... }
class SupabaseProvider implements DBProvider { ... }
class SQLiteProvider implements DBProvider { ... }
```

### 모듈에서의 사용

```typescript
// modules/ledger/backend/service.ts
import { db } from '@core/db';

export async function createEntry(data: LedgerEntry) {
  // DB 종류와 관계없이 동일한 인터페이스 사용
  return await db.query(
    'INSERT INTO ledger_entries VALUES (?)',
    [data]
  );
}
```

## 모듈별 DB 테이블 격리

- 각 모듈은 자신이 소유한 테이블만 접근 가능
- 테이블명은 모듈명을 prefix로 사용 (예: `ledger_entries`, `subscription_services`)
- 모듈 간 데이터 공유는 Event Bus 또는 API를 통해서만 가능

## 마이그레이션 전략

각 모듈은 자체 마이그레이션 파일 관리:

```
modules/ledger/
└── backend/
    └── migrations/
        ├── 001_create_ledger_entries.sql
        └── 002_add_category_field.sql
```

Core가 모든 모듈의 마이그레이션을 자동으로 감지하고 실행