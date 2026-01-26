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
https://your-finance-system.dev/
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

```javascript
module.exports = {
  title: 'Finance System',
  tagline: '개인용 모듈형 금융 & 생산성 시스템',
  url: 'https://your-finance-system.dev',
  baseUrl: '/',
  
  organizationName: 'your-org',
  projectName: 'finance-system',
  
  themeConfig: {
    navbar: {
      title: 'Finance System',
      logo: {
        alt: 'Logo',
        src: 'img/logo.svg',
      },
      items: [
        {
          type: 'doc',
          docId: 'intro',
          position: 'left',
          label: '문서',
        },
        {
          to: '/marketplace',
          label: '마켓플레이스',
          position: 'left',
        },
        {
          to: '/blog',
          label: '블로그',
          position: 'left',
        },
        {
          href: 'https://github.com/your-org/finance-system',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    
    footer: {
      style: 'dark',
      links: [
        {
          title: '문서',
          items: [
            { label: '시작하기', to: '/docs/intro' },
            { label: '사용자 가이드', to: '/docs/user-guide' },
            { label: '개발자 가이드', to: '/docs/developer' },
          ],
        },
        {
          title: '커뮤니티',
          items: [
            { label: 'Discord', href: 'https://discord.gg/...' },
            { label: 'GitHub Discussions', href: 'https://github.com/...' },
            { label: 'Twitter', href: 'https://twitter.com/...' },
          ],
        },
        {
          title: '더보기',
          items: [
            { label: '블로그', to: '/blog' },
            { label: '마켓플레이스', to: '/marketplace' },
            { label: 'GitHub', href: 'https://github.com/...' },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Finance System. MIT License.`,
    },
    
    // Algolia 검색
    algolia: {
      appId: 'YOUR_APP_ID',
      apiKey: 'YOUR_SEARCH_API_KEY',
      indexName: 'finance-system',
    },
    
    // 다크모드
    colorMode: {
      defaultMode: 'light',
      respectPrefersColorScheme: true,
    },
  },
  
  presets: [
    [
      '@docusaurus/preset-classic',
      {
        docs: {
          sidebarPath: require.resolve('./sidebars.js'),
          editUrl: 'https://github.com/your-org/finance-system/edit/main/website/',
        },
        blog: {
          showReadingTime: true,
          editUrl: 'https://github.com/your-org/finance-system/edit/main/website/blog/',
        },
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
      },
    ],
  ],
};
```

## 홈페이지

```tsx
// src/pages/index.tsx

import React from 'react';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

export default function Home() {
  const {siteConfig} = useDocusaurusContext();
  
  return (
    <Layout
      title={siteConfig.title}
      description="개인용 모듈형 금융 & 생산성 시스템"
    >
      <header className="hero hero--primary">
        <div className="container">
          <h1 className="hero__title">
            🏦 Finance System
          </h1>
          <p className="hero__subtitle">
            완전 무료, Self-hosted, 모듈형 개인 금융 관리 시스템
          </p>
          <div className="buttons">
            <Link
              className="button button--secondary button--lg"
              to="/docs/intro"
            >
              시작하기 →
            </Link>
            <Link
              className="button button--outline button--lg"
              to="/marketplace"
            >
              마켓플레이스 둘러보기
            </Link>
          </div>
        </div>
      </header>
      
      <main>
        <section className="features">
          <div className="container">
            <div className="row">
              <Feature
                icon="💰"
                title="완전 무료"
                description="기능 제한 없음. 프리미엄도 없음. 영원히 무료."
              />
              <Feature
                icon="🔒"
                title="개인정보 보호"
                description="Self-hosted. 모든 데이터는 당신의 서버에."
              />
              <Feature
                icon="🧩"
                title="모듈 시스템"
                description="필요한 기능만 설치. 커뮤니티 모듈 지원."
              />
            </div>
          </div>
        </section>
        
        <section className="showcase">
          <div className="container">
            <h2>주요 모듈</h2>
            <ModuleShowcase />
          </div>
        </section>
      </main>
    </Layout>
  );
}
```

## 마켓플레이스 페이지

```tsx
// src/pages/marketplace/index.tsx

import React, { useState, useEffect } from 'react';
import Layout from '@theme/Layout';
import { ModuleCard } from '@site/src/components/ModuleCard';
import { SearchBar } from '@site/src/components/SearchBar';

export default function Marketplace() {
  const [modules, setModules] = useState([]);
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  
  useEffect(() => {
    // 레지스트리에서 모듈 목록 가져오기
    fetch('https://raw.githubusercontent.com/your-org/module-registry/main/modules.json')
      .then(res => res.json())
      .then(data => setModules(data.modules));
  }, []);
  
  const filteredModules = modules
    .filter(m => category === 'all' || m.category === category)
    .filter(m => 
      search === '' || 
      m.displayName.toLowerCase().includes(search.toLowerCase()) ||
      m.description.toLowerCase().includes(search.toLowerCase())
    );
  
  return (
    <Layout title="마켓플레이스">
      <div className="container margin-vert--lg">
        <h1>🏪 마켓플레이스</h1>
        <p className="margin-bottom--lg">
          총 {modules.length}개의 모듈 | 
          커뮤니티 제작 모듈을 탐색하고 설치하세요
        </p>
        
        <SearchBar 
          value={search}
          onChange={setSearch}
          placeholder="모듈 검색..."
        />
        
        <div className="category-tabs margin-vert--md">
          <button 
            className={category === 'all' ? 'active' : ''}
            onClick={() => setCategory('all')}
          >
            전체
          </button>
          <button 
            className={category === 'finance' ? 'active' : ''}
            onClick={() => setCategory('finance')}
          >
            💰 금융
          </button>
          <button 
            className={category === 'productivity' ? 'active' : ''}
            onClick={() => setCategory('productivity')}
          >
            📊 생산성
          </button>
          <button 
            className={category === 'utility' ? 'active' : ''}
            onClick={() => setCategory('utility')}
          >
            🔧 유틸리티
          </button>
        </div>
        
        <div className="module-grid">
          {filteredModules.map(module => (
            <ModuleCard key={module.id} module={module} />
          ))}
        </div>
      </div>
    </Layout>
  );
}
```

## 모듈 상세 페이지

```tsx
// src/pages/marketplace/[id].tsx

