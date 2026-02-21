# 업데이트 채널 시스템

## 개요

Fieldstack은 **3개의 업데이트 채널**을 제공하여 사용자가 안정성과 최신 기능 사이에서 선택할 수 있도록 합니다.

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
- 기술에 익숑한 사용자
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

`apps/api/src/types/update.ts`에서 `UpdateChannel` enum과 각 채널의 상세 정보를 정의합니다.

`UpdateChannel` enum은 `RELEASE`, `BETA`, `ALPHA` 세 가지 값을 가집니다.

`UpdateChannelInfo` 인터페이스는 채널명, 표시명, 설명, 안정도(1~5 스케일), 업데이트 주기, 권장 여부, 경고 메시지 목록을 속성으로 구성합니다.

`UPDATE_CHANNELS` 상수 객체는 각 채널별로 다음과 같이 정의됩니다. Release는 안정도 5, 업데이트 주기 2~4주, 권장 채널로 경고 없이 설정됩니다. Beta는 안정도 4, 업데이트 주기 1주, 권장하지 않으며 "일부 버그가 있을 수 있다"와 "백업을 권장한다"는 경고가 포함됩니다. Alpha는 안정도 2, 업데이트 주기 매일, 권장하지 않으며 프로덕션 사용 금지, 불안정 가능, 브레이킹 체인지 가능, 백업 필수 등 네 가지 경고가 포함됩니다.

### 채널별 버전 확인

`apps/api/src/services/update-checker.ts`의 `checkLatestVersion` 함수는 채널에 따라 GitHub API의 서로 다른 엔드포인트를 호출합니다.

`getApiUrl` 함수로 결정되는 URL은 다음과 같습니다. Release 채널은 `/releases/latest`를 호출하여 정식 릴리스만 조회합니다. Beta 채널은 `/releases?per_page=1`을 호출하여 Pre-release를 포함한 최신 릴리스를 조회합니다. Alpha 채널은 `/tags?per_page=1`을 호출하여 nightly 빌드 태그를 포함한 모든 태그 중 최신 것을 조회합니다.

응답에서 `tag_name`의 앞의 `v`를 제거하여 버전 문자열로 반환합니다.

### 채널 변경 API

`apps/api/src/routes/settings.ts`의 `POST /update-channel` 라우트는 관리자 권한을 확인한 후 처리됩니다.

먼저 요청본문의 channel 값이 유효한 UpdateChannel 값인지 검증합니다. 유효하지 않으면 400 상태와 가능한 채널 목록을 반환합니다.

Alpha 채널로 변경하려면 추가 확인이 필요합니다. 요청본문에 `confirmed: true`가 포함되지 않으면, Alpha 채널의 경고 메시지와 권장하지 않음을 안내하는 400 응답을 반환합니다.

검증이 통과하면 사용자 설정에 새 채널과 변경 시간, 변경자 정보를 저장합니다. 이후 해당 채널의 최신 버전과 현재 버전을 비교하여 업데이트 가능 여부와 함께 성공 응답을 반환합니다.

`GET /update-channels` 라우트는 모든 채널 정보, 현재 채널, 권장 채널(Release)을 반환합니다.

### 자동 업데이트 (채널별)

`apps/api/src/services/updater.ts`의 `runAutoUpdate` 함수는 현재 채널과 현재 버전을 조회한 후 해당 채널의 최신 버전을 확인합니다. 이미 최신 버전이면 종료합니다.

Alpha 채널인 경우 경고 로그를 출력하고 추가 백업을 생성합니다.

`performUpdate` 함수는 업데이트를 단계별로 수행합니다. 먼저 백업을 생성한 후 `git fetch --all --tags`로 원본 저장소를 가져옵니다. 채널에 따라 체크아웃 방식이 달라집니다: Release와 Beta는 해당 버전의 태그를 체크아웃하고(`git checkout v{version}`), Alpha는 최신 커밋 또는 nightly 태그를 체크아웃합니다. 이후 `pnpm install`로 의존성을 설치하고, DB 마이그레이션을 실행하고, `pnpm build`로 빌드합니다. 마지막으로 업데이트 결과를 검증한 후 서버를 재시작합니다.

---

## Frontend 구현

### 채널 선택 UI

`apps/web/src/pages/Settings/UpdateChannel.tsx`의 `UpdateChannelSettings` 컴포넌트는 현재 채널 상태와 Alpha 경고 모달 표시 여부를 관리합니다.

