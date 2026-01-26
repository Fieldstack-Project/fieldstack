# 인증 및 접근 제어

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

### 관리자 비밀번호

**용도:**
- 관리자 등급의 설정 페이지 접근 시에만 사용
- 중요한 시스템 설정 변경 시 추가 인증
- 일반 로그인과는 별개

**사용 시나리오:**
```
1. Google로 이미 로그인된 상태
   ↓
2. 관리자 설정 페이지 접근 시도
   (예: 사용자 관리, DB 설정, 시스템 설정)
   ↓
3. 관리자 비밀번호 입력 화면 표시
   ↓
4. 비밀번호 확인
   ↓
5. 설정 페이지 접근 허용
```

**생성 시점:**
- 초기 설치 마법사에서 관리자 계정 생성 시 설정
- 이메일과 함께 비밀번호 입력

**보안:**
- bcrypt로 해싱하여 저장
- 세션에 임시 저장 (30분 유효)
- 브라우저 닫으면 다시 입력 필요

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

### 데이터베이스 스키마:**
```sql
CREATE TABLE allowed_users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  role VARCHAR(50) DEFAULT 'user',
  password_hash VARCHAR(255),      -- 관리자 비밀번호 (bcrypt)
  added_by UUID,
  added_at TIMESTAMP DEFAULT NOW(),
  last_login TIMESTAMP
);

-- 관리자 인증 세션 (임시)
CREATE TABLE admin_sessions (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**역할 (Role):**
- `admin` - 전체 권한
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

## 백엔드 구현

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

### Google OAuth 콜백 처리

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

## 프론트엔드 구현

### React Context

```typescript
// apps/web/src/contexts/AuthContext.tsx

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: () => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType>(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    checkAuth();
  }, []);
  
  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      }
    } finally {
      setLoading(false);
    }
  };
  
  const login = () => {
    window.location.href = '/auth/google';
  };
  
  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    window.location.href = '/login';
  };
  
  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
```

### Protected Route

```typescript
// apps/web/src/components/ProtectedRoute.tsx

export function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <LoadingScreen />;
  }
  
  if (!user) {
    return <Navigate to="/login" />;
  }
  
  return children;
}

// 사용
<Route 
  path="/dashboard" 
  element={
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  } 
/>
```

---

## 사용자 관리

### Whitelist 추가/제거

**관리자만 가능:**

```typescript
// apps/api/src/routes/admin.ts

router.post('/api/admin/users', requireAdmin, async (req, res) => {
  const { email } = req.body;
  
  await db.allowedUsers.create({
    data: {
      email,
      role: 'user',
      added_by: req.user.id
    }
  });
  
  res.json({ success: true });
});

router.delete('/api/admin/users/:email', requireAdmin, async (req, res) => {
  await db.allowedUsers.delete({
    where: { email: req.params.email }
  });
  
  res.json({ success: true });
});
```

**UI:**
```typescript
// apps/web/src/pages/admin/Users.tsx

function UserManagement() {
  const [email, setEmail] = useState('');
  
  const handleAddUser = async () => {
    await fetch('/api/admin/users', {
      method: 'POST',
      body: JSON.stringify({ email })
    });
    
    // 목록 새로고침
  };
  
  return (
    <div>
      <h2>허용된 사용자 관리</h2>
      
      <Input
        type="email"
        value={email}
        onChange={setEmail}
        placeholder="이메일 주소"
      />
      <Button onClick={handleAddUser}>추가</Button>
      
      <UserList />
    </div>
  );
}
```

---

## 권한 체크

### Role 기반 접근 제어

```typescript
// Middleware
function requireRole(role: string) {
  return (req, res, next) => {
    if (req.user.role !== role) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
}

// 사용
router.get('/api/admin/stats', 
  authMiddleware, 
  requireRole('admin'), 
  async (req, res) => {
    // 관리자만 접근 가능
  }
);
```

### 프론트엔드 권한 체크

```typescript
// Hook
function usePermission(permission: string) {
  const { user } = useAuth();
  return user?.role === 'admin' || user?.permissions?.includes(permission);
}

// 사용
function AdminPanel() {
  const canManageUsers = usePermission('manage_users');
  
  if (!canManageUsers) {
    return <AccessDenied />;
  }
  
  return <UserManagement />;
}
```

---

## 보안 고려사항

### CSRF 방지
- SameSite Cookie 설정
- CSRF Token 사용 (선택)

### XSS 방지
- 입력 검증
- Output Escaping
- Content Security Policy

### Rate Limiting
```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15분
  max: 100, // 최대 100 요청
  message: 'Too many requests'
});

