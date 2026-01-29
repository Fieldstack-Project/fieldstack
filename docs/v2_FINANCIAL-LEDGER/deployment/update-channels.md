# 업데이트 채널 시스템

## 개요

Finance System은 **3개의 업데이트 채널**을 제공하여 사용자가 안정성과 최신 기능 사이에서 선택할 수 있도록 합니다.

---

## 채널 구조

```
Alpha (Dev/Nightly)
    ↓ 테스트 & 안정화
Beta (Preview)
    ↓ 검증 & 버그 수정
Release (Stable)
```

---

## 채널 종류

### 1. Release (Stable) - 안정 버전 ✅

**대상:**
- 일반 사용자
- 프로덕션 환경
- 안정성 최우선

**특징:**
- ✅ 충분히 테스트된 버전만 배포
- ✅ 최고 수준의 안정성
- ✅ 중요한 버그 수정만 포함
- ✅ 하위 호환성 보장
- ⏱️ 업데이트 주기: 2-4주

**버전 예시:**
```
v2.0.0  ← Major release
v2.1.0  ← Minor update (새 기능)
v2.1.1  ← Patch (버그 수정)
```

**권장 사용자:**
- 개인 홈서버
- 소규모 팀
- 안정성이 중요한 환경
- 처음 사용하는 사람

---

### 2. Beta (Preview) - 미리보기 버전 🔵

**대상:**
- 얼리 어답터
- 새 기능 테스터
- 피드백 제공자

**특징:**
- ✅ 새 기능 먼저 체험
- ⚠️ 안정화 진행 중
- ⚠️ 마이너 버그 있을 수 있음
- ✅ 주요 버그는 수정됨
- ⏱️ 업데이트 주기: 1주

**버전 예시:**
```
v2.2.0-beta.1
v2.2.0-beta.2
v2.2.0-beta.3
v2.2.0  ← Release로 승격
```

**권장 사용자:**
- 기술에 익숙한 사용자
- 피드백 제공 가능한 사람
- 테스트 환경
- 새 기능에 관심 있는 사람

**주의사항:**
- 중요한 데이터는 백업 필수
- 일부 불안정성 감수
- 버그 리포트 협조

---

### 3. Alpha (Dev/Nightly) - 개발 버전 🔴

**대상:**
- 개발자
- 컨트리뷰터
- 모듈 개발자
- 최신 코드 테스터

**특징:**
- ⚠️ 매일 빌드되는 최신 버전
- ⚠️ 불안정할 수 있음
- ⚠️ 브레이킹 체인지 가능
- ✅ 최신 기능 즉시 사용
- ⏱️ 업데이트 주기: 매일

**버전 예시:**
```
v2.3.0-alpha.20250129  ← 날짜 기반
v2.3.0-alpha.1
v2.3.0-alpha.2
```

**권장 사용자:**
- 개발자
- 기여자
- 버그 헌터
- 실험 환경만 사용

**경고:**
- ❌ 프로덕션 환경 사용 금지
- ❌ 중요한 데이터 보관 금지
- ⚠️ 언제든 깨질 수 있음
- ⚠️ 데이터 마이그레이션 필요할 수 있음

---

## 채널 비교표

| 특징 | Release | Beta | Alpha |
|------|---------|------|-------|
| **안정성** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐ |
| **최신 기능** | ⏰ 느림 | ⏰ 빠름 | ⚡ 즉시 |
| **버그 가능성** | ✅ 매우 낮음 | ⚠️ 낮음 | 🔴 높음 |
| **업데이트 주기** | 2-4주 | 1주 | 매일 |
| **하위 호환성** | ✅ 보장 | ✅ 보장 | ⚠️ 불확실 |
| **백업 필요성** | 권장 | 필수 | 절대 필수 |
| **프로덕션 사용** | ✅ 권장 | ⚠️ 주의 | ❌ 금지 |
| **기술 지원** | ✅ 전체 | ✅ 전체 | ⚠️ 제한적 |

