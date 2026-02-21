# 모듈 레지스트리

## 개요

공식 모듈 레지스트리는 GitHub 저장소로 관리되며, 인증된 모듈 목록과 상세 정보를 JSON 형식으로 제공합니다.

## 레지스트리 구조

```
github.com/Fieldstack-Project/module-registry/
├── README.md
├── modules.json              # 인증된 모듈 목록
├── categories.json           # 카테고리 정의
├── modules/                  # 개별 모듈 상세 정보
│   ├── ledger.json
│   ├── subscription.json
│   ├── crypto-tracker.json
│   └── todo.json
├── stats/
│   ├── downloads.json        # 다운로드 통계
│   └── trending.json         # 트렌딩 모듈
├── submissions/              # 새 모듈 제출 템플릿
│   ├── TEMPLATE.md
│   └── CHECKLIST.md
└── .github/
    └── workflows/
        ├── validate.yml      # PR 자동 검증
        └── update-stats.yml  # 통계 업데이트
```

## modules.json 형식

```json
{
  "version": "1.0.0",
  "lastUpdated": "2025-01-21T12:00:00Z",
  "modules": [
    {
      "id": "crypto-tracker",
      "name": "crypto-tracker",
      "displayName": "암호화폐 추적",
      "description": "비트코인, 이더리움 실시간 가격 추적",
      "author": "community-user",
      "authorUrl": "https://github.com/community-user",
      "verified": true,
      "category": "finance",
      "tags": ["crypto", "bitcoin", "ethereum", "portfolio"],
      "icon": "₿",
      "repository": "https://github.com/user/crypto-tracker",
      "homepage": "https://crypto-tracker.dev",
      "documentation": "https://docs.crypto-tracker.dev",
      "version": "2.1.0",
      "minCoreVersion": "1.0.0",
      "maxCoreVersion": null,
      "downloads": 523,
      "stars": 42,
      "rating": 4.8,
      "reviewCount": 15,
      "createdAt": "2024-12-01T00:00:00Z",
      "updatedAt": "2025-01-15T00:00:00Z",
      "detailUrl": "https://raw.githubusercontent.com/.../crypto-tracker.json",
      "screenshots": [
        "https://cdn.example.com/screenshots/crypto-1.png",
        "https://cdn.example.com/screenshots/crypto-2.png"
      ],
      "license": "MIT",
      "permissions": ["api:external"],
      "dependencies": [],
      "featured": false
    }
  ]
}
```

## categories.json 형식

```json
{
  "version": "1.0.0",
  "categories": [
    {
      "id": "finance",
      "name": "금융",
      "description": "가계부, 투자, 자산 관리",
      "icon": "💰",
      "color": "#10B981"
    },
    {
      "id": "productivity",
      "name": "생산성",
      "description": "TODO, 프로젝트 관리, 노트",
      "icon": "📊",
      "color": "#3B82F6"
    },
    {
      "id": "utility",
      "name": "유틸리티",
      "description": "백업, 동기화, 자동화",
      "icon": "🔧",
      "color": "#6B7280"
    },
    {
      "id": "theme",
      "name": "테마",
      "description": "UI 테마 및 커스터마이징",
      "icon": "🎨",
      "color": "#8B5CF6"
    }
  ]
}
```

## 개별 모듈 상세 (modules/crypto-tracker.json)

