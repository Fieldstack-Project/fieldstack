# 핵심 아키텍처 결정 사항

> 이 문서는 Finance System의 핵심 설계 결정 사항을 기록합니다.  
> 모든 개발과 문서는 이 결정을 기반으로 진행됩니다.

**최종 업데이트:** 2025-01-29  
**문서 버전:** 1.0.0

---

## 📌 결정 원칙

프로젝트의 모든 기술적 결정은 다음 원칙을 따릅니다:

1. **단순함 우선** - 복잡한 것보다 작동하는 단순한 것
2. **사용자 경험** - 개발자가 아닌 일반 사용자 관점
3. **유지보수성** - 10년 후에도 이해 가능한 코드
4. **점진적 개선** - 완벽보다 작동하는 MVP
5. **명확한 문서** - 코드보다 문서가 먼저

---

## 결정 #1: Module Loader 방식

### ✅ 결정 사항

**런타임 동적 Import + Hot Reload 방식**을 채택합니다.

### 📖 배경

모듈 시스템은 본 프로젝트의 핵심 기능입니다. WordPress 플러그인이나 VSCode 확장처럼 사용자가 쉽게 기능을 추가/제거할 수 있어야 합니다.

### 🔍 고려했던 옵션

#### Option A: 런타임 동적 Import ⭐ (선택)
```
장점:
- 서버 재시작 불필요
- 사용자 경험 최상 (VSCode 방식)
- Hot Reload 가능

단점:
- 구현 복잡도 높음
- TypeScript 빌드 통합 필요
- 메모리 관리 주의
```

#### Option B: 빌드타임 번들링
```
장점:
- 구현 간단
- 안정적

단점:
- 모듈 추가 시 재빌드 필요
- 서버 재시작 필수
- 사용자 경험 나쁨
```

#### Option C: 플러그인 시스템
```
장점:
- 중간 복잡도

단점:
- Core의 Plugin과 혼동 가능
- 명확한 구분 어려움
```

### 💡 선택 이유

**Option A**를 선택한 이유:

1. **사용자 경험 최우선**
   - 모듈 설치 시 서버 재시작 불필요
   - 로딩 UI만 보다가 자동 새로고침
   - 사용자는 F5 누를 필요 없음

2. **VSCode 확장 방식**
   ```
   사용자: "확장 설치" 버튼 클릭
   → 백그라운드 다운로드 및 설치
   → "확장을 사용하려면 새로고침 필요" 알림
   → "새로고침" 버튼 클릭
   → 즉시 사용 가능
   ```

3. **명확한 역할 분리**
   - **Module**: 사용자가 설치하는 기능 (Ledger, TODO 등)
   - **Plugin**: Core 내부 시스템용 (Scheduler, AI 등)

### 🎯 구현 방향

#### 사용자 관점 플로우
```
1. 마켓플레이스에서 "설치" 버튼 클릭
   ↓
2. 모달 표시: "설치 중..." (진행률 표시)
   ↓
3. Backend 백그라운드 작업:
   - Git clone
   - 보안 검사
   - npm install
   - DB 마이그레이션
   - 런타임 로드
   ↓
4. WebSocket으로 Frontend에 알림
   ↓
5. "설치 완료! 새로고침 중..." 자동 새로고침
   ↓
6. 새 모듈이 메뉴에 표시됨
```

#### 기술 구현 방향

```typescript
// packages/core/loader/index.ts

export class ModuleLoader {
  /**
   * 모듈 설치 + 자동 로드
   * VSCode 확장 방식 구현
   */
  async installAndLoad(moduleId: string): Promise<void> {
    // 1. 다운로드 및 검증
    await this.downloadModule(moduleId);
    await this.validateSecurity(moduleId);
    
    // 2. 의존성 설치
    await this.installDependencies(moduleId);
    
    // 3. DB 마이그레이션
    await this.runMigrations(moduleId);
    
    // 4. 런타임 동적 로드
    await this.loadModuleRuntime(moduleId);
    
    // 5. 라우트 등록
    await this.registerRoutes(moduleId);
    
    // 6. Frontend 알림
    this.notifyFrontend('module:installed', { moduleId });
  }
  
  /**
   * Hot Reload (개발 모드)
   */
  async reloadModule(moduleId: string): Promise<void> {
    // 1. 기존 모듈 정리
    await this.unloadModule(moduleId);
    
    // 2. require.cache 제거
    this.clearRequireCache(moduleId);
    
    // 3. 재로드
    await this.loadModuleRuntime(moduleId);
  }
}
```