---

## 설정 방법

### 웹 UI에서 설정

```
설정 → 시스템 → 자동 업데이트

┌─────────────────────────────────────┐
│ 업데이트 채널                        │
│                                     │
│ ( ) Release (Stable) - 권장         │
│     가장 안정적인 버전               │
│                                     │
│ ( ) Beta (Preview)                  │
│     새 기능을 먼저 체험               │
│     ⚠️ 일부 버그 있을 수 있음        │
│                                     │
│ ( ) Alpha (Dev/Nightly)             │
│     개발자용 최신 버전                │
│     ❌ 프로덕션 사용 금지             │
│                                     │
│ [저장]                              │
└─────────────────────────────────────┘
```

### 환경 변수로 설정

```env
# .env

# Release (기본값)
UPDATE_CHANNEL=release

# Beta
UPDATE_CHANNEL=beta

# Alpha
UPDATE_CHANNEL=alpha
```

### 설치 마법사에서 선택

```
┌─────────────────────────────────────┐
│ 6️⃣ 업데이트 채널 선택                │
├─────────────────────────────────────┤
│                                     │
│ 어떤 업데이트를 받고 싶으신가요?      │
│                                     │
│ ( ) Release (권장)                  │
│     • 가장 안정적                    │
│     • 프로덕션 환경에 적합            │
│     • 2-4주마다 업데이트              │
│                                     │
│ ( ) Beta                            │
│     • 새 기능 미리 체험               │
│     • 안정화 진행 중                  │
│     • 주 1회 업데이트                 │
│                                     │
│ ( ) Alpha (개발자용)                │
│     • 매일 최신 빌드                  │
│     • 불안정할 수 있음                │
│     • 프로덕션 사용 금지              │
│                                     │
│ 💡 나중에 설정에서 변경 가능합니다    │
│                                     │
│ [다음]                              │
└─────────────────────────────────────┘
```

---

## Backend 구현

### 채널 정의

```typescript
// apps/api/src/types/update.ts

export enum UpdateChannel {
  RELEASE = 'release',
  BETA = 'beta',
  ALPHA = 'alpha'
}

export interface UpdateChannelInfo {
  channel: UpdateChannel;
  displayName: string;
  description: string;
  stability: number;        // 1-5 (5 = 가장 안정적)
  updateFrequency: string;
  recommended: boolean;
  warnings: string[];
}

export const UPDATE_CHANNELS: Record<UpdateChannel, UpdateChannelInfo> = {
  [UpdateChannel.RELEASE]: {
    channel: UpdateChannel.RELEASE,
    displayName: 'Release (Stable)',
    description: '가장 안정적인 버전',
    stability: 5,
    updateFrequency: '2-4주',
    recommended: true,
    warnings: []
  },
  
  [UpdateChannel.BETA]: {
    channel: UpdateChannel.BETA,
    displayName: 'Beta (Preview)',
    description: '새 기능 미리 체험',
    stability: 4,
    updateFrequency: '1주',
    recommended: false,
    warnings: [
      '일부 버그가 있을 수 있습니다',
      '백업을 권장합니다'
    ]
  },
  
  [UpdateChannel.ALPHA]: {
    channel: UpdateChannel.ALPHA,
    displayName: 'Alpha (Dev/Nightly)',
    description: '개발자용 최신 버전',
    stability: 2,
    updateFrequency: '매일',
    recommended: false,
    warnings: [
      '⚠️ 프로덕션 환경 사용 금지',
      '⚠️ 불안정할 수 있음',
      '⚠️ 브레이킹 체인지 가능',
      '⚠️ 데이터 백업 필수'
    ]
  }
};
```

### 채널별 버전 확인