app.use('/api/', limiter);
```

### 세션 타임아웃
- 일정 시간 미활동 시 자동 로그아웃
- 활동 시 세션 연장

---

## 초기 설정

### 첫 관리자 계정

**설치 마법사에서 자동 생성:**
```typescript
// 설치 시
await db.allowedUsers.create({
  data: {
    email: adminEmail,
    role: 'admin'
  }
});
```

**환경 변수로 추가 (개발용):**
```env
ADMIN_EMAIL=admin@example.com
```

---

## 관리자 비밀번호 시스템

### 개념

**이중 인증 구조:**
```
일반 사용:
  Google OAuth → 앱 접근

관리자 설정 접근:
  Google OAuth → 앱 접근
       +
  관리자 비밀번호 → 관리자 설정 접근
```

### 관리자 설정 페이지

**비밀번호 필요한 페이지:**
- 사용자 관리 (Whitelist 추가/제거)
- 데이터베이스 설정 변경
- 시스템 설정 변경
- 모듈 레지스트리 관리
- 보안 설정

**비밀번호 불필요한 페이지:**
- 일반 설정 (프로필, 테마 등)
- 모듈 설치/제거
- AI 설정 (본인 API Key)
- 통합 서비스 설정

---

### Backend 구현

#### 비밀번호 설정 (초기 설치 시)

```typescript
// apps/api/src/routes/install.ts

router.post('/api/setup/admin', async (req, res) => {
  const { email, password, name } = req.body;
  
  // 비밀번호 해싱
  const passwordHash = await bcrypt.hash(password, 10);
  
  // 관리자 계정 생성
  await db.allowedUsers.create({
    data: {
      email,
      password_hash: passwordHash,
      role: 'admin'
    }
  });
  
  res.json({ success: true });
});
```

#### 관리자 인증 확인

```typescript
// apps/api/src/routes/admin.ts

router.post('/api/admin/verify', authMiddleware, async (req, res) => {
  const { password } = req.body;
  
  // 1. 관리자 권한 확인
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Not an admin' });
  }
  
  // 2. 비밀번호 확인
  const allowedUser = await db.allowedUsers.findUnique({
    where: { email: req.user.email }
  });
  
  const isValid = await bcrypt.compare(password, allowedUser.password_hash);
  
  if (!isValid) {
    return res.status(401).json({ error: 'Invalid password' });
  }
  
  // 3. 임시 세션 생성 (30분 유효)
  const session = await db.adminSessions.create({
    data: {
      user_id: req.user.id,
      expires_at: new Date(Date.now() + 30 * 60 * 1000)
    }
  });
  
  res.json({ 
    success: true,
    sessionId: session.id 
  });
});
```

#### 관리자 설정 접근 미들웨어

```typescript
// apps/api/src/middleware/adminAuth.ts

export async function requireAdminPassword(req, res, next) {
  // 1. 기본 인증 확인
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  // 2. 관리자 세션 확인
  const sessionId = req.headers['x-admin-session'];
  
  if (!sessionId) {
    return res.status(401).json({ 
      error: 'Admin password required',
      requirePassword: true 
    });
  }
  
  // 3. 세션 검증
  const session = await db.adminSessions.findUnique({
    where: { id: sessionId }
  });
  
  if (!session || session.expires_at < new Date()) {
    // 만료된 세션
    return res.status(401).json({ 
      error: 'Session expired',
      requirePassword: true 
    });
  }
  
  // 4. 통과
  next();
}

// 사용
router.get('/api/admin/users', 
  authMiddleware, 
  requireAdminPassword, 
  async (req, res) => {
    // 관리자 비밀번호 확인 후에만 접근 가능
  }
);
```

---

### Frontend 구현

#### 관리자 비밀번호 입력 모달

```typescript
// apps/web/src/components/AdminPasswordModal.tsx

interface AdminPasswordModalProps {
  open: boolean;
  onSuccess: (sessionId: string) => void;
  onCancel: () => void;
}

export function AdminPasswordModal({ 
  open, 
  onSuccess, 
  onCancel 
}: AdminPasswordModalProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/admin/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      
      if (response.ok) {
        const { sessionId } = await response.json();
        
        // 세션 ID 저장
        sessionStorage.setItem('admin_session', sessionId);
        
        onSuccess(sessionId);
      } else {
        setError('비밀번호가 올바르지 않습니다');
      }
    } catch (err) {
      setError('인증 중 오류가 발생했습니다');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Modal open={open} onClose={onCancel}>
      <div className="admin-password-modal">
        <div className="modal-icon">🔒</div>
        <h2>관리자 인증</h2>
        <p>
          관리자 설정에 접근하려면 비밀번호를 입력하세요.
        </p>
        
        <Input
          type="password"
          value={password}
          onChange={setPassword}
          placeholder="관리자 비밀번호"
          onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
          autoFocus
        />
        
        {error && (
          <Alert type="error">{error}</Alert>
        )}
        
        <div className="modal-actions">
          <Button variant="secondary" onClick={onCancel}>
            취소
          </Button>
          <Button 
            variant="primary" 
            onClick={handleSubmit}
            loading={loading}
          >
            확인
          </Button>
        </div>
        
        <p className="modal-note">
          💡 이 인증은 30분간 유효합니다.
        </p>
      </div>
    </Modal>
  );
}
```

#### Protected Admin Route

```typescript
// apps/web/src/components/ProtectedAdminRoute.tsx

