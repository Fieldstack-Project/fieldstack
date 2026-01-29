# 인증 및 접근 제어

> 📌 **핵심 결정:**  
> → `architecture/decisions.md § 결정 #2: 관리자 인증 (OAuth + PIN)`

**최종 업데이트:** 2025-01-29

---

## 인증 방식

### Google OAuth 2.0

**일반 로그인:**
- Google 계정으로 로그인
- 일상적인 사용
- Whitelist 기반 접근 제어

**설정 방법:**
1. Google Cloud Console 접속
2. OAuth 2.0 클라이언트 ID 생성
3. 리다이렉트 URI 등록: `{YOUR_DOMAIN}/auth/callback`
4. Client ID와 Secret을 설정에 입력

---

## 관리자 인증 (PIN)

> 💡 **왜 PIN을 선택했나요?**  
> → `architecture/decisions.md § 결정 #2` - 설계 근거 참고

### 개념

**이중 인증 구조:**
```
일반 사용:
  Google OAuth → 앱 접근

관리자 설정 접근:
  Google OAuth → 앱 접근
       +
  4~6자리 PIN → 관리자 설정 접근
```

### 용도

**PIN이 필요한 페이지:**
- ⚙️ 사용자 관리 (Whitelist 추가/제거)
- 🗄️ 데이터베이스 설정 변경
- 🔧 시스템 설정 변경
- 📦 모듈 레지스트리 관리
- 🔐 보안 설정

**PIN이 불필요한 페이지:**
- 👤 일반 설정 (프로필, 테마 등)
- 📦 모듈 설치/제거 (사용자 본인)
- 🤖 AI 설정 (본인 API Key)
- 🔗 통합 서비스 설정 (본인 계정)

### 사용 시나리오

```
1. Google로 이미 로그인된 상태
   ↓
2. 관리자 설정 페이지 접근 시도
   (예: 사용자 관리, DB 설정, 시스템 설정)
   ↓
3. PIN 입력 화면 표시
   ┌─────────────────────────┐
   │   🔒 관리자 인증         │
   │                         │
   │   PIN: [□][□][□][□]    │
   │                         │
   │   [취소]  [확인]        │
   └─────────────────────────┘
   ↓
4. PIN 확인
   ↓
5. 설정 페이지 접근 허용 (30분간 유효)
```

### PIN 요구사항

**길이:**
- 4~6자리 숫자
- 권장: 6자리

**보안:**
- 최소 4자리 (홈서버 환경에 적합)
- 최대 6자리 (충분한 보안)
- 연속된 숫자 금지 (예: 1234, 9876)
- 반복된 숫자 금지 (예: 1111, 2222)

**저장:**
- PBKDF2 해싱 (100,000 iterations)
- Salt 추가

---

## 접근 제어

### Whitelist 기반

**작동 방식:**
```
1. 사용자가 Google로 로그인
   ↓
2. 이메일 주소 확인
   ↓
3. allowed_users 테이블에서 검색
   ↓
4. 있으면 → 접근 허용
   없으면 → 접근 거부
```

### 데이터베이스 스키마

```sql
CREATE TABLE allowed_users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  role VARCHAR(50) DEFAULT 'user',
  admin_pin_hash VARCHAR(255),      -- 관리자 PIN (PBKDF2)
  added_by UUID,
  added_at TIMESTAMP DEFAULT NOW(),
  last_login TIMESTAMP
);

-- 관리자 인증 세션 (임시)
CREATE TABLE admin_sessions (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id)
);
```

**역할 (Role):**
- `admin` - 전체 권한 + PIN 설정 가능
- `user` - 일반 사용자

---

## 인증 플로우

### 1. 로그인 프로세스

```
사용자 → "Google로 로그인" 버튼 클릭
         ↓
  Google OAuth 페이지로 리다이렉트
         ↓
  사용자가 Google 계정으로 로그인
         ↓
  권한 승인 (프로필, 이메일)
         ↓
  Callback URL로 리다이렉트 (Authorization Code)
         ↓
  Backend에서 Code → Access Token 교환
         ↓
  Google API로 사용자 정보 조회
         ↓
  이메일 주소 Whitelist 확인
         ↓
  JWT 토큰 발급 → 클라이언트에 전달
         ↓
  메인 화면으로 이동
```

