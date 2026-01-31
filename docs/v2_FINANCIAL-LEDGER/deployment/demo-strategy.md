# 데모 전략 문서

**버전:** 2.0  
**최종 업데이트:** 2026-01-31  
**상태:** 승인됨

---

## 📋 목차

1. [전략 개요](#전략-개요)
2. [핵심 원칙](#핵심-원칙)
3. [주요 변경사항](#주요-변경사항)
4. [기술 구현](#기술-구현)
5. [사용자 경험](#사용자-경험)
6. [구현 로드맵](#구현-로드맵)
7. [예상 효과](#예상-효과)
8. [리스크 & 대응](#리스크--대응)

---

## 전략 개요

### 목표

**"프레임워크로서의 Finance System을 체험하게 하라"**

가계부 앱이 아닌, **확장 가능한 개인 생산성 프레임워크**로서의 정체성을 명확히 전달하는 데모 경험 제공.

### 핵심 메시지

> "가계부는 시작일 뿐입니다. 필요한 모듈을 자유롭게 추가하세요."

### 전략적 포지셔닝

**AS-IS (기존 인식):**
- ❌ "또 하나의 가계부 앱"
- ❌ "기능이 제한적"
- ❌ "왜 Self-hosted를 해야 하나?"

**TO-BE (목표 인식):**
- ✅ "개인 생산성 프레임워크"
- ✅ "필요한 기능을 모듈로 확장"
- ✅ "커뮤니티가 함께 만드는 생태계"
- ✅ "완전한 제어권과 프라이버시"

---

## 핵심 원칙

### 1. 실제 설치와 동일한 경험

**WHY:**
- 데모와 실제 제품 간 격차 최소화
- 사용자가 Self-hosted 설치를 두려워하지 않게
- 전환율(Conversion) 극대화

**HOW:**
- OAuth 자동 로그인 (SKIP_OAUTH=true)
- 설치 마법사 전체 플로우 제공
- 임시 관리자 PIN: "1234"
- 실제 모듈 설치/제거 체험

### 2. 커뮤니티 생태계 노출

**WHY:**
- 프레임워크로서의 확장성 증명
- 커뮤니티 모듈 개발자에게 홍보 기회
- 다양성 시연 (금융 외 다른 용도 가능)

**HOW:**
- 마켓플레이스 전체 접근 허용
- 공식 모듈 + 커뮤니티 모듈 모두 설치 가능
- 모듈 개발 가이드 링크 제공

### 3. 비용 효율적 AI 체험

**WHY:**
- AI 기능은 핵심 차별점
- 무제한 제공 시 비용 폭탄
- 제한적이지만 충분한 체험 제공

**HOW:**
- 프로젝트 공용 Gemini Free API Key
- Rate Limiting (시간당 10회, 일일 30회)
- UI에 사용량 명확히 표시

### 4. 프레임워크 정체성 강조

**WHY:**
- 단순 가계부 앱과 차별화
- 장기적 비전 제시
- 개발자 커뮤니티 유도

**HOW:**
- 데모 완료 화면에 메시지 강조
- 홈페이지 구조 변경 (Core + Modules)
- 모듈 개발 가이드 강조

---

## 주요 변경사항

### 1. 실제 설치 경험 제공 ⭐

#### 기존 방식
```
데모 버튼 클릭 → 이미 설정된 환경 제공
```

#### 새로운 방식
```
데모 버튼 클릭 
  ↓
OAuth 자동 로그인 (사용자 입력 없음)
  ↓
설치 마법사 시작
  ↓
Welcome 화면
  ↓
DB 선택 (SQLite 자동 선택됨)
  ↓
AI 설정 (Gemini 이미 설정됨, 사용량 제한 안내)
  ↓
모듈 선택 (가계부, 구독 관리 기본 선택)
  ↓
설치 진행 (실제와 동일한 화면)
  ↓
완료 → 대시보드
```

**환경 변수:**
```env
DEMO_MODE=true
SKIP_OAUTH=true
AUTO_LOGIN_USER=demo@finance-system.dev
DEFAULT_ADMIN_PIN=1234
DEMO_GEMINI_KEY=<프로젝트 공용 키>
```

**장점:**
- ✅ 실제 설치와 동일한 경험
- ✅ Self-hosted 설치 과정 미리 체험
- ✅ 심리적 장벽 제거
- ✅ 전환율 향상 예상

### 2. 커뮤니티 모듈 전면 개방 🌐

#### 기존 계획
- 공식 모듈(가계부, 구독 관리)만 설치 가능
- 커뮤니티 모듈 차단

#### 새로운 방식
- **모든 모듈 설치 가능** (공식 + 커뮤니티)
- 마켓플레이스 전체 탐색 가능
- 모듈 검색, 상세 보기, 설치/제거 모두 가능

**마켓플레이스 UI:**
```
🏪 마켓플레이스

[검색창]

📂 카테고리
- 💰 금융 (12)
- 📊 생산성 (8)
- 🔧 유틸리티 (5)
- 🎨 테마 (3)

🔥 인기 모듈
┌──────────────┬──────────────┬──────────────┐
│ 💰 가계부    │ 📅 구독 관리  │ ₿ 암호화폐   │
│ 공식         │ 공식         │ 커뮤니티     │
│ [✓ 설치됨]   │ [✓ 설치됨]   │ [📥 설치]    │
└──────────────┴──────────────┴──────────────┘

📦 커뮤니티 모듈
- 📈 주식 포트폴리오 (by @stock-dev)
- 📝 TODO 관리 (by @productivity)
- 🏋️ 운동 기록 (by @fitness-tracker)
- 📚 독서 기록 (by @bookworm)
```

**장점:**
- ✅ 프레임워크 확장성 증명
- ✅ 커뮤니티 생태계 홍보
- ✅ 모듈 개발자에게 노출 기회
- ✅ 다양성 시연 (금융 외 용도)

**제한:**
- 데모 종료 시 모든 데이터 삭제 (24시간)
- 데이터 내보내기 불가 (canExportData: false)

### 3. AI 사용 제한 (Gemini Free) 🤖

#### 전략

**프로젝트 공용 Gemini API Key 사용:**
- Gemini Free Tier: 월 1,500 요청, 무료
- Rate Limiting으로 남용 방지
- 비용: 거의 0원

#### Rate Limiting 정책

**시간당 제한:**
```
- 10회 / 시간
- 초과 시: "AI 요청 한도를 초과했습니다. 1시간 후 다시 시도하세요."
```

**일일 제한:**
```
- 30회 / 일
- 초과 시: "오늘의 AI 요청 한도를 초과했습니다."
```

**요청당 토큰 제한:**
```
- 최대 500 토큰 / 요청
- 짧은 요약만 가능
```

**UI 표시:**
```
┌─────────────────────────────────────┐
│ 🤖 AI 요약                          │
│                                     │
│ 남은 AI 요청: 8/10 (시간당)         │
│                                     │
│ [AI 요약 생성]                      │
└─────────────────────────────────────┘
```

**구현:**
```typescript
// Redis 기반 Rate Limiting
const key = `demo:ai:${demoInstanceId}`;
const hourlyKey = `${key}:hourly`;
const dailyKey = `${key}:daily`;

// 시간당 체크
const hourlyCount = await redis.incr(hourlyKey);
if (hourlyCount === 1) {
  await redis.expire(hourlyKey, 3600); // 1시간
}
if (hourlyCount > 10) {
  throw new Error('Hourly AI limit exceeded');
}

// 일일 체크
const dailyCount = await redis.incr(dailyKey);
if (dailyCount === 1) {
  await redis.expire(dailyKey, 86400); // 24시간
}
if (dailyCount > 30) {
  throw new Error('Daily AI limit exceeded');
}
```

**장점:**
- ✅ 비용 거의 0원
- ✅ AI 기능 체험 가능
- ✅ 남용 방지
- ✅ 사용량 투명하게 표시

### 4. 프레임워크 정체성 강조 🏗️

#### 메시지 변경

**기존:**
> "개인 금융 관리 시스템"

**새로운:**
> "개인 생산성 프레임워크 (금융 관리는 시작일 뿐)"

#### 홈페이지 구조 변경

**기존 구조:**
```
Finance System
├─ 가계부
├─ 구독 관리
└─ 기능 소개
```

**새로운 구조:**
```
Finance System
├─ Core 인프라
│  ├─ 인증 & 보안
│  ├─ DB 추상화
│  ├─ AI 통합
│  └─ Module Loader
├─ 기본 모듈 (예시)
│  ├─ 💰 가계부
│  └─ 📅 구독 관리
└─ 커뮤니티 생태계
   ├─ 마켓플레이스
   ├─ 모듈 개발 가이드
   └─ 50+ 커뮤니티 모듈
```

#### 데모 완료 화면

```
┌─────────────────────────────────────┐
│                                     │
│        🎉 데모 체험 완료!           │
│                                     │
│   Finance System을 체험해주셔서      │
│   감사합니다!                        │
│                                     │
├─────────────────────────────────────┤
│                                     │
│ 📦 체험한 내용                       │
│ ✓ 프레임워크 설치 플로우             │
│ ✓ 기본 모듈 (가계부, 구독 관리)      │
│ ✓ 커뮤니티 모듈 탐색                 │
│ ✓ AI 기능 (요약, 분석)              │
│                                     │
├─────────────────────────────────────┤
│                                     │
│ 💡 이것은 시작일 뿐입니다            │
│                                     │
│ Finance System은 프레임워크입니다.   │
│                                     │
│ 가계부와 구독 관리는 제가 필요해서    │
│ 만든 예시 모듈일 뿐입니다.           │
│                                     │
│ 당신은:                              │
│ • 필요한 모듈을 자유롭게 추가        │
│ • 새로운 모듈을 직접 개발            │
│ • 커뮤니티와 공유                    │
│                                     │
│ 할 수 있습니다.                      │
│                                     │
├─────────────────────────────────────┤
│                                     │
│ 🚀 다음 단계                         │
│                                     │
│ [내 서버에 설치하기]                 │
│ • Docker 한 줄로 5분 내 설치         │
│ • 완전한 제어권                      │
│ • 데이터는 내 서버에만               │
│                                     │
│ [모듈 개발 가이드 보기]              │
│ • 누구나 모듈 개발 가능              │
│ • 마켓플레이스에 등록                │
│ • 커뮤니티와 공유                    │
│                                     │
│ [커뮤니티 참여하기]                  │
│ • Discord                           │
│ • GitHub Discussions                │
│                                     │
└─────────────────────────────────────┘
```

---

## 기술 구현

### 1. DemoMode 클래스

**위치:** `packages/core/demo/index.ts`

```typescript
export class DemoMode {
  private static instanceId: string;
  private static createdAt: Date;
  
  /**
   * 데모 모드 활성화 여부
   */
  static isEnabled(): boolean {
    return process.env.DEMO_MODE === 'true';
  }
  
  /**
   * OAuth 우회 - 자동 로그인
   */
  static async autoLogin(): Promise<User> {
    if (!this.isEnabled()) return null;
    
    const email = process.env.AUTO_LOGIN_USER || 'demo@finance-system.dev';
    
    // 데모 사용자 생성 또는 조회
    let user = await db.users.findUnique({ where: { email } });
    
    if (!user) {
      user = await db.users.create({
        data: {
          email,
          name: 'Demo User',
          role: 'admin',
          demo_instance_id: this.getInstanceId(),
          created_at: new Date()
        }
      });
      
      // Whitelist에 추가
      await db.allowedUsers.create({
        data: {
          email,
          role: 'admin',
          admin_pin_hash: await hashPin('1234'), // 임시 PIN
          demo: true
        }
      });
    }
    
    return user;
  }
  
  /**
   * 관리자 PIN 반환 (데모용)
   */
  static getAdminPin(): string {
    if (!this.isEnabled()) return null;
    return process.env.DEFAULT_ADMIN_PIN || '1234';
  }
  
  /**
   * AI 사용량 제한 체크
   */
  static async checkAILimit(instanceId: string): Promise<{
    allowed: boolean;
    hourlyRemaining: number;
    dailyRemaining: number;
  }> {
    if (!this.isEnabled()) {
      return { allowed: true, hourlyRemaining: -1, dailyRemaining: -1 };
    }
    
    const hourlyKey = `demo:ai:${instanceId}:hourly`;
    const dailyKey = `demo:ai:${instanceId}:daily`;
    
    // 시간당 체크
    const hourlyCount = parseInt(await redis.get(hourlyKey) || '0');
    if (hourlyCount >= 10) {
      return { 
        allowed: false, 
        hourlyRemaining: 0, 
        dailyRemaining: -1 
      };
    }
    
    // 일일 체크
    const dailyCount = parseInt(await redis.get(dailyKey) || '0');
    if (dailyCount >= 30) {
      return { 
        allowed: false, 
        hourlyRemaining: 10 - hourlyCount, 
        dailyRemaining: 0 
      };
    }
    
    return {
      allowed: true,
      hourlyRemaining: 10 - hourlyCount,
      dailyRemaining: 30 - dailyCount
    };
  }
  
  /**
   * AI 사용량 증가
   */
  static async incrementAIUsage(instanceId: string): Promise<void> {
    if (!this.isEnabled()) return;
    
    const hourlyKey = `demo:ai:${instanceId}:hourly`;
    const dailyKey = `demo:ai:${instanceId}:daily`;
    
    // 시간당
    const hourlyCount = await redis.incr(hourlyKey);
    if (hourlyCount === 1) {
      await redis.expire(hourlyKey, 3600); // 1시간
    }
    
    // 일일
    const dailyCount = await redis.incr(dailyKey);
    if (dailyCount === 1) {
      await redis.expire(dailyKey, 86400); // 24시간
    }
  }
  
  /**
   * 모듈 설치 가능 여부 (모두 허용)
   */
  static canInstallModule(moduleId: string): boolean {
    if (!this.isEnabled()) return true;
    
    // 데모 모드에서는 모든 모듈 설치 가능
    return true;
  }
  
  /**
   * 데이터 내보내기 가능 여부 (불가)
   */
  static canExportData(): boolean {
    if (!this.isEnabled()) return true;
    
    // 데모 데이터는 내보내기 불가
    return false;
  }
  
  /**
   * 인스턴스 ID 생성/조회
   */
  static getInstanceId(): string {
    if (!this.instanceId) {
      this.instanceId = crypto.randomUUID();
      this.createdAt = new Date();
    }
    return this.instanceId;
  }
  
  /**
   * 남은 시간 (24시간)
   */
  static getRemainingTime(): number {
    if (!this.isEnabled() || !this.createdAt) return -1;
    
    const elapsed = Date.now() - this.createdAt.getTime();
    const remaining = 24 * 60 * 60 * 1000 - elapsed; // 24시간
    
    return Math.max(0, remaining);
  }
  
  /**
   * 데모 인스턴스 삭제 (24시간 후)
   */
  static async cleanup(): Promise<void> {
    if (!this.isEnabled()) return;
    
    const instanceId = this.getInstanceId();
    
    // 모든 데모 데이터 삭제
    await db.users.deleteMany({
      where: { demo_instance_id: instanceId }
    });
    
    await db.ledgerEntries.deleteMany({
      where: { user: { demo_instance_id: instanceId } }
    });
    
    await db.subscriptions.deleteMany({
      where: { user: { demo_instance_id: instanceId } }
    });
    
    // Redis 키 삭제
    await redis.del(`demo:ai:${instanceId}:hourly`);
    await redis.del(`demo:ai:${instanceId}:daily`);
    
    console.log(`✓ Demo instance ${instanceId} cleaned up`);
  }
}
```

### 2. 설치 마법사 통합

**위치:** `apps/web/src/pages/Install/index.tsx`

```typescript
export default function Install() {
  const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true';
  
  useEffect(() => {
    if (isDemoMode) {
      // 데모 모드 안내
      notify.info(
        '데모 모드입니다. 실제 설치와 동일한 과정을 체험하세요.',
        { duration: 5000 }
      );
    }
  }, []);
  
  // 나머지 설치 마법사 로직은 동일
  // ...
}
```

### 3. AI 사용량 표시

**위치:** `apps/web/src/components/AIUsageBadge.tsx`

```typescript
export function AIUsageBadge() {
  const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true';
  const [usage, setUsage] = useState({ hourly: 0, daily: 0 });
  
  useEffect(() => {
    if (!isDemoMode) return;
    
    const fetchUsage = async () => {
      const res = await fetch('/api/demo/ai-usage');
      const data = await res.json();
      setUsage({
        hourly: data.hourlyRemaining,
        daily: data.dailyRemaining
      });
    };
    
    fetchUsage();
    const interval = setInterval(fetchUsage, 60000); // 1분마다
    
    return () => clearInterval(interval);
  }, []);
  
  if (!isDemoMode) return null;
  
  return (
    <div className="ai-usage-badge">
      🤖 남은 AI 요청: {usage.hourly}/10 (시간당)
    </div>
  );
}
```

### 4. 데모 배너

**위치:** `apps/web/src/components/DemoBanner.tsx`

```typescript
export function DemoBanner() {
  const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true';
  const [remaining, setRemaining] = useState(0);
  
  useEffect(() => {
    if (!isDemoMode) return;
    
    const updateRemaining = async () => {
      const res = await fetch('/api/demo/remaining-time');
      const data = await res.json();
      setRemaining(data.remaining);
    };
    
    updateRemaining();
    const interval = setInterval(updateRemaining, 60000); // 1분마다
    
    return () => clearInterval(interval);
  }, []);
  
  if (!isDemoMode) return null;
  
  const hours = Math.floor(remaining / (60 * 60 * 1000));
  const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
  
  return (
    <div className="demo-banner">
      <div className="banner-content">
        <span className="badge">🎮 데모 모드</span>
        <span className="time">⏱️ 남은 시간: {hours}시간 {minutes}분</span>
        <span className="pin">🔑 관리자 PIN: 1234</span>
        <a href="https://docs.finance-system.dev/install" className="cta">
          내 서버에 설치하기 →
        </a>
      </div>
    </div>
  );
}
```

---

## 사용자 경험

### 전체 플로우

```
1. 홈페이지 방문
   ↓
2. "데모 체험하기" 버튼 클릭
   ↓
3. 새 탭 열림: demo.finance-system.dev
   ↓
4. 자동 로그인 (사용자 입력 없음)
   ↓
5. 설치 마법사 시작
   ├─ Welcome: "Finance System 설치를 시작합니다"
   ├─ DB 선택: SQLite 자동 선택 (이미 체크됨)
   ├─ AI 설정: Gemini 이미 설정 (사용량 제한 안내)
   ├─ Google 연동: 건너뛰기 권장
   ├─ 모듈 선택: 가계부, 구독 관리 기본 선택
   └─ 설치 진행: 실제와 동일한 진행 화면
   ↓
6. 설치 완료 → 대시보드
   ↓
7. 샘플 데이터 이미 존재
   ├─ 가계부: 최근 3개월 거래 20건
   ├─ 구독: Netflix, Spotify 등 5개
   └─ AI 요약 가능
   ↓
8. 마켓플레이스 탐색
   ├─ 공식 모듈
   ├─ 커뮤니티 모듈 (모두 설치 가능)
   └─ 모듈 상세 보기
   ↓
9. AI 기능 사용
   ├─ 월간 요약 생성
   ├─ 지출 패턴 분석
   └─ 사용량 표시 (8/10)
   ↓
10. 관리자 설정 접근
    ├─ PIN 입력: 1234
    └─ 사용자 관리, 시스템 설정 등
    ↓
11. 24시간 후 또는 "종료하기" 클릭
    ↓
12. 데모 완료 화면
    ├─ 체험 요약
    ├─ 프레임워크 정체성 메시지
    ├─ CTA: "내 서버에 설치", "모듈 개발 가이드"
    └─ 데이터 자동 삭제
```

### 주요 UX 포인트

#### 1. 상시 표시되는 데모 배너

```
┌─────────────────────────────────────────────────────────────┐
│ 🎮 데모 모드 | ⏱️ 23시간 15분 | 🔑 PIN: 1234 | [내 서버에 설치] │
└─────────────────────────────────────────────────────────────┘
```

#### 2. AI 사용량 표시

```
🤖 AI 요약 생성

남은 AI 요청: 8/10 (시간당) | 25/30 (일일)

[AI 요약 생성]
```

#### 3. 데이터 내보내기 차단

```
❌ 데모 모드에서는 데이터를 내보낼 수 없습니다.

Self-hosted로 설치하면 모든 데이터를 완전히 제어할 수 있습니다.

[설치 가이드 보기]
```

#### 4. 모듈 설치 자유

```
마켓플레이스에서 모든 모듈을 자유롭게 설치/제거할 수 있습니다.

⚠️ 데모 종료 시 모든 데이터가 삭제됩니다.
```

---

## 구현 로드맵

### Phase 1: 핵심 인프라 (2-3일)

**목표:** 데모 인스턴스 생성 및 기본 제한 구현

**작업:**
- [ ] DemoMode 클래스 개발
- [ ] OAuth 우회 로직 구현
- [ ] 관리자 PIN "1234" 자동 설정
- [ ] 24시간 자동 삭제 Scheduler
- [ ] 데모 배너 UI 구현
- [ ] 남은 시간 타이머 구현

**환경 변수:**
```env
DEMO_MODE=true
SKIP_OAUTH=true
AUTO_LOGIN_USER=demo@finance-system.dev
DEFAULT_ADMIN_PIN=1234
```

**검증:**
- ✅ 데모 URL 접속 시 자동 로그인
- ✅ PIN 1234로 관리자 설정 접근
- ✅ 24시간 후 데이터 자동 삭제
- ✅ 배너에 남은 시간 표시

### Phase 2: 마켓플레이스 & AI (1주)

**목표:** 커뮤니티 모듈 개방 및 AI 제한 구현

**작업:**
- [ ] 마켓플레이스 전체 접근 허용
- [ ] AI Rate Limiting (Redis)
- [ ] AI 사용량 UI 표시
- [ ] 설치 마법사 데모 모드 통합
- [ ] 샘플 데이터 생성 스크립트

**AI Rate Limiting:**
```typescript
// 시간당 10회, 일일 30회
const limit = await DemoMode.checkAILimit(instanceId);
if (!limit.allowed) {
  throw new Error('AI limit exceeded');
}
```

**검증:**
- ✅ 모든 모듈 설치 가능
- ✅ AI 10회/시간 제한 작동
- ✅ UI에 사용량 표시
- ✅ 샘플 데이터 자동 생성

### Phase 3: 완료 경험 (2주)

**목표:** 데모 완료 화면 및 전환 최적화

**작업:**
- [ ] 데모 완료 화면 구현
- [ ] 프레임워크 정체성 메시지 작성
- [ ] CTA 버튼 및 링크
- [ ] 통계 수집 (데모 사용 패턴)
- [ ] 가이드 투어 (선택)
- [ ] 데모 → Self-hosted 마이그레이션 도구 (선택)

**데모 완료 화면:**
- 체험 요약
- 프레임워크 메시지
- CTA: 설치, 모듈 개발, 커뮤니티

**통계 수집:**
- 데모 시작/완료 수
- 평균 사용 시간
- 설치한 모듈 (인기도)
- AI 사용 빈도
- 전환율 (데모 → 설치)

**검증:**
- ✅ 완료 화면에 메시지 표시
- ✅ CTA 클릭 시 적절한 페이지 이동
- ✅ 통계 수집 작동

### Phase 4: 최적화 & 모니터링 (지속)

**목표:** 성능 및 전환율 최적화

**작업:**
- [ ] 데모 인스턴스 리소스 모니터링
- [ ] 로그 분석 (사용자 행동)
- [ ] A/B 테스트 (메시지, CTA)
- [ ] 성능 최적화
- [ ] 보안 강화

---

## 예상 효과

### 정량적 효과

**전환율 (Conversion Rate):**
- 현재: 예상 5-10%
- 목표: 15-25%
- 근거: 실제 설치 경험 제공으로 심리적 장벽 제거

**데모 완료율:**
- 목표: 60% 이상
- 측정: (완료 화면 도달) / (데모 시작)

**모듈 설치 수:**
- 평균: 3-5개 모듈
- 목표: 커뮤니티 모듈 노출로 다양성 증가

**AI 사용:**
- 예상: 80% 사용자가 AI 기능 체험
- 비용: 월 $0 (Gemini Free Tier)

### 정성적 효과

**브랜드 포지셔닝:**
- "가계부 앱" → "개인 생산성 프레임워크"
- 차별화된 정체성 확립

**커뮤니티 활성화:**
- 모듈 개발자 유입 증가
- 다양한 모듈 생태계 형성
- 기여자 증가

**사용자 이해도:**
- Self-hosted 개념 이해
- 모듈 시스템 체험
- 확장성 인식

---

## 리스크 & 대응

### 1. AI 비용 폭발 🔥

**리스크:**
- 사용자가 AI 기능을 과도하게 사용
- Gemini Free Tier 한도 초과
- 비용 발생

**대응:**
- ✅ Rate Limiting (시간당 10회, 일일 30회)
- ✅ 요청당 500 토큰 제한
- ✅ Redis로 사용량 추적
- ✅ 초과 시 명확한 메시지
- ✅ 모니터링 및 알림 설정

**모니터링:**
```typescript
// 일일 전체 AI 사용량 체크
const totalDailyUsage = await redis.get('demo:ai:total:daily');
if (totalDailyUsage > 1000) {
  await notifyAdmin('데모 AI 사용량 급증');
}
```

### 2. 악의적 사용 🚨

**리스크:**
- 스팸 계정 생성
- 리소스 낭용
- DDoS 공격

**대응:**
- ✅ Cloudflare Bot Management
- ✅ Rate Limiting (IP 기반)
- ✅ CAPTCHA (봇 방지)
- ✅ 24시간 자동 삭제
- ✅ 모니터링 및 차단

**Rate Limiting:**
```
- 1 IP당 하루 3개 데모 인스턴스
- 초과 시 차단
```

### 3. 데이터 손실 우려 😟

**리스크:**
- 사용자가 데모 데이터를 중요하게 생각
- 24시간 후 삭제로 불만 발생

**대응:**
- ✅ 데모 배너에 "24시간 후 삭제" 명확히 표시
- ✅ 완료 화면에서 재확인
- ✅ "Self-hosted로 설치하면 영구 보관" 메시지
- ✅ 데모 → Self-hosted 마이그레이션 도구 (향후)

**UI 메시지:**
```
⚠️ 데모 모드 안내

이 데모는 24시간 후 자동으로 삭제됩니다.
중요한 데이터는 Self-hosted로 설치하여 보관하세요.

[설치 가이드 보기]
```

### 4. 모듈 품질 문제 🐛

**리스크:**
- 커뮤니티 모듈에 버그 존재
- 데모 체험 중 오류 발생
- 부정적 인상

**대응:**
- ✅ 모듈 검증 프로세스 강화
- ✅ 데모 환경에서 사전 테스트
- ✅ 문제 모듈 임시 제거
- ✅ 에러 발생 시 친절한 메시지

**에러 메시지:**
```
❌ 모듈 설치 중 오류가 발생했습니다.

이 모듈은 데모 환경에서 일시적으로 사용할 수 없습니다.

Self-hosted 환경에서는 정상 작동합니다.

[다른 모듈 보기]
```

### 5. 리소스 부족 💻

**리스크:**
- 동시 데모 사용자 증가
- 서버 리소스 부족
- 느린 응답 속도

**대응:**
- ✅ Railway/Cloudflare Workers 자동 스케일링
- ✅ 리소스 모니터링
- ✅ 동시 사용자 제한 (선택)
- ✅ 캐싱 최적화

**동시 사용자 제한:**
```typescript
// 최대 100개 동시 데모 인스턴스
const activeInstances = await redis.get('demo:active:count');
if (activeInstances >= 100) {
  throw new Error('Demo instances limit reached');
}
```

---

## 성공 지표 (KPI)

### 주요 지표

**1. 전환율 (Conversion Rate)**
- 목표: 15-25%
- 측정: (Self-hosted 설치 시작) / (데모 완료)

**2. 데모 완료율**
- 목표: 60% 이상
- 측정: (완료 화면 도달) / (데모 시작)

**3. 평균 사용 시간**
- 목표: 15-30분
- 측정: 데모 시작 ~ 종료 시간

**4. 모듈 설치 수**
- 목표: 평균 3-5개
- 측정: 사용자당 설치한 모듈 수

**5. AI 사용률**
- 목표: 80% 이상
- 측정: AI 기능 사용 / 전체 사용자

### 부수 지표

**6. 커뮤니티 모듈 노출**
- 목표: 평균 1개 이상 설치
- 측정: 커뮤니티 모듈 설치 / 전체 사용자

**7. 관리자 설정 접근**
- 목표: 50% 이상
- 측정: PIN 입력 성공 / 전체 사용자

**8. 데모 중단율**
- 목표: 40% 이하
- 측정: 중도 이탈 / 데모 시작

**9. CTA 클릭률**
- 목표: 30% 이상
- 측정: CTA 클릭 / 완료 화면 도달

**10. 비용**
- 목표: 월 $50 이하
- 측정: 인프라 + AI 비용

---

## 결론

### 핵심 전략

**"프레임워크로서의 정체성을 명확히 전달"**

1. **실제 설치 경험** - Self-hosted 장벽 제거
2. **커뮤니티 개방** - 확장성 증명
3. **AI 체험** - 차별점 시연
4. **프레임워크 메시지** - 장기 비전 제시

### 차별화 포인트

**기존 데모:**
- 단순히 미리 만들어진 환경 제공
- 가계부 기능만 체험
- 정체성 불명확

**새로운 데모:**
- 실제 설치 플로우 체험
- 다양한 모듈 탐색 (금융 외)
- 프레임워크로서의 정체성 강조
- Self-hosted 전환 최적화

### 기대 효과

**단기:**
- 전환율 15-25% 달성
- 데모 완료율 60% 이상
- 커뮤니티 모듈 노출 증가

**중기:**
- 모듈 개발자 유입 증가
- 생태계 활성화
- 브랜드 포지셔닝 확립

**장기:**
- "개인 생산성 프레임워크"로 인식
- WordPress/VSCode 같은 생태계 형성
- 커뮤니티 중심 성장

---

## 다음 단계

### 즉시 실행

1. **Phase 1 구현 시작** (2-3일)
   - DemoMode 클래스 개발
   - OAuth 우회 구현
   - 데모 배너 UI

2. **샘플 데이터 준비**
   - 가계부 거래 20건
   - 구독 서비스 5개
   - 현실적인 데이터

3. **문서 업데이트**
   - 홈페이지 메시지 변경
   - 프레임워크 정체성 강조
   - 설치 가이드 개선

### 향후 검토

- A/B 테스트 (메시지, CTA)
- 데모 → Self-hosted 마이그레이션 도구
- 가이드 투어 (Onboarding)
- 모니터링 대시보드