export function ProtectedAdminRoute({ children }) {
  const { user } = useAuth();
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [verified, setVerified] = useState(false);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    checkAdminSession();
  }, []);
  
  const checkAdminSession = async () => {
    // 1. 관리자 권한 확인
    if (user?.role !== 'admin') {
      return;
    }
    
    // 2. 세션 확인
    const sessionId = sessionStorage.getItem('admin_session');
    
    if (!sessionId) {
      setShowPasswordModal(true);
      setLoading(false);
      return;
    }
    
    // 3. 세션 검증
    try {
      const response = await fetch('/api/admin/verify-session', {
        headers: { 'X-Admin-Session': sessionId }
      });
      
      if (response.ok) {
        setVerified(true);
      } else {
        // 만료됨
        sessionStorage.removeItem('admin_session');
        setShowPasswordModal(true);
      }
    } catch {
      setShowPasswordModal(true);
    } finally {
      setLoading(false);
    }
  };
  
  const handlePasswordSuccess = (sessionId: string) => {
    setVerified(true);
    setShowPasswordModal(false);
  };
  
  if (loading) {
    return <LoadingScreen />;
  }
  
  if (user?.role !== 'admin') {
    return <Navigate to="/" />;
  }
  
  if (!verified) {
    return (
      <>
        <AdminPasswordModal
          open={showPasswordModal}
          onSuccess={handlePasswordSuccess}
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

// 사용
<Route 
  path="/admin/users" 
  element={
    <ProtectedAdminRoute>
      <UserManagement />
    </ProtectedAdminRoute>
  } 
/>
```

#### API 클라이언트에 세션 추가

```typescript
// apps/web/src/services/api.ts

export async function apiCall(url: string, options: RequestInit = {}) {
  const sessionId = sessionStorage.getItem('admin_session');
  
  const headers = {
    ...options.headers,
    'Content-Type': 'application/json',
  };
  
  // 관리자 API 호출 시 세션 ID 추가
  if (url.includes('/admin/') && sessionId) {
    headers['X-Admin-Session'] = sessionId;
  }
  
  const response = await fetch(url, {
    ...options,
    headers
  });
  
  // 401 에러 시 비밀번호 재입력 필요
  if (response.status === 401) {
    const data = await response.json();
    if (data.requirePassword) {
      sessionStorage.removeItem('admin_session');
      // 비밀번호 모달 표시 로직
    }
  }
  
  return response;
}
```

---

### 비밀번호 변경

```typescript
// apps/api/src/routes/admin.ts

router.post('/api/admin/change-password', 
  authMiddleware, 
  requireAdminPassword,
  async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    
    // 1. 현재 비밀번호 확인
    const allowedUser = await db.allowedUsers.findUnique({
      where: { email: req.user.email }
    });
    
    const isValid = await bcrypt.compare(
      currentPassword, 
      allowedUser.password_hash
    );
    
    if (!isValid) {
      return res.status(401).json({ 
        error: 'Current password is incorrect' 
      });
    }
    
    // 2. 새 비밀번호 해싱
    const newHash = await bcrypt.hash(newPassword, 10);
    
    // 3. 업데이트
    await db.allowedUsers.update({
      where: { email: req.user.email },
      data: { password_hash: newHash }
    });
    
    // 4. 모든 관리자 세션 무효화
    await db.adminSessions.deleteMany({
      where: { user_id: req.user.id }
    });
    
    res.json({ success: true });
  }
);
```

---

### 보안 고려사항

**세션 타임아웃:**
- 30분 동안 미사용 시 자동 만료
- 브라우저 닫으면 세션 삭제

**비밀번호 요구사항:**
- 최소 8자 이상
- 영문, 숫자, 특수문자 조합 권장

**Rate Limiting:**
```typescript
// 관리자 비밀번호 인증 시도 제한
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15분
  max: 5, // 최대 5번 시도
  message: 'Too many authentication attempts'
});

router.post('/api/admin/verify', limiter, async (req, res) => {
  // ...
});
```

**로깅:**
```typescript
// 관리자 설정 접근 시도 로깅
await db.auditLog.create({
  data: {
    user_id: req.user.id,
    action: 'admin_access_attempt',
    success: isValid,
    ip_address: req.ip,
    timestamp: new Date()
  }
});
```

```typescript
// Backend
router.post('/api/auth/logout', authMiddleware, (req, res) => {
  res.clearCookie('auth_token');
  res.json({ success: true });
});

// Frontend
const handleLogout = async () => {
  await fetch('/api/auth/logout', { method: 'POST' });
  window.location.href = '/login';
};
```