```typescript
// apps/api/src/services/update-checker.ts

export async function checkLatestVersion(
  channel: UpdateChannel = UpdateChannel.RELEASE
): Promise<string> {
  
  const apiUrl = getApiUrl(channel);
  
  const response = await fetch(apiUrl);
  const data = await response.json();
  
  return data.tag_name.replace('v', '');
}

function getApiUrl(channel: UpdateChannel): string {
  const baseUrl = 'https://api.github.com/repos/your-org/finance-system';
  
  switch (channel) {
    case UpdateChannel.RELEASE:
      // 정식 릴리스만
      return `${baseUrl}/releases/latest`;
    
    case UpdateChannel.BETA:
      // 베타 포함
      return `${baseUrl}/releases?per_page=1`;
    
    case UpdateChannel.ALPHA:
      // 모든 태그 (nightly 포함)
      return `${baseUrl}/tags?per_page=1`;
  }
}
```

### 채널 변경 API

```typescript
// apps/api/src/routes/settings.ts

router.post('/update-channel', requireAdmin, async (req, res) => {
  const { channel } = req.body;
  
  // 채널 검증
  if (!Object.values(UpdateChannel).includes(channel)) {
    return res.status(400).json({ 
      error: 'Invalid channel',
      validChannels: Object.values(UpdateChannel)
    });
  }
  
  // Alpha 채널 경고
  if (channel === UpdateChannel.ALPHA) {
    const confirmed = req.body.confirmed;
    
    if (!confirmed) {
      return res.status(400).json({
        error: 'Alpha channel requires confirmation',
        warnings: UPDATE_CHANNELS[UpdateChannel.ALPHA].warnings,
        message: '프로덕션 환경에서 Alpha 채널 사용은 권장하지 않습니다.'
      });
    }
  }
  
  // 채널 변경
  await updateSettings(req.user.id, 'update', {
    channel,
    changedAt: new Date(),
    changedBy: req.user.id
  });
  
  // 최신 버전 확인
  const latestVersion = await checkLatestVersion(channel);
  const currentVersion = await getCurrentVersion();
  
  res.json({
    success: true,
    channel,
    currentVersion,
    latestVersion,
    updateAvailable: latestVersion !== currentVersion
  });
});

// 채널 정보 조회
router.get('/update-channels', async (req, res) => {
  res.json({
    channels: UPDATE_CHANNELS,
    current: await getCurrentChannel(),
    recommended: UpdateChannel.RELEASE
  });
});
```

### 자동 업데이트 (채널별)

```typescript
// apps/api/src/services/updater.ts

export async function runAutoUpdate() {
  logger.info('Checking for updates...');
  
  // 현재 채널 확인
  const channel = await getCurrentChannel();
  const currentVersion = await getCurrentVersion();
  
  // 채널별 최신 버전 확인
  const latestVersion = await checkLatestVersion(channel);
  
  if (currentVersion === latestVersion) {
    logger.info(`Already up to date (${channel}: ${currentVersion})`);
    return { upToDate: true };
  }
  
  logger.info(`Update available: ${currentVersion} → ${latestVersion} (${channel})`);
  
  // Alpha 채널 추가 확인
  if (channel === UpdateChannel.ALPHA) {
    logger.warn('⚠️ Alpha channel update - proceeding with caution');
    
    // 추가 백업 생성
    await createExtraBackup('alpha-update');
  }
  
  // 업데이트 실행
  try {
    await performUpdate(latestVersion, channel);
    
    logger.info(`✅ Updated to ${latestVersion} (${channel})`);
    
    return {
      success: true,
      previousVersion: currentVersion,
      currentVersion: latestVersion,
      channel
    };
    
  } catch (error) {
    logger.error(`❌ Update failed (${channel})`, error);
    throw error;
  }
}

async function performUpdate(version: string, channel: UpdateChannel) {
  // 1. 백업
  await createBackup();
  
  // 2. Git fetch
  await execAsync('git fetch --all --tags');
  
  // 3. 채널별 체크아웃
  switch (channel) {
    case UpdateChannel.RELEASE:
      // 정식 릴리스 태그
      await execAsync(`git checkout v${version}`);
      break;
    
    case UpdateChannel.BETA:
      // 베타 태그 (v2.0.0-beta.1)
      await execAsync(`git checkout v${version}`);
      break;
    
    case UpdateChannel.ALPHA:
      // 최신 커밋 또는 nightly 태그
      await execAsync(`git checkout ${version}`);
      break;
  }
  
  // 4. 의존성 설치
  await execAsync('pnpm install');
  
  // 5. 마이그레이션
  await runMigrations();
  
  // 6. 빌드
  await execAsync('pnpm build');
  
  // 7. 검증
  await validateUpdate();
  
  // 8. 재시작
  await gracefulRestart();
}
```