```json
{
  "id": "crypto-tracker",
  "name": "crypto-tracker",
  "displayName": "암호화폐 추적기",
  "description": "비트코인, 이더리움 등 주요 암호화폐의 실시간 가격을 추적하고 포트폴리오를 관리합니다.",
  "longDescription": "# 암호화폐 추적기\n\n실시간 가격 추적과 포트폴리오 관리를 한 곳에서...",
  "author": {
    "name": "crypto-dev",
    "url": "https://github.com/crypto-dev",
    "email": "dev@crypto-tracker.dev"
  },
  "repository": "https://github.com/crypto-dev/crypto-tracker",
  "homepage": "https://crypto-tracker.dev",
  "documentation": "https://docs.crypto-tracker.dev",
  "bug": "https://github.com/crypto-dev/crypto-tracker/issues",
  "version": "2.1.0",
  "license": "MIT",
  "category": "finance",
  "tags": ["crypto", "bitcoin", "ethereum", "portfolio", "investment"],
  "icon": "₿",
  "screenshots": [
    {
      "url": "https://cdn.example.com/screenshots/crypto-1.png",
      "title": "메인 대시보드",
      "description": "실시간 가격과 포트폴리오 요약"
    },
    {
      "url": "https://cdn.example.com/screenshots/crypto-2.png",
      "title": "상세 차트",
      "description": "가격 추이 및 기술적 분석"
    }
  ],
  "features": [
    "실시간 가격 추적 (CoinGecko API)",
    "포트폴리오 관리",
    "수익률 계산",
    "가격 알림",
    "다중 거래소 지원",
    "히스토리 차트"
  ],
  "requirements": {
    "minCoreVersion": "1.0.0",
    "maxCoreVersion": null,
    "permissions": ["api:external"],
    "dependencies": []
  },
  "installation": "# 설치\n\n1. 마켓플레이스에서 설치 버튼 클릭\n2. 또는...",
  "usage": "# 사용법\n\n1. API Key 발급...",
  "changelog": [
    {
      "version": "2.1.0",
      "date": "2025-01-15",
      "changes": [
        "새로운 코인 추가: Solana, Cardano",
        "가격 알림 기능 개선",
        "버그 수정"
      ]
    },
    {
      "version": "2.0.0",
      "date": "2024-12-01",
      "changes": [
        "UI 전면 개편",
        "포트폴리오 추적 기능 추가"
      ]
    }
  ],
  "stats": {
    "downloads": 523,
    "stars": 42,
    "forks": 8,
    "rating": 4.8,
    "reviewCount": 15
  },
  "support": {
    "documentation": "https://docs.crypto-tracker.dev",
    "issues": "https://github.com/crypto-dev/crypto-tracker/issues",
    "discord": "https://discord.gg/crypto-tracker",
    "email": "support@crypto-tracker.dev"
  },
  "verified": true,
  "featured": false,
  "createdAt": "2024-12-01T00:00:00Z",
  "updatedAt": "2025-01-15T00:00:00Z"
}
```

## 통계 수집

### downloads.json

```json
{
  "lastUpdated": "2025-01-21T12:00:00Z",
  "total": 12345,
  "modules": {
    "ledger": {
      "total": 1234,
      "daily": {
        "2025-01-20": 45,
        "2025-01-19": 38
      },
      "monthly": {
        "2025-01": 523,
        "2024-12": 711
      }
    },
    "crypto-tracker": {
      "total": 523,
      "daily": {
        "2025-01-20": 12,
        "2025-01-19": 8
      }
    }
  }
}
```

### trending.json

```json
{
  "lastUpdated": "2025-01-21T12:00:00Z",
  "period": "7days",
  "modules": [
    {
      "id": "crypto-tracker",
      "downloads": 156,
      "growth": "+45%"
    },
    {
      "id": "stock-tracker",
      "downloads": 89,
      "growth": "+32%"
    }
  ]
}
```

## 모듈 인증 프로세스

### 제출 절차

#### 1. GitHub에 모듈 레포 생성

git init으로 저장소를 초기화하고, 전체 파일을 추가하여 커밋합니다. GitHub의 원본 저장소를 연결한 후 main 브랜치를 푸시합니다.

#### 2. module-registry에 PR 제출

**submissions/my-module.json 생성:**
```json
{
  "name": "my-module",
  "displayName": "내 모듈",
  "description": "모듈 설명",
  "repository": "https://github.com/username/my-module",
  "version": "1.0.0",
  "category": "productivity",
  "author": "username"
}
```

**PR 템플릿:**
```markdown
## 새 모듈 제출

### 기본 정보
- 모듈명: my-module
- 카테고리: productivity
- 버전: 1.0.0

### 체크리스트
- [x] README.md 작성
- [x] module.json 올바름
- [x] 테스트 작성
- [x] MIT 라이선스
- [x] 악성 코드 없음
- [x] 개인정보 수집 없음

### 설명
이 모듈은 ...
```