import React, { useState, useEffect } from 'react';
import Layout from '@theme/Layout';
import { useParams } from '@docusaurus/router';

export default function ModuleDetail() {
  const { id } = useParams();
  const [module, setModule] = useState(null);
  
  useEffect(() => {
    fetch(`https://raw.githubusercontent.com/your-org/module-registry/main/modules/${id}.json`)
      .then(res => res.json())
      .then(data => setModule(data));
  }, [id]);
  
  if (!module) return <div>Loading...</div>;
  
  return (
    <Layout title={module.displayName}>
      <div className="container margin-vert--lg">
        <div className="module-header">
          <span className="module-icon">{module.icon}</span>
          <div>
            <h1>{module.displayName}</h1>
            <p className="module-author">by {module.author.name}</p>
          </div>
          <div className="module-actions">
            <button className="button button--primary button--lg">
              📥 설치
            </button>
            <button className="button button--outline">
              ⭐ 즐겨찾기
            </button>
          </div>
        </div>
        
        <div className="module-stats">
          <div className="stat">
            <span className="stat-label">다운로드</span>
            <span className="stat-value">{module.stats.downloads}</span>
          </div>
          <div className="stat">
            <span className="stat-label">평점</span>
            <span className="stat-value">
              ⭐ {module.stats.rating} ({module.stats.reviewCount})
            </span>
          </div>
          <div className="stat">
            <span className="stat-label">버전</span>
            <span className="stat-value">v{module.version}</span>
          </div>
        </div>
        
        <div className="module-content">
          <section>
            <h2>📸 스크린샷</h2>
            <div className="screenshot-gallery">
              {module.screenshots.map((screenshot, i) => (
                <img 
                  key={i}
                  src={screenshot.url}
                  alt={screenshot.title}
                />
              ))}
            </div>
          </section>
          
          <section>
            <h2>📝 설명</h2>
            <div dangerouslySetInnerHTML={{ __html: module.longDescription }} />
          </section>
          
          <section>
            <h2>✨ 주요 기능</h2>
            <ul>
              {module.features.map((feature, i) => (
                <li key={i}>{feature}</li>
              ))}
            </ul>
          </section>
          
          <section>
            <h2>📋 요구사항</h2>
            <ul>
              <li>Core Version: {module.requirements.minCoreVersion}+</li>
              <li>권한: {module.requirements.permissions.join(', ')}</li>
            </ul>
          </section>
          
          <section>
            <h2>📈 변경 사항</h2>
            {module.changelog.map((log, i) => (
              <div key={i} className="changelog-item">
                <h3>v{log.version} - {log.date}</h3>
                <ul>
                  {log.changes.map((change, j) => (
                    <li key={j}>{change}</li>
                  ))}
                </ul>
              </div>
            ))}
          </section>
        </div>
      </div>
    </Layout>
  );
}
```

## 통계 대시보드

```tsx
// src/pages/marketplace/stats.tsx

import React, { useState, useEffect } from 'react';
import Layout from '@theme/Layout';
import { LineChart, PieChart } from '@site/src/components/Charts';

export default function Stats() {
  const [stats, setStats] = useState(null);
  
  useEffect(() => {
    fetch('https://raw.githubusercontent.com/your-org/module-registry/main/stats/downloads.json')
      .then(res => res.json())
      .then(data => setStats(data));
  }, []);
  
  if (!stats) return <div>Loading...</div>;
  
  return (
    <Layout title="통계">
      <div className="container margin-vert--lg">
        <h1>📊 마켓플레이스 통계</h1>
        
        <div className="stats-grid">
          <div className="stat-card">
            <h3>총 다운로드</h3>
            <div className="big-number">{stats.total.toLocaleString()}</div>
          </div>
          <div className="stat-card">
            <h3>전체 모듈</h3>
            <div className="big-number">{Object.keys(stats.modules).length}</div>
          </div>
        </div>
        
        <section>
          <h2>📈 인기 모듈 Top 10</h2>
          <TopModulesChart data={stats.modules} />
        </section>
        
        <section>
          <h2>📊 카테고리별 분포</h2>
          <CategoryPieChart data={stats.modules} />
        </section>
        
        <section>
          <h2>📅 월별 다운로드 추이</h2>
          <DownloadsTrendChart data={stats} />
        </section>
      </div>
    </Layout>
  );
}
```

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

```javascript
// docusaurus.config.js

module.exports = {
  // ...
  
  metadata: [
    {name: 'keywords', content: '가계부, 금융관리, self-hosted, 오픈소스'},
    {name: 'description', content: '완전 무료 개인용 금융 관리 시스템'},
  ],
  
  headTags: [
    {
      tagName: 'link',
      attributes: {
        rel: 'canonical',
        href: 'https://your-finance-system.dev',
      },
    },
  ],
};
```