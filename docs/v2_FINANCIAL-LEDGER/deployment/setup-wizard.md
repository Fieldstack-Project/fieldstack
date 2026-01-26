# 웹 기반 설치 마법사

## 개요

시놀로지 NAS와 같은 직관적인 웹 기반 설치 마법사를 제공하여, 명령줄 없이도 쉽게 설치할 수 있도록 합니다.

## 설치 플로우

```
1. 프로젝트 다운로드/클론
   ↓
2. Docker Compose / npm install (기본만)
   ↓
3. 서버 실행 → 웹 브라우저 자동 열림
   ↓
4. 웹 설정 마법사 (모든 설정 여기서)
   ↓
5. "설치 시작" 버튼 클릭
   ↓
6. 백그라운드에서:
   - DB 마이그레이션
   - 의존성 설치
   - 모듈 초기화
   - 관리자 계정 생성
   ↓
7. 완료 → 로그인 화면
```

## 화면 구성

### 1. 시작 화면 (Welcome)

```
┌─────────────────────────────────────┐
│                                     │
│        🏦 Finance System            │
│                                     │
│   개인용 금융 & 생산성 관리 시스템      │
│                                     │
│   이 마법사를 통해 5분 안에             │
│   시스템을 설정할 수 있습니다.          │
│                                     │
│   📋 시스템 요구사항                   │
│   • Node.js 20+                    │
│   • 500MB RAM                      │
│   • 1GB Storage                    │
│                                     │
│   ⏱️ 예상 소요 시간: 10-15분         │
│                                     │
│            [시작하기 →]              │
│                                     │
└─────────────────────────────────────┘
```

### 2. 설정 입력 화면 (Configuration)

#### 2.1 관리자 계정 (필수)

```
┌─────────────────────────────────────┐
│ 1️⃣ 관리자 계정                       │
├─────────────────────────────────────┤
│                                     │
│ 이름:                                │
│ [                    ]              │
│                                     │
│ 이메일:                              │
│ [                    ]              │
│                                     │
│ 비밀번호:                            │
│ [                    ]              │
│ ※ 최소 8자, 영문+숫자 조합              │
│                                     │
│ 비밀번호 확인:                        │
│ [                    ]              │
│                                     │
└─────────────────────────────────────┘
```

#### 2.2 데이터베이스 (필수)

```
┌─────────────────────────────────────┐
│ 2️⃣ 데이터베이스                      │
├─────────────────────────────────────┤
│                                     │
│ ( ) SQLite (권장)                   │
│     • 설정 불필요, 자동 설치            │
│     • 파일 기반, 간단한 백업            │
│                                     │
│ ( ) PostgreSQL                      │
│     • 고성능, 대용량 처리               │
│     • 별도 설치 필요                   │
│                                     │
│ ( ) Supabase                        │
│     • 클라우드 DB, 무료 티어            │
│     • 자동 백업, 확장 용이              │
│                                     │
│ [SQLite 선택 시]                     │
│ 저장 경로: ./data/database.db       │
│                                     │
│ [PostgreSQL 선택 시]                │
│ 호스트: [localhost    ]             │
│ 포트:   [5432         ]             │
│ DB명:   [finance      ]             │
│ 사용자: [finance      ]             │
│ 비밀번호:[             ]             │
│ [연결 테스트]                        │
│                                     │
│ [Supabase 선택 시]                  │
│ Project URL:                        │
│ [https://xxx.supabase.co]           │
│ API Key:                            │
│ [                       ]           │
│ [연결 테스트]                        │
│                                     │
└─────────────────────────────────────┘
```

#### 2.3 AI 기능 (선택)

```
┌─────────────────────────────────────┐
│ 3️⃣ AI 기능 (선택)                    │
├─────────────────────────────────────┤
│                                     │
│ [ ] AI 기능 활성화                   │
│                                     │
│ Provider:                           │
│ ( ) Google Gemini (무료 티어)        │
│ ( ) OpenAI                          │
│ ( ) Anthropic Claude                │
│ ( ) Ollama (로컬)                   │
│                                     │
│ API Key:                            │
│ [                       ]           │
│                                     │
│ 💡 API Key 발급 방법:                │
│ • Gemini: https://makersuite...    │
│ • OpenAI: https://platform...      │
│ • Claude: https://console...       │
│                                     │
│ [건너뛰기]                           │
│                                     │
└─────────────────────────────────────┘
```

#### 2.4 Google 연동 (선택)

```
┌─────────────────────────────────────┐
│ 4️⃣ Google 연동 (선택)                │
├─────────────────────────────────────┤
│                                     │
│ [ ] Google 서비스 연동               │
│                                     │
│ OAuth Client ID:                    │
│ [                       ]           │
│                                     │
│ OAuth Client Secret:                │
│ [                       ]           │
│                                     │
│ 💡 OAuth 설정 방법:                  │
│ 1. Google Cloud Console 접속        │
│ 2. OAuth 2.0 클라이언트 ID 생성       │
│ 3. 리다이렉트 URI 등록:               │
│    http://localhost:3000/auth/...  │
│                                     │
│ [📖 자세한 가이드]                   │
│ [건너뛰기]                           │
│                                     │
└─────────────────────────────────────┘
```