### 📚 관련 문서

> 📖 **상세 구현 가이드:**  
> → `technical/module-loader.md` (작성 예정)

> 📖 **모듈 개발 가이드:**  
> → `modules/development-guide.md`

> 📖 **사용자 설치 가이드:**  
> → `marketplace/installation.md`

### ⚠️ 주의사항

1. **메모리 누수 방지**
   - `require.cache` 적절히 관리
   - 모듈 unload 시 이벤트 리스너 제거

2. **보안**
   - 모듈 설치 전 항상 검증
   - 악성 코드 패턴 스캔

3. **에러 처리**
   - 설치 실패 시 자동 롤백
   - 사용자에게 명확한 에러 메시지

---

## 결정 #2: 관리자 인증 방식

### ✅ 결정 사항

**Google OAuth + 4~6자리 PIN** 방식을 채택합니다.

### 📖 배경

시스템에는 두 가지 수준의 접근이 필요합니다:
- **일반 접근**: 앱 사용 (가계부 입력 등)
- **관리자 접근**: 중요 설정 변경 (사용자 관리, DB 설정 등)

### 🔍 고려했던 옵션

#### Option A: OAuth + 복잡한 비밀번호
```
장점:
- 높은 보안

단점:
- 홈서버 환경에 과도함
- 사용자 혼란 (OAuth 비번? 관리자 비번?)
- 관리 복잡
```

#### Option B: OAuth + Role만
```
장점:
- 매우 간단

단점:
- 보안 부족
- 관리자 설정 보호 안 됨
```

#### Option C: OAuth + PIN ⭐ (선택)
```
장점:
- 간단하면서 적절한 보안
- 홈서버 환경에 적합
- 스마트폰 잠금 화면과 유사한 UX

단점:
- 복잡한 비밀번호보다는 보안 낮음
```

#### Option D: OAuth + 2FA
```
장점:
- 매우 높은 보안

단점:
- 홈서버에 과도함
- 구현 복잡도 높음
```

### 💡 선택 이유

**Option C**를 선택한 이유:

1. **적절한 보안 수준**
   - 홈서버 환경: 물리적 보안 + OAuth + PIN으로 충분
   - 4~6자리로도 충분한 보호
   - 30분 세션으로 재입력 최소화

2. **사용자 친화적**
   - 간단히 외울 수 있는 숫자
   - 스마트폰 잠금과 동일한 UX
   - 숫자 패드로 빠른 입력

3. **구현 단순성**
   - bcrypt/pbkdf2로 안전하게 저장
   - 세션 관리 간단
   - 2FA보다 복잡도 낮음

### 🎯 구현 방향

#### 사용자 플로우

```
일반 사용:
  Google 로그인 → 앱 사용 (가계부 입력 등)

관리자 설정 접근:
  Google 로그인 (이미 됨)
    ↓
  관리자 설정 메뉴 클릭
    ↓
  PIN 입력 모달 표시
    ↓
  PIN 확인
    ↓
  30분간 관리자 권한 (세션)
    ↓
  브라우저 닫거나 30분 후 → 다시 PIN 입력
```

#### 기술 구현

```typescript
// packages/core/auth/admin.ts

export class AdminAuthService {
  /**
   * 초기 설치 시 관리자 PIN 생성
   */
  async setupAdminPin(email: string, pin: string): Promise<void> {
    // PIN 검증 (4~6자리 숫자)
    if (!/^\d{4,6}$/.test(pin)) {
      throw new Error('PIN은 4~6자리 숫자여야 합니다');
    }
    
    // 암호화 저장 (pbkdf2)
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(pin, salt, 10000, 64, 'sha512')
      .toString('hex');
    
    await db.allowedUsers.update({
      where: { email },
      data: { 
        role: 'admin',
        admin_pin_salt: salt,
        admin_pin_hash: hash
      }
    });
  }
  
  /**
   * PIN 검증 + 세션 생성
   */
  async verifyAndCreateSession(
    userId: string, 
    pin: string
  ): Promise<string> {
    // PIN 검증
    const valid = await this.verifyPin(userId, pin);
    if (!valid) {
      // 감사 로그
      await this.logFailedAttempt(userId);
      throw new Error('PIN이 올바르지 않습니다');
    }
    
    // 세션 생성 (30분)
    const sessionId = crypto.randomUUID();
    await db.adminSessions.create({
      data: {
        id: sessionId,
        user_id: userId,
        expires_at: new Date(Date.now() + 30 * 60 * 1000)
      }
    });
    
    return sessionId;
  }
}
```