### 2. 세션 관리

**JWT 기반:**
```typescript
// Payload
{
  userId: "uuid",
  email: "user@example.com",
  role: "user",
  iat: 1234567890,  // 발급 시간
  exp: 1234654290   // 만료 시간 (7일)
}
```

**저장 위치:**
- `httpOnly` Cookie (추천)
- 또는 LocalStorage (보안 주의)

**만료 시간:**
- Access Token: 7일
- Refresh Token: 30일 (선택)

---

## Backend 구현

### Express Middleware

```typescript
// packages/core/auth/middleware.ts

export async function authMiddleware(req, res, next) {
  try {
    // 1. 토큰 추출
    const token = extractToken(req);
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    // 2. 토큰 검증
    const payload = verifyToken(token);
    
    // 3. 사용자 조회
    const user = await db.users.findUnique({
      where: { id: payload.userId }
    });
    
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    // 4. Whitelist 확인
    const allowed = await db.allowedUsers.findUnique({
      where: { email: user.email }
    });
    
    if (!allowed) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // 5. 요청 객체에 사용자 정보 추가
    req.user = user;
    next();
    
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
}
```

### 관리자 PIN 인증

> 💡 **구현 상세:**  
> → `architecture/decisions.md § 결정 #2: 기술 구현`

```typescript
// packages/core/auth/admin-auth.ts

import crypto from 'crypto';

export class AdminAuthService {
  // PIN 해싱
  static async hashPin(pin: string, salt?: Buffer): Promise<{ hash: string; salt: string }> {
    const pinSalt = salt || crypto.randomBytes(16);
    
    const hash = crypto.pbkdf2Sync(
      pin,
      pinSalt,
      100000,  // iterations
      64,      // keylen
      'sha512'
    );
    
    return {
      hash: hash.toString('hex'),
      salt: pinSalt.toString('hex')
    };
  }
  
  // PIN 검증
  static async verifyPin(pin: string, storedHash: string): Promise<boolean> {
    const [hash, salt] = storedHash.split(':');
    
    const { hash: computedHash } = await this.hashPin(
      pin,
      Buffer.from(salt, 'hex')
    );
    
    return hash === computedHash;
  }
  
  // 세션 생성 (30분 유효)
  static async createSession(userId: string): Promise<string> {
    const sessionId = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);
    
    await db.adminSessions.upsert({
      where: { user_id: userId },
      update: { 
        id: sessionId,
        expires_at: expiresAt 
      },
      create: {
        id: sessionId,
        user_id: userId,
        expires_at: expiresAt
      }
    });
    
    return sessionId;
  }
  
  // 세션 검증
  static async verifySession(sessionId: string): Promise<boolean> {
    const session = await db.adminSessions.findUnique({
      where: { id: sessionId }
    });
    
    if (!session) return false;
    if (session.expires_at < new Date()) {
      // 만료된 세션 삭제
      await db.adminSessions.delete({ where: { id: sessionId } });
      return false;
    }
    
    return true;
  }
}
```

### API 엔드포인트

