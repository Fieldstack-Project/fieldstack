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

---

## DB 추상화

> 📌 **설계 결정:**  
> → `architecture/decisions.md § 결정 #3: DB 추상화`  
> - 단일 인터페이스로 모든 DB 지원  
> - 모듈은 DB 종류를 신경쓰지 않음  
> - Provider 패턴으로 확장 가능

Core에서 DB Provider를 추상화하여 **모듈은 DB 종류를 신경쓰지 않음**

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

> 📖 **모듈 개발 가이드:**  
> → `modules/development-guide.md § Backend 개발 § service.ts`

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

---

## 모듈별 DB 테이블 격리

> 📖 **모듈 시스템:**  
> → `modules/system-design.md § 데이터베이스 격리`

### 원칙

- 각 모듈은 **자신이 소유한 테이블만** 접근 가능
- 테이블명은 **모듈명을 prefix**로 사용 (예: `ledger_entries`, `subscription_services`)
- 모듈 간 데이터 공유는 **Event Bus** 또는 **API**를 통해서만 가능

### 예시

```typescript
// ✅ 허용: 자신의 테이블 접근
await db.query('SELECT * FROM ledger_entries WHERE user_id = ?', [userId]);

// ❌ 금지: 다른 모듈의 테이블 직접 접근
await db.query('SELECT * FROM subscription_services');

// ✅ 허용: Event Bus 사용
eventBus.emit('subscription:get-all', { userId });
```

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

```typescript
// apps/api/src/services/migration.ts

async function runAllMigrations() {
  const modules = await getEnabledModules();
  
  for (const module of modules) {
    const migrationsDir = `modules/${module.name}/backend/migrations`;
    
    if (await fs.pathExists(migrationsDir)) {
      await runModuleMigrations(module.name, migrationsDir);
    }
  }
}

async function runModuleMigrations(moduleName: string, dir: string) {
  const files = await fs.readdir(dir);
  const sqlFiles = files.filter(f => f.endsWith('.sql')).sort();
  
  for (const file of sqlFiles) {
    const executed = await checkMigrationExecuted(moduleName, file);
    
    if (!executed) {
      const sql = await fs.readFile(`${dir}/${file}`, 'utf-8');
      await db.query(sql);
      await markMigrationExecuted(moduleName, file);
      
      console.log(`✓ Migration: ${moduleName}/${file}`);
    }
  }
}
```

### 마이그레이션 기록

```sql
CREATE TABLE _migrations (
  id UUID PRIMARY KEY,
  module_name VARCHAR(100) NOT NULL,
  migration_file VARCHAR(255) NOT NULL,
  executed_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(module_name, migration_file)
);
```

---

## Provider 구현

### PostgreSQL Provider

```typescript
// packages/core/db/providers/postgres.ts

import { Pool } from 'pg';

export class PostgresProvider implements DBProvider {
  private pool: Pool;
  
  async connect() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL
    });
  }
  
  async query(sql: string, params?: any[]) {
    const result = await this.pool.query(sql, params);
    return result.rows;
  }
  
  async transaction(callback: () => Promise<void>) {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      await callback();
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
  
  async disconnect() {
    await this.pool.end();
  }
}
```

### SQLite Provider

```typescript
// packages/core/db/providers/sqlite.ts

import sqlite3 from 'sqlite3';
import { promisify } from 'util';

export class SQLiteProvider implements DBProvider {
  private db: sqlite3.Database;
  
  async connect() {
    this.db = new sqlite3.Database('./data/database.db');
  }
  
  async query(sql: string, params?: any[]) {
    const run = promisify(this.db.all.bind(this.db));
    return await run(sql, params);
  }
  
  async transaction(callback: () => Promise<void>) {
    await this.query('BEGIN TRANSACTION');
    
    try {
      await callback();
      await this.query('COMMIT');
    } catch (error) {
      await this.query('ROLLBACK');
      throw error;
    }
  }
  
  async disconnect() {
    const close = promisify(this.db.close.bind(this.db));
    await close();
  }
}
```

### Supabase Provider

```typescript
// packages/core/db/providers/supabase.ts

import { createClient, SupabaseClient } from '@supabase/supabase-js';

export class SupabaseProvider implements DBProvider {
  private client: SupabaseClient;
  
  async connect() {
    this.client = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_KEY!
    );
  }
  
  async query(sql: string, params?: any[]) {
    const { data, error } = await this.client.rpc('execute_sql', {
      query: sql,
      params
    });
    
    if (error) throw error;
    return data;
  }
  
  async transaction(callback: () => Promise<void>) {
    // Supabase는 트랜잭션을 함수로 처리
    await callback();
  }
  
  async disconnect() {
    // Supabase는 명시적 연결 종료 불필요
  }
}
```