채널 변경 시 Alpha가 아니면 바로 `updateChannel`을 호출합니다. Alpha를 선택하면 경고 모달을 표시합니다. 모달에서 확인하면 Alpha로 변경을 진행합니다.

`updateChannel` 함수는 `/api/settings/update-channel`에 POST 요청을 보냅니다. 응답이 성공하면 채널 상태를 업데이트하고 성공 알림을 표시합니다. 응답에 업데이트 가능 정보가 포함되어 있으면 새 버전 사용 가능 알림도 표시합니다.

렌더링 시에는 Release, Beta, Alpha 세 가지 Radio 옵션이 표시됩니다. 각 옵션 아래에 안정성, 주의사항, 업데이트 주기 등의 설명이 포함됩니다. Release 옵션에는 "권장" 배지가, Beta에는 "미리보기" 배지가, Alpha에는 "개발자용" 배지가 붙습니다. Alpha 옵션의 설명에는 빨간색으로 프로덕션 사용 금지를 강조합니다.

Alpha 경고 모달은 danger 타입의 Alert로 불안정성을 강조하고, 프로덕션 환경이 아님, 중요한 데이터가 없음, 백업이 완료됨, 롤백 방법을 알고 있음 등의 확인 항목을 표시합니다. 취소 버튼과 "위험을 이해하고 계속하기" 버튼이 제공됩니다.

### 채널 정보 표시

`apps/web/src/components/VersionBadge.tsx`의 `VersionBadge` 컴포넌트는 현재 채널에 맞는 배지를 렌더링합니다. Release는 초록색 배지에 "✅ Stable" 표시, Beta는 파란색 배지에 "🔵 Preview" 표시, Alpha는 빨간색 배지에 "🔴 Dev" 표시됩니다. 버전 정보와 함께 사용할 때는 버전 텍스트 옆에 배지가 표시됩니다.

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

**Release → Beta:** 안전한 전환입니다. `updateChannel('beta')`를 호출하면 Beta 채널의 새 버전이 즉시 확인됩니다.

**Beta → Release (다운그레이드):** 현재 Beta 버전이 Release 최신 버전보다 높을 수 있습니다. 이 경우 시스템이 자동으로 다운그레이드임을 감지하여 경고를 표시합니다.

**Release → Alpha (주의!):** 추가 확인이 필수입니다. Alpha 경고 모달을 통해 사용자 확인을 받은 후, 백업을 생성하고 채널을 변경합니다. 변경 후 즉시 최신 Alpha 버전을 다운로드할 수 있습니다.

---

## 롤백 전략

`apps/api/src/services/rollback.ts`의 `rollbackUpdate` 함수는 백업 목록을 조회하여 대상 채널의 안정적인 백업을 찾습니다. 해당 백업이 있으면 복원을 실행합니다. 대상 채널이 지정되지 않으면 현재 채널의 백업을 사용합니다.

`emergencyRollback` 함수는 Alpha 채널에서 문제가 발생했을 때 사용됩니다. 현재 채널이 Alpha이면 경고 로그를 출력하고 Beta 채널로 긴급 롤백을 실행합니다.

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

Release를 선택해야 하는 경우: 처음 사용하는 경우, 프로덕션 환경, 안정성이 최우선인 경우, 중요한 데이터를 관리하는 경우에 해당합니다.

Beta를 선택해야 하는 경우: 얼리 어답터이거나, 새 기능에 관심이 있거나, 피드백을 제공할 수 있거나, 테스트 환경을 보유한 경우에 해당합니다.

Alpha는 개발자, 버그 테스터, 별도의 테스트 환경을 사용하거나, 데이터 손실을 감수할 수 있는 경우에만 사용합니다.

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

채널별 활성 사용자 수를 추적합니다. 예상 분포는 Release 85%, Beta 12%, Alpha 3%입니다.

### 채널별 버그 리포트

채널별 버그 발생률을 모니터링합니다. 목표 기준은 Release는 버전당 0.1건 미만, Beta는 버전당 1건 미만이며, Alpha는 제한 없이 예상됩니다.

---

## 결론

업데이트 채널 시스템을 통해:

1. **사용자 선택권** - 안정성과 최신 기능 사이 선택
2. **개발 속도** - 빠른 피드백 루프
3. **안정성 보장** - Release 채널의 높은 품질
4. **커뮤니티 참여** - Beta/Alpha 테스터 기여

**기본 권장사항: Release (Stable) 채널**