---

## Frontend 구현

### 채널 선택 UI

```typescript
// apps/web/src/pages/Settings/UpdateChannel.tsx

import { useState } from 'react';
import { Card, Radio, Alert, Button, Modal } from '@core/ui';

export default function UpdateChannelSettings() {
  const [channel, setChannel] = useState<UpdateChannel>('release');
  const [showAlphaWarning, setShowAlphaWarning] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const handleChannelChange = async (newChannel: UpdateChannel) => {
    // Alpha 채널 선택 시 경고
    if (newChannel === 'alpha') {
      setShowAlphaWarning(true);
      return;
    }
    
    await updateChannel(newChannel);
  };
  
  const handleAlphaConfirm = async () => {
    setShowAlphaWarning(false);
    await updateChannel('alpha');
  };
  
  const updateChannel = async (newChannel: UpdateChannel) => {
    setLoading(true);
    
    try {
      const response = await fetch('/api/settings/update-channel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          channel: newChannel,
          confirmed: newChannel === 'alpha'
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setChannel(newChannel);
        
        notify.success(`채널이 ${newChannel}로 변경되었습니다`);
        
        if (data.updateAvailable) {
          notify.info(
            `새 버전 사용 가능: ${data.currentVersion} → ${data.latestVersion}`
          );
        }
      }
    } catch (error) {
      notify.error('채널 변경에 실패했습니다');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <>
      <Card title="업데이트 채널">
        <div className="space-y-4">
          {/* Release */}
          <div className="channel-option">
            <Radio
              value="release"
              checked={channel === 'release'}
              onChange={() => handleChannelChange('release')}
            >
              <div className="flex items-center gap-2">
                <span className="text-lg font-semibold">
                  Release (Stable)
                </span>
                <span className="badge badge-success">권장</span>
              </div>
            </Radio>
            <div className="ml-7 mt-2 text-sm text-gray-600">
              <p>✅ 가장 안정적인 버전</p>
              <p>✅ 프로덕션 환경에 적합</p>
              <p>⏱️ 업데이트 주기: 2-4주</p>
            </div>
          </div>
          
          {/* Beta */}
          <div className="channel-option">
            <Radio
              value="beta"
              checked={channel === 'beta'}
              onChange={() => handleChannelChange('beta')}
            >
              <div className="flex items-center gap-2">
                <span className="text-lg font-semibold">
                  Beta (Preview)
                </span>
                <span className="badge badge-info">미리보기</span>
              </div>
            </Radio>
            <div className="ml-7 mt-2 text-sm text-gray-600">
              <p>🔵 새 기능 먼저 체험</p>
              <p>⚠️ 일부 버그 있을 수 있음</p>
              <p>⏱️ 업데이트 주기: 1주</p>
            </div>
          </div>
          
          {/* Alpha */}
          <div className="channel-option">
            <Radio
              value="alpha"
              checked={channel === 'alpha'}
              onChange={() => handleChannelChange('alpha')}
            >
              <div className="flex items-center gap-2">
                <span className="text-lg font-semibold">
                  Alpha (Dev/Nightly)
                </span>
                <span className="badge badge-danger">개발자용</span>
              </div>
            </Radio>
            <div className="ml-7 mt-2 text-sm text-gray-600">
              <p className="text-red-600">
                ⚠️ 프로덕션 환경 사용 금지
              </p>
              <p>🔴 매일 최신 빌드</p>
              <p>🔴 불안정할 수 있음</p>
              <p>⏱️ 업데이트 주기: 매일</p>
            </div>
          </div>
        </div>
        
        <Alert type="info" className="mt-4">
          <strong>현재 버전:</strong> v2.1.0 ({channel})
          <br />
          채널을 변경하면 즉시 해당 채널의 최신 버전을 확인합니다.
        </Alert>
      </Card>
      
      {/* Alpha 경고 모달 */}
      <Modal
        isOpen={showAlphaWarning}
        onClose={() => setShowAlphaWarning(false)}
        title="⚠️ Alpha 채널 경고"
      >
        <div className="space-y-4">
          <Alert type="danger">
            <strong>주의:</strong> Alpha 채널은 매우 불안정합니다!
          </Alert>
          
          <div className="space-y-2">
            <p className="font-semibold">다음 사항을 확인하세요:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>프로덕션 환경이 아님</li>
              <li>중요한 데이터가 없음</li>
              <li>언제든 문제가 발생할 수 있음</li>
              <li>데이터 백업이 완료됨</li>
              <li>롤백 방법을 알고 있음</li>
            </ul>
          </div>
          
          <div className="bg-gray-100 p-4 rounded">
            <p className="text-sm">
              💡 <strong>권장:</strong> Alpha 채널은 별도의 테스트 환경에서만 사용하세요.
            </p>
          </div>
          
          <div className="flex gap-2 justify-end">
            <Button
              variant="secondary"
              onClick={() => setShowAlphaWarning(false)}
            >
              취소
            </Button>
            <Button
              variant="danger"
              onClick={handleAlphaConfirm}
              loading={loading}
            >
              위험을 이해하고 계속하기
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
```