### MongoDB Provider

```typescript
// packages/core/db/providers/mongodb.ts

import { MongoClient, Db } from 'mongodb';

export class MongoDBProvider implements DBProvider {
  private client: MongoClient;
  private db: Db;
  
  async connect() {
    this.client = new MongoClient(process.env.MONGODB_URI!);
    await this.client.connect();
    this.db = this.client.db();
  }
  
  async query(collection: string, operation: any) {
    // MongoDB는 SQL이 아니므로 API 변환
    return await this.db.collection(collection)[operation.method](
      operation.params
    );
  }
  
  async transaction(callback: () => Promise<void>) {
    const session = this.client.startSession();
    
    try {
      await session.withTransaction(async () => {
        await callback();
      });
    } finally {
      await session.endSession();
    }
  }
  
  async disconnect() {
    await this.client.close();
  }
}
```

---

## Provider 팩토리

> 📌 **Provider 선택 로직:**  
> → `architecture/decisions.md § 결정 #3`

```typescript
// packages/core/db/factory.ts

import { PostgresProvider } from './providers/postgres';
import { SQLiteProvider } from './providers/sqlite';
import { SupabaseProvider } from './providers/supabase';
import { MongoDBProvider } from './providers/mongodb';

export async function createDBProvider(): Promise<DBProvider> {
  const provider = process.env.DB_PROVIDER || 'sqlite';
  
  switch (provider) {
    case 'postgres':
      return new PostgresProvider();
    
    case 'sqlite':
      return new SQLiteProvider();
    
    case 'supabase':
      return new SupabaseProvider();
    
    case 'mongodb':
      return new MongoDBProvider();
    
    default:
      throw new Error(`Unknown DB provider: ${provider}`);
  }
}

// 전역 인스턴스
let dbInstance: DBProvider;

export async function getDB(): Promise<DBProvider> {
  if (!dbInstance) {
    dbInstance = await createDBProvider();
    await dbInstance.connect();
  }
  
  return dbInstance;
}
```

---

## 모듈에서의 DB 사용

> 📖 **모듈 개발:**  
> → `modules/development-guide.md § Backend 개발`

### 기본 쿼리

```typescript
// modules/ledger/backend/service.ts
import { db } from '@core/db';

export async function list(userId: string) {
  return await db.query(
    'SELECT * FROM ledger_entries WHERE user_id = ? ORDER BY date DESC',
    [userId]
  );
}

export async function create(data: LedgerEntry) {
  return await db.query(
    'INSERT INTO ledger_entries (id, user_id, amount, date) VALUES (?, ?, ?, ?)',
    [data.id, data.userId, data.amount, data.date]
  );
}
```

### 트랜잭션

```typescript
export async function transferFunds(from: string, to: string, amount: number) {
  await db.transaction(async () => {
    // 출금
    await db.query(
      'UPDATE accounts SET balance = balance - ? WHERE id = ?',
      [amount, from]
    );
    
    // 입금
    await db.query(
      'UPDATE accounts SET balance = balance + ? WHERE id = ?',
      [amount, to]
    );
    
    // 기록
    await db.query(
      'INSERT INTO transactions (from_id, to_id, amount) VALUES (?, ?, ?)',
      [from, to, amount]
    );
  });
}
```

---

## 스키마 정의

> 📖 **모듈 구조:**  
> → `modules/development-guide.md § schema.ts`

```typescript
// modules/ledger/backend/schema.ts

export const schema = {
  tableName: 'ledger_entries',
  columns: {
    id: { type: 'uuid', primaryKey: true },
    user_id: { type: 'uuid', nullable: false },
    amount: { type: 'decimal', precision: 10, scale: 2 },
    category: { type: 'string', maxLength: 100 },
    date: { type: 'date', nullable: false },
    created_at: { type: 'timestamp', default: 'now()' },
    updated_at: { type: 'timestamp', default: 'now()' }
  },
  indexes: [
    { columns: ['user_id'] },
    { columns: ['date'] },
    { columns: ['user_id', 'date'] }
  ],
  foreignKeys: [
    {
      columns: ['user_id'],
      references: { table: 'users', columns: ['id'] },
      onDelete: 'CASCADE'
    }
  ]
};
```

---