#### 3. 메인테이너 검토

**자동 검증 (GitHub Actions):**
```yaml
# .github/workflows/validate.yml
name: Validate Module Submission

on:
  pull_request:
    paths:
      - 'submissions/**'

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Validate JSON
        run: |
          npm install -g ajv-cli
          ajv validate -s schema.json -d submissions/*.json
      
      - name: Check repository
        run: |
          # repository가 실제로 존재하는지 확인
          
      - name: Clone and scan
        run: |
          # 모듈 코드 클론
          # 악성 코드 패턴 스캔
          
      - name: Verify module.json
        run: |
          # module.json 필수 필드 확인
```

**수동 검토:**
- 코드 리뷰
- 보안 체크
- 문서 품질
- 라이선스 확인

#### 4. 승인 후 자동 처리

```yaml
# .github/workflows/publish.yml
name: Publish Module

on:
  pull_request:
    types: [closed]
    paths:
      - 'submissions/**'

jobs:
  publish:
    if: github.event.pull_request.merged == true
    runs-on: ubuntu-latest
    steps:
      - name: Move to modules/
        run: |
          mv submissions/my-module.json modules/my-module.json
          
      - name: Update modules.json
        run: |
          # modules.json에 추가
          
      - name: Commit and push
        run: |
          git add .
          git commit -m "Publish module: my-module"
          git push
```

### 보안 정책

#### 1. 코드 스캔

스캔 대상으로 금지되는 패턴은 다음과 같습니다: eval() 함수 사용, child_process 모듈 사용, fs 모듈을 통한 직접 파일 접근, 외부 스크립트 로드.

#### 2. 권한 검증

모듈의 코드를 분석하여 실제로 사용되는 권한 목록을 추출합니다. 이를 module.json에서 선언된 권한 목록과 비교합니다. 실제로 사용되는 권한이 선언된 권한에 포함되지 않으면 에러를 발생시킵니다.

#### 3. 라이선스 확인
- MIT, Apache 2.0 등 호환 라이선스만 허용
- GPL 계열 제외 (전염성 방지)

#### 4. 정기적인 재검증

```yaml
# .github/workflows/revalidate.yml
name: Revalidate Modules

on:
  schedule:
    - cron: '0 0 * * 0'  # 매주 일요일

jobs:
  revalidate:
    runs-on: ubuntu-latest
    steps:
      - name: Check all modules
        run: |
          # 모든 등록된 모듈 재검증
          # 문제 발견 시 이슈 생성
```

## API 엔드포인트

### 공식 레지스트리 API

```
# 모듈 목록
GET https://raw.githubusercontent.com/Fieldstack-Project/module-registry/main/modules.json

# 개별 모듈 상세
GET https://raw.githubusercontent.com/Fieldstack-Project/module-registry/main/modules/{id}.json

# 카테고리 목록
GET https://raw.githubusercontent.com/Fieldstack-Project/module-registry/main/categories.json

# 통계
GET https://raw.githubusercontent.com/Fieldstack-Project/module-registry/main/stats/downloads.json
GET https://raw.githubusercontent.com/Fieldstack-Project/module-registry/main/stats/trending.json
```

### 검색 API (Algolia)

Algolia 클라이언트를 초기화하고 'modules' 인덱스에 접근합니다. 검색할 때는 키워드를 search 메서드에 넘기면 매칭되는 모듈 목록을 반환합니다. 필터 조건이 필요하면 filters 옵션을 사용하여 카테고리와 검증 여부 등을 조합하여 검색할 수 있습니다.

## 버전 관리

### 모듈 버전
- 시맨틱 버저닝 (major.minor.patch)
- 메이저 버전: 호환성 깨지는 변경
- 마이너 버전: 새 기능 추가
- 패치 버전: 버그 수정

### 레지스트리 버전
- modules.json 스키마 버전
- 하위 호환성 유지