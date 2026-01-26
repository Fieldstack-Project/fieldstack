# 모듈 설치 및 관리

## 설치 방식

### 1. 앱 내 마켓플레이스에서 설치 (권장)

#### 사용자 관점 플로우

```
1. 마켓플레이스 메뉴 클릭
   ↓
2. 모듈 검색 또는 탐색
   ↓
3. 원하는 모듈 선택
   ↓
4. "설치" 버튼 클릭
   ↓
5. 권한 확인 및 동의
   ↓
6. 설치 진행 (자동)
   ↓
7. 완료 → 즉시 사용 가능
```

#### 기술적 흐름

```
웹 UI → API: POST /api/system/modules/install
              ↓
Backend: 1. 레지스트리에서 모듈 정보 조회
         2. GitHub에서 모듈 코드 다운로드
         3. 보안 검증
         4. modules/ 폴더에 설치
         5. module.json 검증
         6. DB 마이그레이션 실행
         7. 모듈 초기화
              ↓
Module Loader: 자동 감지 및 로드
              ↓
Frontend: 라우트 등록 및 메뉴 추가
              ↓
통계 서버: 다운로드 카운트 증가
```

### 2. 수동 설치 (Git Clone)

```bash
# modules/ 폴더로 이동
cd modules/

# Git clone으로 설치
git clone https://github.com/username/crypto-tracker

# 또는 특정 버전 설치
git clone -b v2.1.0 https://github.com/username/crypto-tracker

# 의존성 설치 (필요시)
cd crypto-tracker
npm install
```

## Backend 구현

### 모듈 설치 API

```typescript
// apps/api/src/routes/modules.ts

import { Router } from 'express';
import { installModule, uninstallModule, updateModule } from '../services/module-manager';

const router = Router();

// 모듈 설치
router.post('/install', async (req, res) => {
  const { moduleId } = req.body;
  
  try {
    // 1. 레지스트리에서 모듈 정보 조회
    const moduleInfo = await fetchModuleInfo(moduleId);
    
    // 2. 권한 확인
    if (!hasPermission(req.user, 'admin')) {
      return res.status(403).json({ error: 'Admin permission required' });
    }
    
    // 3. 이미 설치되어 있는지 확인
    if (await isInstalled(moduleId)) {
      return res.status(400).json({ error: 'Module already installed' });
    }
    
    // 4. 설치 시작
    const result = await installModule(moduleInfo, {
      onProgress: (progress) => {
        // WebSocket으로 진행 상황 전송
        io.emit('module:install:progress', {
          moduleId,
          progress: progress.percent,
          message: progress.message
        });
      }
    });
    
    // 5. 통계 전송
    await trackInstall(moduleId);
    
    res.json(result);
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 모듈 제거
router.delete('/:moduleId', async (req, res) => {
  try {
    await uninstallModule(req.params.moduleId, {
      preserveData: req.query.preserveData === 'true'
    });
    
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 모듈 업데이트
router.post('/:moduleId/update', async (req, res) => {
  try {
    const result = await updateModule(req.params.moduleId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
```

### 모듈 매니저 서비스