## 쿼리 빌더 (선택)

복잡한 쿼리를 위한 빌더 제공:

```typescript
// packages/core/db/query-builder.ts

export class QueryBuilder {
  private table: string;
  private conditions: string[] = [];
  private params: any[] = [];
  private orderBy: string[] = [];
  
  constructor(table: string) {
    this.table = table;
  }
  
  where(column: string, operator: string, value: any) {
    this.conditions.push(`${column} ${operator} ?`);
    this.params.push(value);
    return this;
  }
  
  order(column: string, direction: 'ASC' | 'DESC' = 'ASC') {
    this.orderBy.push(`${column} ${direction}`);
    return this;
  }
  
  async get(): Promise<any[]> {
    let sql = `SELECT * FROM ${this.table}`;
    
    if (this.conditions.length > 0) {
      sql += ` WHERE ${this.conditions.join(' AND ')}`;
    }
    
    if (this.orderBy.length > 0) {
      sql += ` ORDER BY ${this.orderBy.join(', ')}`;
    }
    
    return await db.query(sql, this.params);
  }
}

// 사용
const entries = await new QueryBuilder('ledger_entries')
  .where('user_id', '=', userId)
  .where('amount', '>', 0)
  .order('date', 'DESC')
  .get();
```

---

## 연결 풀 관리

```typescript
// packages/core/db/pool.ts

interface PoolConfig {
  min: number;
  max: number;
  idleTimeoutMillis: number;
}

const defaultPoolConfig: PoolConfig = {
  min: 2,
  max: 10,
  idleTimeoutMillis: 30000
};

export class ConnectionPool {
  private config: PoolConfig;
  private provider: DBProvider;
  
  constructor(provider: DBProvider, config?: Partial<PoolConfig>) {
    this.provider = provider;
    this.config = { ...defaultPoolConfig, ...config };
  }
  
  async getConnection(): Promise<DBProvider> {
    // 연결 풀에서 가져오기
    return this.provider;
  }
  
  async releaseConnection(connection: DBProvider) {
    // 연결 반환
  }
}
```

---

## 백업 & 복원

### PostgreSQL 백업

```bash
#!/bin/bash
# backup-postgres.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="./backups"

pg_dump -U finance finance | gzip > $BACKUP_DIR/db_$DATE.sql.gz

echo "✓ Backup created: db_$DATE.sql.gz"
```

### SQLite 백업

```bash
#!/bin/bash
# backup-sqlite.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="./backups"

cp ./data/database.db $BACKUP_DIR/db_$DATE.db

echo "✓ Backup created: db_$DATE.db"
```

### 복원

```typescript
// apps/api/src/services/restore.ts

export async function restoreDatabase(backupFile: string) {
  const provider = process.env.DB_PROVIDER;
  
  switch (provider) {
    case 'postgres':
      await execAsync(`psql -U finance finance < ${backupFile}`);
      break;
    
    case 'sqlite':
      await fs.copy(backupFile, './data/database.db');
      break;
    
    case 'supabase':
      // Supabase는 UI에서 복원
      throw new Error('Supabase는 대시보드에서 복원하세요');
  }
}
```

---

## 모니터링

### 쿼리 로깅

```typescript
// packages/core/db/logger.ts

export function logQuery(sql: string, params: any[], duration: number) {
  if (process.env.LOG_QUERIES === 'true') {
    console.log(`[DB] ${duration}ms - ${sql}`, params);
  }
  
  // 느린 쿼리 경고
  if (duration > 1000) {
    console.warn(`⚠️ Slow query (${duration}ms): ${sql}`);
  }
}

// 사용
const start = Date.now();
const result = await db.query(sql, params);
const duration = Date.now() - start;

logQuery(sql, params, duration);
```

### 연결 상태 체크

```typescript
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    await db.query('SELECT 1');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
}
```

---

## 보안

### SQL Injection 방지

```typescript
// ❌ 위험: SQL Injection 가능
const sql = `SELECT * FROM users WHERE email = '${email}'`;

// ✅ 안전: Prepared Statement
const sql = 'SELECT * FROM users WHERE email = ?';
const result = await db.query(sql, [email]);
```

### 암호화

```typescript
// 민감한 데이터 암호화
import { encrypt, decrypt } from '@core/crypto';

export async function saveApiKey(userId: string, apiKey: string) {
  const encrypted = encrypt(apiKey);
  
  await db.query(
    'UPDATE users SET api_key = ? WHERE id = ?',
    [encrypted, userId]
  );
}
```

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