### 채널 정보 표시

```typescript
// apps/web/src/components/VersionBadge.tsx

export function VersionBadge({ channel }: { channel: UpdateChannel }) {
  const config = {
    release: {
      color: 'green',
      label: 'Stable',
      icon: '✅'
    },
    beta: {
      color: 'blue',
      label: 'Preview',
      icon: '🔵'
    },
    alpha: {
      color: 'red',
      label: 'Dev',
      icon: '🔴'
    }
  };
  
  const { color, label, icon } = config[channel];
  
  return (
    <span className={`badge badge-${color}`}>
      {icon} {label}
    </span>
  );
}

// 사용
<div className="version-info">
  <span>v2.1.0</span>
  <VersionBadge channel="release" />
</div>
```

---

## GitHub Release 관리

### 릴리스 프로세스

```bash
# 1. Release (Stable)
git tag v2.1.0
git push origin v2.1.0

# GitHub에서 Release 생성
# - Title: v2.1.0
# - Mark as latest release ✅
# - Pre-release ❌

# 2. Beta (Preview)
git tag v2.2.0-beta.1
git push origin v2.2.0-beta.1

# GitHub에서 Release 생성
# - Title: v2.2.0-beta.1
# - Mark as latest release ❌
# - Pre-release ✅

# 3. Alpha (Dev/Nightly)
git tag v2.3.0-alpha.20250129
git push origin v2.3.0-alpha.20250129

# GitHub에서 Release 생성
# - Title: v2.3.0-alpha.20250129 (Nightly)
# - Mark as latest release ❌
# - Pre-release ✅
```

### GitHub Actions (자동 릴리스)