```typescript
// apps/api/src/routes/admin.ts

// PIN 설정 (초기 설정 시)
router.post('/setup-pin', authMiddleware, async (req, res) => {
  const { pin } = req.body;
  
  // 1. 관리자 권한 확인
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  // 2. PIN 검증
  if (!/^\d{4,6}$/.test(pin)) {
    return res.status(400).json({ error: 'PIN must be 4-6 digits' });
  }
  
  // 연속/반복 검증
  if (/^(\d)\1+$/.test(pin) || /^(?:0123|1234|2345|3456|4567|5678|6789|9876|8765|7654|6543|5432|4321|3210)/.test(pin)) {
    return res.status(400).json({ error: 'PIN too simple' });
  }
  
  // 3. PIN 해싱
  const { hash, salt } = await AdminAuthService.hashPin(pin);
  const storedHash = `${hash}:${salt}`;
  
  // 4. DB 저장
  await db.allowedUsers.update({
    where: { email: req.user.email },
    data: { admin_pin_hash: storedHash }
  });
  
  res.json({ success: true });
});

// PIN 인증
router.post('/verify-pin', authMiddleware, async (req, res) => {
  const { pin } = req.body;
  
  // 1. 관리자 권한 확인
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Not an admin' });
  }
  
  // 2. PIN 조회
  const allowedUser = await db.allowedUsers.findUnique({
    where: { email: req.user.email }
  });
  
  if (!allowedUser?.admin_pin_hash) {
    return res.status(400).json({ error: 'PIN not set' });
  }
  
  // 3. PIN 검증
  const isValid = await AdminAuthService.verifyPin(
    pin,
    allowedUser.admin_pin_hash
  );
  
  if (!isValid) {
    // 감사 로그
    await logFailedAttempt(req.user.id, req.ip);
    return res.status(401).json({ error: 'Invalid PIN' });
  }
  
  // 4. 세션 생성
  const sessionId = await AdminAuthService.createSession(req.user.id);
  
  res.json({ 
    success: true,
    sessionId 
  });
});

// 관리자 설정 접근 미들웨어
export async function requireAdminPin(req, res, next) {
  // 1. 기본 인증 확인
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  // 2. 세션 확인
  const sessionId = req.headers['x-admin-session'];
  
  if (!sessionId) {
    return res.status(401).json({ 
      error: 'PIN required',
      requirePin: true 
    });
  }
  
  // 3. 세션 검증
  const valid = await AdminAuthService.verifySession(sessionId);
  
  if (!valid) {
    return res.status(401).json({ 
      error: 'Session expired',
      requirePin: true 
    });
  }
  
  // 4. 통과
  next();
}

// 사용 예시
router.get('/users', authMiddleware, requireAdminPin, async (req, res) => {
  // PIN 인증 후에만 접근 가능
  const users = await db.allowedUsers.findMany();
  res.json(users);
});
```

---

## Frontend 구현

### PIN 입력 컴포넌트

> 💡 **UI 구현 예시:**  
> → `architecture/decisions.md § 결정 #2: UI 구현`

```typescript
// apps/web/src/components/PinInput.tsx

import { useState, useRef, useEffect } from 'react';

interface PinInputProps {
  length?: number;  // 4 or 6
  onComplete: (pin: string) => void;
  error?: string;
}

export function PinInput({ length = 6, onComplete, error }: PinInputProps) {
  const [pin, setPin] = useState<string[]>(Array(length).fill(''));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  
  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    
    const newPin = [...pin];
    newPin[index] = value.slice(-1);
    setPin(newPin);
    
    // 자동 포커스 이동
    if (value && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
    
    // 완성 시 콜백
    if (newPin.every(d => d) && newPin.join('').length === length) {
      onComplete(newPin.join(''));
    }
  };
  
  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };
  
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);
  
  return (
    <div className="pin-input">
      <div className="pin-boxes">
        {pin.map((digit, i) => (
          <input
            key={i}
            ref={el => inputRefs.current[i] = el}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            className={`pin-box ${error ? 'error' : ''}`}
            autoComplete="off"
          />
        ))}
      </div>
      {error && <p className="error-message">{error}</p>}
    </div>
  );
}
```

### PIN 인증 모달

```typescript
// apps/web/src/components/AdminPinModal.tsx

import { useState } from 'react';
import { Modal } from '@core/ui';
import { PinInput } from './PinInput';

interface AdminPinModalProps {
  open: boolean;
  onSuccess: (sessionId: string) => void;
  onCancel: () => void;
}

export function AdminPinModal({ open, onSuccess, onCancel }: AdminPinModalProps) {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const handlePinComplete = async (pin: string) => {
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/admin/verify-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin })
      });
      
      if (response.ok) {
        const { sessionId } = await response.json();
        
        // 세션 저장
        sessionStorage.setItem('admin_session', sessionId);
        
        onSuccess(sessionId);
      } else {
        setError('PIN이 올바르지 않습니다');
      }
    } catch (err) {
      setError('인증 중 오류가 발생했습니다');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Modal open={open} onClose={onCancel}>
      <div className="admin-pin-modal">
        <div className="modal-icon">🔒</div>
        <h2>관리자 인증</h2>
        <p>관리자 설정에 접근하려면 PIN을 입력하세요.</p>
        
        <PinInput
          length={6}
          onComplete={handlePinComplete}
          error={error}
        />
        
        {loading && <p className="loading">인증 중...</p>}
        
        <div className="modal-actions">
          <button onClick={onCancel}>취소</button>
        </div>
        
        <p className="modal-note">
          💡 이 인증은 30분간 유효합니다.
        </p>
      </div>
    </Modal>
  );
}
```