```typescript
// apps/api/src/services/module-manager.ts

import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs-extra';

const execAsync = promisify(exec);

export async function installModule(
  moduleInfo: ModuleInfo, 
  options?: InstallOptions
) {
  const modulePath = path.join(process.cwd(), 'modules', moduleInfo.name);
  
  try {
    // 1. Git clone
    options?.onProgress?.({ percent: 10, message: '모듈 다운로드 중...' });
    
    await execAsync(
      `git clone ${moduleInfo.repository} ${modulePath}`
    );
    
    // 2. 특정 버전 체크아웃
    if (moduleInfo.version) {
      await execAsync(`git checkout v${moduleInfo.version}`, {
        cwd: modulePath
      });
    }
    
    // 3. module.json 검증
    options?.onProgress?.({ percent: 30, message: '모듈 검증 중...' });
    
    const moduleJson = await fs.readJson(
      path.join(modulePath, 'module.json')
    );
    
    validateModuleJson(moduleJson);
    
    // 4. 보안 검증
    options?.onProgress?.({ percent: 50, message: '보안 검사 중...' });
    
    await securityScan(modulePath);
    
    // 5. 의존성 설치
    options?.onProgress?.({ percent: 60, message: '의존성 설치 중...' });
    
    if (await fs.pathExists(path.join(modulePath, 'package.json'))) {
      await execAsync('npm install', { cwd: modulePath });
    }
    
    // 6. 빌드 (필요시)
    if (moduleJson.build) {
      options?.onProgress?.({ percent: 70, message: '빌드 중...' });
      await execAsync('npm run build', { cwd: modulePath });
    }
    
    // 7. DB 마이그레이션
    options?.onProgress?.({ percent: 80, message: 'DB 마이그레이션 중...' });
    
    await runMigrations(modulePath);
    
    // 8. 모듈 초기화
    options?.onProgress?.({ percent: 90, message: '초기화 중...' });
    
    const module = await import(path.join(modulePath, 'backend'));
    if (module.initialize) {
      await module.initialize();
    }
    
    // 9. 완료
    options?.onProgress?.({ percent: 100, message: '설치 완료!' });
    
    return {
      success: true,
      module: moduleJson
    };
    
  } catch (error) {
    // 실패 시 롤백
    await fs.remove(modulePath);
    throw error;
  }
}

export async function uninstallModule(
  moduleId: string, 
  options?: { preserveData?: boolean }
) {
  const modulePath = path.join(process.cwd(), 'modules', moduleId);
  
  // 1. 모듈 종료
  const module = await import(path.join(modulePath, 'backend'));
  if (module.shutdown) {
    await module.shutdown();
  }
  
  // 2. 데이터 삭제 (옵션)
  if (!options?.preserveData) {
    await cleanupModuleData(moduleId);
  }
  
  // 3. 폴더 삭제
  await fs.remove(modulePath);
  
  return { success: true };
}

export async function updateModule(moduleId: string) {
  const modulePath = path.join(process.cwd(), 'modules', moduleId);
  
  // 1. 현재 버전 확인
  const currentVersion = await getCurrentVersion(modulePath);
  
  // 2. 최신 버전 확인
  const latestVersion = await getLatestVersion(moduleId);
  
  if (currentVersion === latestVersion) {
    return { upToDate: true };
  }
  
  // 3. Git pull
  await execAsync('git pull', { cwd: modulePath });
  
  // 4. 새 버전 체크아웃
  await execAsync(`git checkout v${latestVersion}`, { cwd: modulePath });
  
  // 5. 의존성 업데이트
  await execAsync('npm install', { cwd: modulePath });
  
  // 6. DB 마이그레이션
  await runMigrations(modulePath);
  
  // 7. 재시작 (핫 리로드)
  await reloadModule(moduleId);
  
  return {
    success: true,
    previousVersion: currentVersion,
    currentVersion: latestVersion
  };
}
```

### 보안 검증

```typescript
// apps/api/src/services/security-scanner.ts

export async function securityScan(modulePath: string) {
  const issues: string[] = [];
  
  // 1. 악성 코드 패턴 검사
  const files = await getAllFiles(modulePath, ['.ts', '.tsx', '.js', '.jsx']);
  
  for (const file of files) {
    const content = await fs.readFile(file, 'utf-8');
    
    // eval() 사용 금지
    if (content.includes('eval(')) {
      issues.push(`Forbidden: eval() found in ${file}`);
    }
    
    // child_process 사용 금지
    if (content.includes('child_process')) {
      issues.push(`Forbidden: child_process found in ${file}`);
    }
    
    // 외부 스크립트 로드 금지
    if (content.match(/new Function|Function\(/)) {
      issues.push(`Forbidden: dynamic function creation in ${file}`);
    }
  }
  
  // 2. module.json 권한 확인
  const moduleJson = await fs.readJson(
    path.join(modulePath, 'module.json')
  );
  
  const usedPermissions = detectPermissions(files);
  const declaredPermissions = moduleJson.permissions || [];
  
  for (const permission of usedPermissions) {
    if (!declaredPermissions.includes(permission)) {
      issues.push(`Undeclared permission: ${permission}`);
    }
  }
  
  // 3. 이슈 발견 시 실패
  if (issues.length > 0) {
    throw new Error(`Security issues found:\n${issues.join('\n')}`);
  }
}
```

## Frontend 구현

### 모듈 설치 UI

