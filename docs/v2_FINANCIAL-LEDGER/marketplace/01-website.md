# 공식 웹사이트 구조

## 개요

공식 웹사이트는 **Docusaurus**를 사용하여 구축하며, 마켓플레이스와 문서를 하나의 사이트에서 제공합니다.

## 기술 스택

- **Docusaurus** - React 기반 정적 사이트 생성기
- **Cloudflare Pages** - 무료 호스팅 및 CDN
- **Algolia DocSearch** - 무료 검색 기능
- **Cloudflare Workers** - 통계 API (선택)
- **GitHub Actions** - 자동 배포

## URL 구조

```
https://Fieldstack.dev/
├── /                           # 홈페이지
├── /docs/                      # 문서
│   ├── /getting-started/
│   ├── /user-guide/
│   ├── /developer/
│   └── /deployment/
├── /marketplace/               # 마켓플레이스
│   ├── /                       # 모듈 목록
│   ├── /module/[id]            # 모듈 상세
│   ├── /category/[category]    # 카테고리별
│   └── /stats                  # 통계 대시보드
├── /blog/                      # 블로그 (업데이트 소식)
└── /community/                 # 커뮤니티
    ├── /discord
    ├── /github
    └── /contributing
```

## 프로젝트 구조

```
website/
├── package.json
├── docusaurus.config.js
├── sidebars.js
├── static/
│   ├── img/
│   └── modules/              # 모듈 아이콘/스크린샷
├── docs/                     # 문서 (Markdown)
│   ├── getting-started.md
│   ├── user-guide/
│   ├── developer/
│   └── deployment/
├── blog/                     # 블로그 포스트
│   ├── 2025-01-20-release.md
│   └── authors.yml
├── src/
│   ├── pages/               # 커스텀 페이지
│   │   ├── index.tsx        # 홈페이지
│   │   ├── marketplace/
│   │   │   ├── index.tsx    # 마켓플레이스 메인
│   │   │   ├── [id].tsx     # 모듈 상세
│   │   │   └── stats.tsx    # 통계
│   │   └── community.tsx
│   ├── components/          # React 컴포넌트
│   │   ├── ModuleCard.tsx
│   │   ├── ModuleList.tsx
│   │   ├── SearchBar.tsx
│   │   └── StatsChart.tsx
│   └── css/
│       └── custom.css
└── README.md
```

## docusaurus.config.js

Docusaurus 설정 파일입니다. 사이트의 제목은 'Fieldstack', 태그라인은 개인용 모듈형 금융 및 생산성 시스템으로 설정합니다. URL과 기본 경로를 정의합니다.

themeConfig에서 네비게이션 바를 설정합니다. 왼쪽에는 문서와 마켓플레이스, 블로그 링크를 배치하고, 오른쪽에는 GitHub 링크를 배치합니다.

푸터는 세 컬럼으로 구성됩니다. 첫 번째 컬럼 '문서'에는 시작하기, 사용자 가이드, 개발자 가이드 링크가 있습니다. 두 번째 컬럼 '커뮤니티'에는 Discord, GitHub Discussions, Twitter 링크가 있습니다. 세 번째 컬럼 '더보기'에는 블로그, 마켓플레이스, GitHub 링크가 있습니다.

Algolia 검색을 연동하여 앱 ID, 검색 API 키, 인덱스명을 설정합니다.

다크모드는 기본값으로 라이트 모드를 사용하며, 사용자의 운영체제 환경 변수(prefers-color-scheme)를 존중합니다.

presets에서 docs, blog, theme를 설정합니다. docs는 sidebars.js를 사용하고 GitHub에서 편집할 수 있도록 editUrl을 지정합니다. blog도 마찬가지로 읽기 시간 표시와 editUrl을 설정합니다.

## 홈페이지

Docusaurus의 Layout과 Link 컴포넌트를 사용하여 홈페이지를 구성합니다.

상단 hero 섹션에는 'Fieldstack' 제목과 '완전 무료, Self-hosted, 모듈형 개인 금융 관리 시스템' 소개문을 표시합니다. 아래에는 '시작하기' 버튼(문서 페이지로 이동)과 '마켓플레이스 둘러보기' 버튼이 배치됩니다.