### Protected Admin Route

```typescript
// apps/web/src/components/ProtectedAdminRoute.tsx

export function ProtectedAdminRoute({ children }) {
  const { user } = useAuth();
  const [showPinModal, setShowPinModal] = useState(false);
  const [verified, setVerified] = useState(false);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    checkAdminSession();
  }, []);
  
  const checkAdminSession = async () => {
    if (user?.role !== 'admin') {
      return;
    }
    
    const sessionId = sessionStorage.getItem('admin_session');
    
    if (!sessionId) {
      setShowPinModal(true);
      setLoading(false);
      return;
    }
    
    // 세션 검증
    try {
      const response = await fetch('/api/admin/verify-session', {
        headers: { 'X-Admin-Session': sessionId }
      });
      
      if (response.ok) {
        setVerified(true);
      } else {
        sessionStorage.removeItem('admin_session');
        setShowPinModal(true);
      }
    } catch {
      setShowPinModal(true);
    } finally {
      setLoading(false);
    }
  };
  
  const handlePinSuccess = (sessionId: string) => {
    setVerified(true);
    setShowPinModal(false);
  };
  
  if (loading) return <LoadingScreen />;
  if (user?.role !== 'admin') return <Navigate to="/" />;
  
  if (!verified) {
    return (
      <>
        <AdminPinModal
          open={showPinModal}
          onSuccess={handlePinSuccess}
          onCancel={() => navigate(-1)}
        />
        <div className="admin-locked">
          <p>관리자 인증이 필요합니다</p>
        </div>
      </>
    );
  }
  
  return children;
}
```

---

## 보안 고려사항

> 📖 **전체 보안 정책:**  
> → `architecture/decisions.md § 결정 #2: 보안`

### Rate Limiting

```typescript
// 5회 실패 시 5분 잠금
const rateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 5,
  message: 'Too many failed attempts. Please try again later.',
  skipSuccessfulRequests: true
});

router.post('/verify-pin', rateLimiter, async (req, res) => {
  // ...
});
```

### 감사 로그

```typescript
async function logFailedAttempt(userId: string, ip: string) {
  await db.auditLog.create({
    data: {
      user_id: userId,
      action: 'admin_pin_failed',
      ip_address: ip,
      timestamp: new Date()
    }
  });
  
  // 연속 실패 체크
  const recentFailures = await db.auditLog.count({
    where: {
      user_id: userId,
      action: 'admin_pin_failed',
      timestamp: {
        gte: new Date(Date.now() - 5 * 60 * 1000)
      }
    }
  });
  
  if (recentFailures >= 5) {
    await notifyAdmin({
      subject: '⚠️ 관리자 PIN 접근 실패 다수 발생',
      message: `User ${userId}가 5회 이상 PIN 인증 실패`
    });
  }
}
```

### 세션 타임아웃

```typescript
// 30분 동안 미사용 시 자동 만료
const SESSION_TIMEOUT = 30 * 60 * 1000;

// 세션 생성/갱신 시 타임아웃 설정
await db.adminSessions.update({
  where: { id: sessionId },
  data: {
    expires_at: new Date(Date.now() + SESSION_TIMEOUT)
  }
});
```

### PIN 변경