#### 2.5 모듈 선택 (선택)

```
┌─────────────────────────────────────┐
│ 5️⃣ 설치할 모듈 선택                  │
├─────────────────────────────────────┤
│                                     │
│ 권장 모듈:                           │
│ [✓] 💰 가계부                       │
│     수입과 지출 관리                  │
│                                     │
│ [✓] 📅 구독 관리                    │
│     정기 구독 서비스 추적              │
│                                     │
│ 추가 모듈:                           │
│ [ ] ✅ TODO                         │
│     할 일 관리                        │
│                                     │
│ [ ] 📊 프로젝트 관리                 │
│     외주 및 프로젝트 추적              │
│                                     │
│ 💡 나중에 마켓플레이스에서             │
│    추가 모듈을 설치할 수 있습니다.      │
│                                     │
│ [모두 건너뛰기]                       │
│ ※ 건너뛰면 튜토리얼 화면이 표시됩니다   │
│                                     │
└─────────────────────────────────────┘
```

### 3. 설치 진행 화면 (Progress)

```
┌─────────────────────────────────────┐
│ 설치 중...                           │
├─────────────────────────────────────┤
│                                     │
│ [████████████████░░░░] 80%          │
│                                     │
│ 현재 단계: DB 마이그레이션 중...       │
│                                     │
│ ✅ 1. 설정 검증 완료                 │
│ ✅ 2. 데이터베이스 연결 완료          │
│ ✅ 3. 데이터베이스 마이그레이션 완료   │
│ ⏳ 4. 의존성 설치 중...              │
│ ⬜ 5. 모듈 다운로드 및 설치           │
│ ⬜ 6. 관리자 계정 생성                │
│ ⬜ 7. 최종 설정                      │
│                                     │
│ 📋 설치 로그:                        │
│ ┌─────────────────────────────────┐ │
│ │ [INFO] DB 연결 성공...           │ │
│ │ [INFO] 테이블 생성 중...          │ │
│ │ [INFO] ledger_entries 생성 완료  │ │
│ │ [INFO] npm install 실행 중...    │ │
│ │ ...                             │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ※ 이 과정은 5-10분 정도 소요됩니다.    │
│                                     │
└─────────────────────────────────────┘
```

### 4. 완료 화면 (Complete)

```
┌─────────────────────────────────────┐
│                                     │
│            🎉 설치 완료!             │
│                                     │
│   Finance System이 성공적으로         │
│   설치되었습니다!                     │
│                                     │
│ 📦 설치된 항목:                      │
│ ✅ 데이터베이스 (SQLite)              │
│ ✅ 관리자 계정 (admin@example.com)   │
│ ✅ 모듈: 가계부, 구독 관리             │
│                                     │
│ 🚀 다음 단계:                        │
│ 1. 로그인하여 시작하기                 │
│ 2. 마켓플레이스에서 추가 모듈 탐색      │
│ 3. 설정에서 Google 연동 (선택)        │
│                                     │
│ 📚 유용한 링크:                      │
│ • 사용자 가이드                       │
│ • 튜토리얼 영상                       │
│ • 커뮤니티 (Discord)                 │
│                                     │
│         [로그인하러 가기 →]           │
│                                     │
└─────────────────────────────────────┘
```

## Backend 구현

### 설치 API

```typescript
// apps/api/src/routes/install.ts

import { Router } from 'express';
import { runInstallation } from '../services/installer';

const router = Router();

// 설치 시작
router.post('/start', async (req, res) => {
  const config = req.body;
  
  try {
    // WebSocket으로 진행 상황 전송
    const ws = req.app.get('websocket');
    
    await runInstallation(config, {
      onProgress: (step, percent, message) => {
        ws.emit('install:progress', {
          step,
          percent,
          message,
          timestamp: new Date()
        });
      }
    });
    
    res.json({ success: true });
    
  } catch (error) {
    res.status(500).json({ 
      error: error.message,
      step: error.step 
    });
  }
});

// 설치 상태 확인
router.get('/status', async (req, res) => {
  const isInstalled = await checkInstallation();
  res.json({ installed: isInstalled });
});

// DB 연결 테스트
router.post('/test-db', async (req, res) => {
  const { provider, config } = req.body;
  
  try {
    await testDatabaseConnection(provider, config);
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ 
      error: 'Connection failed',
      message: error.message 
    });
  }
});

export default router;
```

### 설치 서비스