```yaml
# .github/workflows/release.yml

name: Release

on:
  push:
    tags:
      - 'v*'

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Determine channel
        id: channel
        run: |
          TAG=${GITHUB_REF#refs/tags/}
          if [[ $TAG =~ -alpha ]]; then
            echo "channel=alpha" >> $GITHUB_OUTPUT
            echo "prerelease=true" >> $GITHUB_OUTPUT
            echo "latest=false" >> $GITHUB_OUTPUT
          elif [[ $TAG =~ -beta ]]; then
            echo "channel=beta" >> $GITHUB_OUTPUT
            echo "prerelease=true" >> $GITHUB_OUTPUT
            echo "latest=false" >> $GITHUB_OUTPUT
          else
            echo "channel=release" >> $GITHUB_OUTPUT
            echo "prerelease=false" >> $GITHUB_OUTPUT
            echo "latest=true" >> $GITHUB_OUTPUT
          fi
      
      - name: Build
        run: |
          pnpm install
          pnpm build
      
      - name: Create Release
        uses: actions/create-release@v1
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          tag_name: ${{ github.ref }}
          release_name: Release ${{ github.ref }}
          prerelease: ${{ steps.channel.outputs.prerelease }}
          draft: false
```

### Nightly Build (자동)

```yaml
# .github/workflows/nightly.yml

name: Nightly Build

on:
  schedule:
    - cron: '0 0 * * *'  # 매일 자정 (UTC)
  workflow_dispatch:     # 수동 실행 가능

jobs:
  nightly:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Get version
        id: version
        run: |
          VERSION=$(node -p "require('./package.json').version")
          DATE=$(date +%Y%m%d)
          echo "tag=v${VERSION}-alpha.${DATE}" >> $GITHUB_OUTPUT
      
      - name: Build
        run: |
          pnpm install
          pnpm build
      
      - name: Create tag
        run: |
          git config user.name github-actions
          git config user.email github-actions@github.com
          git tag ${{ steps.version.outputs.tag }}
          git push origin ${{ steps.version.outputs.tag }}
      
      - name: Create Nightly Release
        uses: actions/create-release@v1
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          tag_name: ${{ steps.version.outputs.tag }}
          release_name: Nightly Build ${{ steps.version.outputs.tag }}
          body: |
            🔴 **Alpha (Nightly) Build**
            
            ⚠️ This is an unstable development build.
            ⚠️ Do not use in production.
            
            **Changes:** See commit history
          prerelease: true
          draft: false
```

---

## 채널 전환 시나리오

### Release → Beta

```typescript
// 안전한 전환
const result = await updateChannel('beta');

if (result.updateAvailable) {
  // Beta 채널의 새 버전 바로 확인됨
  console.log(`Update to ${result.latestVersion}?`);
}
```

### Beta → Release (다운그레이드)

```typescript
// 현재: v2.2.0-beta.3
// Release 최신: v2.1.0

await updateChannel('release');

// 경고: 다운그레이드
if (betaVersion > releaseVersion) {
  showWarning('채널을 변경하면 이전 버전으로 다운그레이드됩니다.');
}
```

### Release → Alpha (주의!)

```typescript
// 추가 확인 필수
const confirmed = await showAlphaWarning();

if (confirmed) {
  // 백업 생성
  await createBackup();
  
  // 채널 변경
  await updateChannel('alpha');
  
  // 즉시 최신 Alpha 버전 다운로드 가능
}
```

---

## 롤백 전략

### 채널별 롤백

```typescript
// apps/api/src/services/rollback.ts

export async function rollbackUpdate(targetChannel?: UpdateChannel) {
  logger.info('Starting rollback...');
  
  const currentChannel = await getCurrentChannel();
  const backups = await listBackups();
  
  // 채널별 최신 안정 백업 찾기
  const targetBackup = backups.find(b => 
    b.channel === (targetChannel || currentChannel) &&
    b.stable === true
  );
  
  if (!targetBackup) {
    throw new Error('No stable backup found');
  }
  
  // 롤백 실행
  await restoreBackup(targetBackup);
  
  logger.info(`Rolled back to ${targetBackup.version} (${targetBackup.channel})`);
}

// Alpha 채널에서 문제 발생 시 → Beta로 긴급 롤백
async function emergencyRollback() {
  const currentChannel = await getCurrentChannel();
  
  if (currentChannel === UpdateChannel.ALPHA) {
    logger.warn('⚠️ Alpha channel issue - rolling back to Beta');
    await rollbackUpdate(UpdateChannel.BETA);
  }
}
```