```typescript
router.post('/change-pin', authMiddleware, requireAdminPin, async (req, res) => {
  const { currentPin, newPin } = req.body;
  
  // 1. 현재 PIN 확인
  const user = await db.allowedUsers.findUnique({
    where: { email: req.user.email }
  });
  
  const isValid = await AdminAuthService.verifyPin(
    currentPin,
    user.admin_pin_hash
  );
  
  if (!isValid) {
    return res.status(401).json({ error: 'Current PIN incorrect' });
  }
  
  // 2. 새 PIN 해싱
  const { hash, salt } = await AdminAuthService.hashPin(newPin);
  
  // 3. 업데이트
  await db.allowedUsers.update({
    where: { email: req.user.email },
    data: { admin_pin_hash: `${hash}:${salt}` }
  });
  
  // 4. 모든 세션 무효화
  await db.adminSessions.deleteMany({
    where: { user_id: req.user.id }
  });
  
  res.json({ success: true });
});
```

---

## Google OAuth 콜백 처리

```typescript
// apps/api/src/routes/auth.ts

router.get('/auth/google', (req, res) => {
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: [
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email'
    ]
  });
  
  res.redirect(authUrl);
});

router.get('/auth/callback', async (req, res) => {
  const { code } = req.query;
  
  try {
    // 1. Authorization Code → Access Token
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);
    
    // 2. 사용자 정보 조회
    const { data } = await oauth2Client.request({
      url: 'https://www.googleapis.com/oauth2/v2/userinfo'
    });
    
    // 3. Whitelist 확인
    const allowed = await db.allowedUsers.findUnique({
      where: { email: data.email }
    });
    
    if (!allowed) {
      return res.status(403).send('Access Denied');
    }
    
    // 4. 사용자 생성 또는 업데이트
    const user = await db.users.upsert({
      where: { email: data.email },
      update: { 
        last_login: new Date(),
        profile_picture: data.picture
      },
      create: {
        email: data.email,
        name: data.name,
        profile_picture: data.picture
      }
    });
    
    // 5. JWT 발급
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: allowed.role
    });
    
    // 6. 쿠키에 저장
    res.cookie('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7일
    });
    
    // 7. 메인 화면으로 리다이렉트
    res.redirect('/');
    
  } catch (error) {
    res.status(500).send('Authentication failed');
  }
});
```

---

## 로그아웃

```typescript
// Backend
router.post('/auth/logout', authMiddleware, async (req, res) => {
  // 관리자 세션도 삭제
  if (req.user.role === 'admin') {
    await db.adminSessions.deleteMany({
      where: { user_id: req.user.id }
    });
  }
  
  res.clearCookie('auth_token');
  res.json({ success: true });
});

// Frontend
const handleLogout = async () => {
  await fetch('/api/auth/logout', { method: 'POST' });
  sessionStorage.removeItem('admin_session');
  window.location.href = '/login';
};
```

---

## 📚 관련 문서

- 📌 `architecture/decisions.md § 결정 #2` - PIN 방식 선택 근거
- 📖 `deployment/setup-wizard.md` - 초기 관리자 설정
- 📖 `community/github-policy.md` - 보안 정책

---

## FAQ

### Q1. 왜 비밀번호가 아니라 PIN인가요?
**A:** 홈서버 환경에서는 스마트폰 잠금처럼 간단한 PIN이 더 적합합니다. 복잡한 비밀번호는 자주 입력해야 하는 관리자 설정에 부담이 됩니다.

> 📖 상세 이유: `architecture/decisions.md § 결정 #2`

### Q2. PIN이 안전한가요?
**A:** PBKDF2 + Rate Limiting으로 충분히 안전합니다. 5회 실패 시 5분 잠금되므로 브루트포스 공격이 어렵습니다.

### Q3. PIN을 잊어버렸어요!
**A:** 데이터베이스에서 직접 초기화해야 합니다. 백업 관리자 계정을 미리 만들어두는 것을 권장합니다.

### Q4. 세션이 자주 만료돼요
**A:** 30분 타임아웃은 보안을 위한 것입니다. 설정에서 조정 가능합니다 (권장하지 않음).

### Q5. 일반 사용자도 PIN이 필요한가요?
**A:** 아니요. PIN은 관리자 설정에만 필요합니다. 일반 사용자는 Google OAuth만으로 충분합니다.