```typescript
// apps/api/src/services/installer.ts

export async function runInstallation(
  config: InstallConfig,
  callbacks?: InstallCallbacks
) {
  try {
    // 1. 설정 검증
    callbacks?.onProgress?.(1, 10, '설정 검증 중...');
    await validateConfig(config);
    
    // 2. 데이터베이스 연결
    callbacks?.onProgress?.(2, 20, '데이터베이스 연결 중...');
    await connectDatabase(config.database);
    
    // 3. DB 마이그레이션
    callbacks?.onProgress?.(3, 40, '데이터베이스 초기화 중...');
    await runMigrations();
    
    // 4. 의존성 설치
    callbacks?.onProgress?.(4, 60, '의존성 설치 중...');
    await installDependencies();
    
    // 5. 모듈 다운로드 및 설치
    if (config.modules?.length > 0) {
      callbacks?.onProgress?.(5, 70, '모듈 설치 중...');
      
      for (const moduleId of config.modules) {
        await installModule(moduleId);
      }
    }
    
    // 6. 관리자 계정 생성
    callbacks?.onProgress?.(6, 85, '관리자 계정 생성 중...');
    await createAdminAccount(config.admin);
    
    // 7. 최종 설정
    callbacks?.onProgress?.(7, 95, '최종 설정 중...');
    await finalizeInstallation(config);
    
    // 8. FIRST_RUN 플래그 제거
    callbacks?.onProgress?.(8, 100, '설치 완료!');
    await setInstalled();
    
  } catch (error) {
    throw {
      message: error.message,
      step: error.step || 'unknown'
    };
  }
}

async function validateConfig(config: InstallConfig) {
  // 이메일 형식 확인
  if (!isValidEmail(config.admin.email)) {
    throw new Error('Invalid email format');
  }
  
  // 비밀번호 강도 확인
  if (config.admin.password.length < 8) {
    throw new Error('Password must be at least 8 characters');
  }
  
  // DB 설정 확인
  if (!config.database.provider) {
    throw new Error('Database provider is required');
  }
}

async function connectDatabase(dbConfig: DatabaseConfig) {
  switch (dbConfig.provider) {
    case 'sqlite':
      await setupSQLite(dbConfig);
      break;
    case 'postgres':
      await setupPostgreSQL(dbConfig);
      break;
    case 'supabase':
      await setupSupabase(dbConfig);
      break;
  }
}

async function createAdminAccount(adminConfig: AdminConfig) {
  const passwordHash = await bcrypt.hash(adminConfig.password, 10);
  
  await db.allowedUsers.create({
    data: {
      email: adminConfig.email,
      name: adminConfig.name,
      password_hash: passwordHash,
      role: 'admin'
    }
  });
}

async function setInstalled() {
  // .env 파일 업데이트
  await updateEnvFile({ FIRST_RUN: 'false' });
  
  // 설치 완료 플래그 파일 생성
  await fs.writeFile('.installed', new Date().toISOString());
}
```

## Frontend 구현

### 설치 마법사 컴포넌트

```typescript
// apps/web/src/pages/Install/index.tsx

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Welcome from './Welcome';
import Configuration from './Configuration';
import Progress from './Progress';
import Complete from './Complete';

export default function Install() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [config, setConfig] = useState({});
  
  const handleStart = () => setStep(2);
  
  const handleConfigSubmit = async (formData) => {
    setConfig(formData);
    setStep(3);
    
    try {
      await fetch('/api/install/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      setStep(4);
    } catch (error) {
      alert('설치 실패: ' + error.message);
      setStep(2);
    }
  };
  
  const handleComplete = () => {
    navigate('/login');
  };
  
  return (
    <div className="install-wizard">
      {step === 1 && <Welcome onStart={handleStart} />}
      {step === 2 && <Configuration onSubmit={handleConfigSubmit} />}
      {step === 3 && <Progress />}
      {step === 4 && <Complete onComplete={handleComplete} />}
    </div>
  );
}
```

### WebSocket 진행 상황

```typescript
// apps/web/src/pages/Install/Progress.tsx

import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

export default function Progress() {
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const [logs, setLogs] = useState([]);
  
  useEffect(() => {
    const socket = io();
    
    socket.on('install:progress', (data) => {
      setProgress(data.percent);
      setCurrentStep(data.message);
      setLogs(prev => [...prev, {
        time: data.timestamp,
        message: data.message
      }]);
    });
    
    return () => socket.disconnect();
  }, []);
  
  return (
    <div className="progress-screen">
      <h2>설치 중...</h2>
      
      <div className="progress-bar">
        <div 
          className="progress-fill" 
          style={{ width: `${progress}%` }}
        />
      </div>
      <p>{progress}%</p>
      
      <p className="current-step">{currentStep}</p>
      
      <div className="steps">
        {/* 단계별 체크리스트 */}
      </div>
      
      <div className="logs">
        <h3>설치 로그</h3>
        <div className="log-content">
          {logs.map((log, i) => (
            <div key={i}>
              [{new Date(log.time).toLocaleTimeString()}] {log.message}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

## 첫 실행 감지

```typescript
// apps/api/src/index.ts

import express from 'express';

const app = express();

// 첫 실행 확인
const isFirstRun = process.env.FIRST_RUN === 'true' || 
                   !await fs.pathExists('.installed');

if (isFirstRun) {
  // 설치 마법사 라우트만 활성화
  app.use('/api/install', installRoutes);
  
  // 모든 요청을 /install로 리다이렉트
  app.get('*', (req, res) => {
    res.redirect('/install');
  });
  
} else {
  // 일반 모드
  app.use('/api', apiRoutes);
  // ...
}
```