main 영역은 두 섹션으로 구성됩니다. 첫 번째 'features' 섹션에는 Feature 컴포넌트를 3개 배치합니다: '완전 무료'(기능 제한 없음), '개인정보 보호'(Self-hosted, 모든 데이터는 본인 서버에), '모듈 시스템'(필요한 기능만 설치, 커뮤니티 모듈 지원). 두 번째 'showcase' 섹션에는 주요 모듈을 ModuleShowcase 컴포넌트로 표시합니다.

## 마켓플레이스 페이지

Docusaurus의 Layout 안에 마켓플레이스 콘텐츠를 구성합니다.

컴포넌트가 마운트되면 GitHub의 module-registry 저장소에서 modules.json을 가져와 모듈 목록을 상태로 저장합니다.

모듈 목록은 카테고리와 검색 키워드로 필터링됩니다. 카테고리가 'all'이 아니면 해당 카테고리의 모듈만 표시하고, 검색 키워드가 있으면 모듈명이나 설명에 키워드가 포함된 것만 표시합니다.

페이지 상단에는 제목과 전체 모듈 수를 표시합니다. SearchBar 컴포넌트에서 검색 키워드를 입력할 수 있고, 그 아래에는 카테고리 탭(전체, 금융, 생산성, 유틸리티)이 있습니다. 현재 선택된 카테고리 탭에 'active' 클래스가 추가됩니다. 필터링된 모듈 목록은 module-grid 안에 ModuleCard 컴포넌트로 하나씩 렌더링됩니다.

## 모듈 상세 페이지

모듈 상세 페이지입니다. URL의 파라미터에서 모듈 ID를 추출하고, 컴포넌트가 마운트되면 해당 모듈의 상세 JSON을 GitHub에서 가져옵니다. 데이터가 로드되지 않은 중에는 'Loading...'을 표시합니다.

데이터가 로드되면 페이지를 여러 섹션으로 구성합니다. 상단 header에는 모듈 아이콘, 모듈명, 개발자명, 설치 버튼과 즐겨찾기 버튼이 표시됩니다. 그 아래에는 다운로드 수, 평점과 리뷰 수, 버전이 stat 카드로 표시됩니다.

본문은 총 5개 섹션으로 나뉩니다. 스크린샷 섹션에는 모듈의 스크린샷 이미지를 갤러리로 표시합니다. 설명 섹션에는 longDescription을 HTML로 렌더링합니다. 주요 기능 섹션에는 features 목록을 리스트로 표시합니다. 요구사항 섹션에는 최소 Core 버전과 필요한 권한을 표시합니다. 변경 사항 섹션에는 changelog를 버전별로 루프를 돌며 표시합니다.

## 통계 대시보드

통계 대시보드 페이지입니다. 컴포넌트가 마운트되면 GitHub의 downloads.json을 가져와 상태로 저장합니다. 데이터가 로드되지 않은 중에는 'Loading...'을 표시합니다.

데이터가 로드되면 상단에 두 개의 요약 카드를 표시합니다: 총 다운로드 횟수와 전체 모듈 수. 그 아래로 세 섹션이 구성됩니다. 첫 번째로 인기 모듈 Top 10을 TopModulesChart 컴포넌트로 차트로 표시합니다. 두 번째로 카테고리별 분포를 CategoryPieChart 컴포넌트로 파이 차트로 표시합니다. 세 번째로 월별 다운로드 추이를 DownloadsTrendChart 컴포넌트로 라인 차트로 표시합니다.

## 배포

### Cloudflare Pages 배포

```yaml
# .github/workflows/deploy-website.yml

name: Deploy Website

on:
  push:
    branches: [main]
    paths:
      - 'website/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: |
          cd website
          npm install
      
      - name: Build
        run: |
          cd website
          npm run build
      
      - name: Deploy to Cloudflare Pages
        uses: cloudflare/pages-action@v1
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          projectName: finance-system
          directory: website/build
```

### 커스텀 도메인 설정

Cloudflare Pages 대시보드에서:
1. Custom domains 설정
2. DNS 레코드 추가
3. SSL/TLS 자동 설정

## SEO 최적화

Docusaurus 설정 파일에 SEO 관련 옵션을 추가합니다. metadata에는 키워드(가계부, 금융관리, self-hosted, 오픈소스)와 설명(완전 무료 개인용 금융 관리 시스템)을 정의합니다. headTags에는 canonical URL을 link 태그로 추가하여 중복 콘텐츠 문제를 방지합니다.