#### UI 구현

```typescript
// apps/web/src/components/AdminPinModal.tsx

export function AdminPinModal({ open, onSuccess }) {
  const [pin, setPin] = useState('');
  
  return (
    <Modal open={open} title="🔐 관리자 인증">
      <p>관리자 설정에 접근하려면 PIN을 입력하세요</p>
      
      {/* 숫자 패드 UI */}
      <PinInput
        length={6}
        value={pin}
        onChange={setPin}
        onComplete={handleVerify}
      />
      
      <p className="text-sm text-gray-600">
        💡 이 인증은 30분간 유효합니다
      </p>
    </Modal>
  );
}
```

### 🔒 보안 강화

```typescript
// Rate Limiting
// 5회 실패 시 5분 잠금
const RATE_LIMIT = {
  attempts: 5,
  window: 5 * 60 * 1000  // 5분
};

// 감사 로그
interface AuditLog {
  userId: string;
  action: 'pin_verify_success' | 'pin_verify_failed';
  ipAddress: string;
  timestamp: Date;
}
```

### 📚 관련 문서

> 📖 **상세 인증 가이드:**  
> → `technical/authentication.md § 3. 관리자 인증`

> 📖 **보안 정책:**  
> → `security/access-control.md` (작성 예정)

### ⚠️ 주의사항

1. **Rate Limiting 필수**
   - 5회 실패 → 5분 잠금
   - 감사 로그 기록

2. **세션 관리**
   - 30분 타임아웃
   - 브라우저 닫으면 삭제
   - 만료된 세션 자동 정리

3. **선택적 강화**
   - 필요시 2FA 추가 가능 (고급 옵션)
   - PIN 변경 주기 알림 (선택)

---

## 결정 #3: DB 추상화 레벨

### ✅ 결정 사항

**Query Builder 방식**의 중간 레벨 추상화를 채택합니다.

### 📖 배경

다양한 DB(PostgreSQL, SQLite, Supabase, MongoDB)를 지원하면서도:
- 모듈 개발자가 쉽게 사용할 수 있어야 함
- "알잘딱하게 잘 작동"해야 함
- 복잡한 ORM은 피하고 싶음

### 🔍 고려했던 옵션

#### Option A: Raw SQL + Provider별 구현
```
장점:
- 완전한 제어
- 성능 최고

단점:
- DB별 SQL 차이 처리 복잡
- 모듈 개발자 부담 큼
```

#### Option B: ORM (Prisma, TypeORM)
```
장점:
- 타입 안전
- 자동 마이그레이션

단점:
- 무거움
- 학습 곡선
- 오버헤드
```

#### Option C: Query Builder ⭐ (선택)
```
장점:
- 적절한 추상화
- 가벼움
- 유연함
- 직관적

단점:
- 직접 구현 필요
```

### 💡 선택 이유

**Option C**를 선택한 이유:

1. **적절한 추상화 레벨**
   - Raw SQL보다 안전하고 간편
   - ORM보다 가볍고 이해하기 쉬움
   - 필요 시 Raw SQL 직접 사용 가능

2. **모듈 개발자 친화적**
   ```typescript
   // 간단하고 직관적
   const entries = await db
     .table('ledger_entries')
     .where('user_id', userId)
     .orderBy('date', 'desc')
     .limit(50)
     .get();
   ```

3. **다양한 DB 지원**
   - 각 Provider가 Query Builder를 SQL로 변환
   - PostgreSQL: `$1, $2` 플레이스홀더
   - SQLite: `?, ?` 플레이스홀더
   - MongoDB: Query Object로 변환

### 🎯 구현 방향

#### Query Builder API

```typescript
// packages/core/db/index.ts

export interface DBClient {
  // Query Builder
  table(name: string): QueryBuilder;
  
  // Raw Query (필요 시)
  query(sql: string, params?: any[]): Promise<any[]>;
  
  // 트랜잭션
  transaction<T>(fn: (trx: DBClient) => Promise<T>): Promise<T>;
}

export class QueryBuilder {
  // 체이닝 API (Knex 스타일)
  select(...columns: string[]): this;
  where(column: string, value: any): this;
  orderBy(column: string, direction: 'asc' | 'desc'): this;
  limit(n: number): this;
  offset(n: number): this;
  
  // 실행
  async get(): Promise<any[]>;
  async first(): Promise<any | null>;
  async insert(data: any): Promise<any>;
  async update(data: any): Promise<number>;
  async delete(): Promise<number>;
}
```