```typescript
// apps/web/src/pages/Marketplace.tsx

import { useState } from 'react';
import { PageLayout, Card, Button, Modal, Progress } from '@core/ui';
import { useModules } from '../hooks/useModules';

export default function Marketplace() {
  const { modules, installModule } = useModules();
  const [installing, setInstalling] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  
  const handleInstall = async (moduleId: string) => {
    setInstalling(moduleId);
    setProgress(0);
    
    try {
      await installModule(moduleId, {
        onProgress: (p) => setProgress(p.percent)
      });
      
      // 설치 완료 알림
      notify.success('설치가 완료되었습니다!');
    } catch (error) {
      notify.error('설치에 실패했습니다');
    } finally {
      setInstalling(null);
    }
  };
  
  return (
    <PageLayout title="마켓플레이스">
      <div className="grid grid-cols-3 gap-4">
        {modules.map(module => (
          <Card key={module.id}>
            <div className="flex items-center gap-3 mb-3">
              <span className="text-3xl">{module.icon}</span>
              <div>
                <h3 className="font-semibold">{module.displayName}</h3>
                <p className="text-sm text-gray-600">
                  by {module.author}
                </p>
              </div>
            </div>
            
            <p className="text-sm mb-4">{module.description}</p>
            
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">
                ⭐ {module.rating} ({module.reviewCount})
                <br />
                📥 {module.downloads.toLocaleString()}
              </div>
              
              <Button
                variant="primary"
                onClick={() => handleInstall(module.id)}
                loading={installing === module.id}
                disabled={module.installed}
              >
                {module.installed ? '설치됨' : '설치'}
              </Button>
            </div>
          </Card>
        ))}
      </div>
      
      {/* 설치 진행 모달 */}
      <Modal
        isOpen={installing !== null}
        title="모듈 설치 중"
      >
        <Progress value={progress} max={100} />
        <p className="mt-2 text-sm text-gray-600">
          {progress}% 완료
        </p>
      </Modal>
    </PageLayout>
  );
}
```

### WebSocket으로 실시간 진행 상황

```typescript
// apps/web/src/hooks/useModules.ts

import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

export function useModules() {
  const [modules, setModules] = useState([]);
  
  const installModule = async (moduleId: string, options?: any) => {
    // WebSocket 연결
    const socket = io();
    
    socket.on('module:install:progress', (data) => {
      if (data.moduleId === moduleId) {
        options?.onProgress?.(data);
      }
    });
    
    // API 호출
    const response = await fetch('/api/system/modules/install', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ moduleId })
    });
    
    if (!response.ok) {
      throw new Error('Installation failed');
    }
    
    socket.disconnect();
    return await response.json();
  };
  
  return { modules, installModule };
}
```

## 모듈 ON/OFF 토글

### module.json 업데이트

```typescript
// apps/api/src/routes/modules.ts

router.patch('/:moduleId/toggle', async (req, res) => {
  const { moduleId } = req.params;
  const { enabled } = req.body;
  
  const modulePath = path.join(process.cwd(), 'modules', moduleId);
  const configPath = path.join(modulePath, 'module.json');
  
  // module.json 읽기
  const config = await fs.readJson(configPath);
  
  // enabled 업데이트
  config.enabled = enabled;
  
  // 저장
  await fs.writeJson(configPath, config, { spaces: 2 });
  
  // 모듈 로더에 변경 알림
  if (enabled) {
    await loadModule(moduleId);
  } else {
    await unloadModule(moduleId);
  }
  
  res.json({ success: true });
});
```

### UI 토글 스위치

```typescript
// apps/web/src/pages/InstalledModules.tsx

<Switch
  checked={module.enabled}
  onChange={(enabled) => toggleModule(module.id, enabled)}
/>
```

## 모듈 업데이트

### 업데이트 확인

```typescript
// apps/api/src/services/update-checker.ts

export async function checkUpdates() {
  const installedModules = await getInstalledModules();
  const updates = [];
  
  for (const module of installedModules) {
    const latestVersion = await getLatestVersion(module.id);
    
    if (latestVersion !== module.version) {
      updates.push({
        moduleId: module.id,
        currentVersion: module.version,
        latestVersion,
        changelog: await getChangelog(module.id, latestVersion)
      });
    }
  }
  
  return updates;
}
```

### 업데이트 UI

```typescript
// apps/web/src/pages/Updates.tsx

<Card title="업데이트 가능">
  {updates.map(update => (
    <div key={update.moduleId}>
      <h3>{update.moduleId}</h3>
      <p>
        {update.currentVersion} → {update.latestVersion}
      </p>
      <Button onClick={() => updateModule(update.moduleId)}>
        업데이트
      </Button>
    </div>
  ))}
</Card>
```

## 모듈 제거

### 데이터 보존 옵션

```typescript
<Modal title="모듈 제거" isOpen={showRemoveModal}>
  <p>정말 제거하시겠습니까?</p>
  
  <Checkbox
    label="데이터 보존"
    checked={preserveData}
    onChange={setPreserveData}
  />
  
  <div className="mt-4">
    <Button onClick={handleRemove} variant="danger">
      제거
    </Button>
    <Button onClick={closeModal} variant="secondary">
      취소
    </Button>
  </div>
</Modal>
```

## 통계 전송

```typescript
// 설치 시 통계 전송
async function trackInstall(moduleId: string) {
  try {
    await fetch('https://your-finance-system.dev/api/track-install', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        moduleId,
        timestamp: new Date().toISOString()
      })
    });
  } catch {
    // 통계 전송 실패는 무시
  }
}
```