---

## 사용자 안내

### 첫 설치 시 권장사항

```
┌─────────────────────────────────────┐
│ 💡 채널 선택 가이드                  │
├─────────────────────────────────────┤
│                                     │
│ 처음 사용하시나요?                   │
│ → Release (Stable) 채널 선택         │
│                                     │
│ 새 기능이 궁금하신가요?              │
│ → Beta (Preview) 채널 고려           │
│                                     │
│ 개발자이신가요?                      │
│ → Alpha 채널은 별도 환경에서          │
│                                     │
└─────────────────────────────────────┘
```

### 문서화

```markdown
# 업데이트 채널 선택 가이드

## Release를 선택하세요:
- ✅ 처음 사용하는 경우
- ✅ 프로덕션 환경
- ✅ 안정성이 최우선
- ✅ 중요한 데이터 관리

## Beta를 선택하세요:
- 🔵 얼리 어답터
- 🔵 새 기능에 관심
- 🔵 피드백 제공 가능
- 🔵 테스트 환경 보유

## Alpha는 다음 경우만:
- 🔴 개발자
- 🔴 버그 테스터
- 🔴 별도 테스트 환경
- 🔴 데이터 손실 감수
```

---

## FAQ

### Q1. 채널을 변경하면 데이터가 손실되나요?
**A:** 아니요. 채널 변경 자체는 데이터에 영향을 주지 않습니다. 하지만 Alpha 채널의 불안정한 버전으로 업데이트 시 문제가 발생할 수 있으므로 백업을 권장합니다.

### Q2. Beta에서 Release로 변경하면 다운그레이드되나요?
**A:** 경우에 따라 다릅니다. Beta 버전이 Release보다 높으면 다운그레이드될 수 있습니다. 시스템이 자동으로 감지하고 경고합니다.

### Q3. Alpha 채널은 얼마나 불안정한가요?
**A:** 매우 불안정합니다. 매일 빌드되는 최신 코드로, 테스트가 부족하고 브레이킹 체인지가 포함될 수 있습니다. 절대 프로덕션 환경에서 사용하지 마세요.

### Q4. 채널 간 자동 전환이 가능한가요?
**A:** 아니요. 모든 채널 변경은 사용자가 수동으로 선택해야 합니다. Alpha 채널은 추가 확인이 필요합니다.

### Q5. Beta 버전에서 버그를 발견하면?
**A:** GitHub Issues에 리포트해주세요. Beta 테스터의 피드백은 매우 소중합니다!

---

## 모니터링 & 통계

### 채널별 사용 통계

```typescript
// 채널별 활성 사용자 추적
interface ChannelStats {
  channel: UpdateChannel;
  activeUsers: number;
  percentage: number;
}

// 예상 분포
// Release: 85%
// Beta: 12%
// Alpha: 3%
```

### 채널별 버그 리포트

```typescript
// 채널별 버그 발생률 모니터링
interface BugStats {
  channel: UpdateChannel;
  bugCount: number;
  severity: 'critical' | 'major' | 'minor';
}

// 목표
// Release: < 0.1 bugs/version
// Beta: < 1 bugs/version
// Alpha: 무제한 (expected)
```

---

## 결론

업데이트 채널 시스템을 통해:

1. **사용자 선택권** - 안정성과 최신 기능 사이 선택
2. **개발 속도** - 빠른 피드백 루프
3. **안정성 보장** - Release 채널의 높은 품질
4. **커뮤니티 참여** - Beta/Alpha 테스터 기여

**기본 권장사항: Release (Stable) 채널**