#### 사용 예시

```typescript
// modules/ledger/backend/service.ts

export async function getLedgerEntries(userId: string) {
  // 간단한 쿼리
  return await db
    .table('ledger_entries')
    .where('user_id', userId)
    .where('date', '>=', '2025-01-01')
    .orderBy('date', 'desc')
    .limit(50)
    .get();
}

export async function createEntry(data: any) {
  // 삽입
  return await db
    .table('ledger_entries')
    .insert({
      ...data,
      created_at: new Date(),
      updated_at: new Date()
    });
}

export async function updateEntry(id: string, data: any) {
  // 업데이트
  return await db
    .table('ledger_entries')
    .where('id', id)
    .update(data);
}

// 복잡한 쿼리는 Raw SQL
export async function complexQuery() {
  return await db.query(`
    SELECT 
      category,
      SUM(amount) as total
    FROM ledger_entries
    WHERE user_id = $1
    GROUP BY category
  `, [userId]);
}
```

#### Provider 구현

```typescript
// packages/core/db/providers/postgres.ts

export class PostgresProvider implements DBClient {
  table(name: string): QueryBuilder {
    return new QueryBuilder(name, this, 'postgres');
  }
  
  // Query Builder → PostgreSQL SQL 변환
  toSQL(builder: QueryBuilder): { text: string; values: any[] } {
    // SELECT * FROM table WHERE col = $1 AND col2 = $2
    // RETURNING * (INSERT용)
  }
}

// packages/core/db/providers/sqlite.ts

export class SQLiteProvider implements DBClient {
  toSQL(builder: QueryBuilder): { text: string; values: any[] } {
    // SELECT * FROM table WHERE col = ? AND col2 = ?
    // LAST_INSERT_ROWID() (INSERT용)
  }
}

// packages/core/db/providers/mongodb.ts

export class MongoDBProvider implements DBClient {
  // Query Builder → MongoDB Query Object
  toMongoQuery(builder: QueryBuilder): object {
    // { userId: xxx, date: { $gte: xxx } }
  }
}
```

### 📚 관련 문서

> 📖 **상세 DB 가이드:**  
> → `technical/database.md § 2. DB 추상화`

> 📖 **Provider 개발:**  
> → `technical/database-providers.md` (작성 예정)

> 📖 **마이그레이션:**  
> → `technical/migrations.md` (작성 예정)

### ⚠️ 주의사항

1. **트랜잭션 사용**
   ```typescript
   await db.transaction(async (trx) => {
     await trx.table('entries').insert(entry);
     await trx.table('accounts').update(balance);
   });
   ```

2. **SQL Injection 방지**
   - 항상 파라미터 바인딩 사용
   - Raw SQL 사용 시 주의

3. **성능**
   - 복잡한 Join은 Raw SQL 권장
   - N+1 문제 주의

---

## 📝 요약표

| 결정 | 선택 | 핵심 이유 | 상태 |
|------|------|----------|------|
| #1 Module Loader | 런타임 동적 Import | VSCode 방식 UX | ✅ 확정 |
| #2 관리자 인증 | OAuth + PIN | 간단하면서 안전 | ✅ 확정 |
| #3 DB 추상화 | Query Builder | 적절한 레벨 | ✅ 확정 |

---

## 🔄 변경 이력

| 날짜 | 버전 | 변경 내용 |
|------|------|----------|
| 2025-01-29 | 1.0.0 | 최초 작성 (#1, #2, #3) |

---

## 📌 다음 단계

### 즉시 진행 (Step 1)
- ✅ 핵심 결정 사항 문서화 완료
- 🔄 기존 문서에 교차 참조 추가 시작

### 문서 정리 (Step 3)
1. `architecture/overview.md` - Frontend 서빙 로직 명확화
2. `technical/authentication.md` - OAuth + PIN으로 수정
3. `modules/development-guide.md` - 교차 참조 추가

### 구현 시작 (Step 2)
- 문서 정리 완료 후 코어 구현 시작

---

> 💡 **중요:**  
> 이 문서의 결정사항은 프로젝트 전반에 영향을 미칩니다.  
> 변경이 필요한 경우 반드시 문서를 업데이트하고 버전을 올립니다.