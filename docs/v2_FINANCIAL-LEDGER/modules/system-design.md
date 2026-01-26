# UI 정책 및 디자인 시스템

## 설계 원칙

### 1. 완전한 분리

UI는 Core/Module 로직과 완전 분리되어야 합니다:

```
❌ 잘못된 예:
modules/ledger/backend/service.ts에 UI 로직 포함

✅ 올바른 예:
modules/ledger/frontend/ - UI 코드
modules/ledger/backend/  - 비즈니스 로직
```

### 2. Core UI 우선

모듈은 Core에서 제공하는 UI 컴포넌트를 최대한 활용하여 일관된 디자인 유지:

```typescript
// 권장
import { Button, Card, Table } from '@core/ui';

// 피해야 할 방식
import { Button } from 'some-external-library';
```

### 3. 자유로운 교체

사용자는 원한다면 전체 UI를 자유롭게 교체 가능:

```
apps/web/
├── src/
│   └── custom-ui/     # 사용자 정의 UI
│       ├── Button.tsx
│       └── Card.tsx
```

## 디자인 토큰

### 색상 팔레트

```typescript
export const colors = {
  // Primary
  primary: {
    50: '#EFF6FF',
    100: '#DBEAFE',
    500: '#3B82F6',   // 메인 색상
    600: '#2563EB',
    900: '#1E3A8A'
  },
  
  // Semantic
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  info: '#3B82F6',
  
  // Grayscale
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    500: '#6B7280',
    900: '#111827'
  }
};
```

### 타이포그래피

```typescript
export const typography = {
  fontFamily: {
    sans: 'Inter, -apple-system, sans-serif',
    mono: 'JetBrains Mono, monospace'
  },
  
  fontSize: {
    xs: '0.75rem',    // 12px
    sm: '0.875rem',   // 14px
    base: '1rem',     // 16px
    lg: '1.125rem',   // 18px
    xl: '1.25rem',    // 20px
    '2xl': '1.5rem',  // 24px
    '3xl': '1.875rem' // 30px
  },
  
  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700
  }
};
```

### 간격 (Spacing)

```typescript
export const spacing = {
  0: '0',
  1: '0.25rem',   // 4px
  2: '0.5rem',    // 8px
  3: '0.75rem',   // 12px
  4: '1rem',      // 16px
  6: '1.5rem',    // 24px
  8: '2rem',      // 32px
  12: '3rem',     // 48px
  16: '4rem'      // 64px
};
```

### 반경 (Border Radius)

```typescript
export const borderRadius = {
  none: '0',
  sm: '0.125rem',   // 2px
  md: '0.375rem',   // 6px
  lg: '0.5rem',     // 8px
  xl: '0.75rem',    // 12px
  full: '9999px'
};
```

## 반응형 디자인

### 브레이크포인트

```typescript
export const breakpoints = {
  sm: '640px',   // Mobile
  md: '768px',   // Tablet
  lg: '1024px',  // Desktop
  xl: '1280px',  // Large Desktop
  '2xl': '1536px'
};
```

### 반응형 사용 예시

```typescript
<div className="
  w-full 
  sm:w-1/2 
  lg:w-1/3
  p-4
  sm:p-6
  lg:p-8
">
  {content}
</div>
```

## 다크모드 지원

### 자동 전환

```typescript
// packages/core/ui/theme.ts
export const darkMode = {
  enabled: true,
  strategy: 'class', // 또는 'media'
  
  colors: {
    background: {
      light: '#FFFFFF',
      dark: '#111827'
    },
    text: {
      light: '#111827',
      dark: '#F9FAFB'
    }
  }
};
```

### 사용 예시

```typescript
<div className="
  bg-white dark:bg-gray-900
  text-gray-900 dark:text-gray-100
">
  {content}
</div>
```

## 접근성 (Accessibility)

### 필수 요구사항

1. **키보드 네비게이션**
   - 모든 인터랙티브 요소는 Tab 키로 접근 가능
   - Focus 상태 명확하게 표시

2. **ARIA 속성**
   ```typescript
   <button
     aria-label="메뉴 열기"
     aria-expanded={isOpen}
     aria-controls="menu"
   >
     메뉴
   </button>
   ```

3. **색상 대비**
   - WCAG AA 기준 준수 (최소 4.5:1)
   - 텍스트와 배경의 충분한 대비

4. **스크린 리더 지원**
   - 시맨틱 HTML 사용
   - alt 텍스트 제공

## 아이콘 시스템

### Lucide React 사용

```typescript
import { Home, Settings, User, ChevronRight } from 'lucide-react';

<Button>
  <Home size={16} />
  홈
</Button>
```

### 아이콘 크기

```typescript
export const iconSizes = {
  xs: 12,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32
};
```

## 애니메이션

### 기본 트랜지션

```typescript
export const transitions = {
  fast: '150ms ease-in-out',
  base: '200ms ease-in-out',
  slow: '300ms ease-in-out'
};
```

### 사용 예시

```css
.button {
  transition: all 200ms ease-in-out;
}

.button:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}
```

## 레이아웃 그리드

### 12컬럼 그리드 시스템

```typescript
<div className="grid grid-cols-12 gap-4">
  <div className="col-span-12 md:col-span-8">
    메인 콘텐츠
  </div>
  <div className="col-span-12 md:col-span-4">
    사이드바
  </div>
</div>
```

## 컴포넌트 변형 (Variants)

### Button 변형

```typescript
const buttonVariants = {
  primary: 'bg-blue-500 text-white hover:bg-blue-600',
  secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300',
  danger: 'bg-red-500 text-white hover:bg-red-600',
  ghost: 'bg-transparent hover:bg-gray-100'
};

const buttonSizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg'
};
```

## UI 교체 가이드

사용자가 전체 UI를 교체하고 싶다면:

### 1. 커스텀 UI 생성

```typescript
// apps/web/src/custom-ui/Button.tsx
export function Button({ children, ...props }) {
  // 완전히 새로운 디자인
  return (
    <button className="my-custom-button" {...props}>
      {children}
    </button>
  );
}
```

### 2. Import 경로 변경

```typescript
// 기존
import { Button } from '@core/ui';

// 변경 후
import { Button } from '@/custom-ui';
```

### 3. 전역 교체

```typescript
// apps/web/vite.config.ts
export default {
  resolve: {
    alias: {
      '@core/ui': '/src/custom-ui'
    }
  }
};
```

## 모범 사례

### ✅ 해야 할 것

- Core UI 컴포넌트 최대한 활용
- 일관된 spacing 사용
- 시맨틱 HTML 사용
- 접근성 고려
- 반응형 디자인 적용
- 다크모드 지원

### ❌ 하지 말아야 할 것

- 인라인 스타일 남용
- 하드코딩된 색상 값
- 접근성 무시
- 일관성 없는 spacing
- 불필요한 애니메이션

## 스타일링 방법

### Tailwind CSS 사용 (권장)

```typescript
<div className="flex items-center gap-4 p-6 bg-white rounded-lg shadow">
  <Avatar src={user.avatar} />
  <div className="flex-1">
    <h3 className="text-lg font-semibold">{user.name}</h3>
    <p className="text-gray-600">{user.email}</p>
  </div>
</div>
```

### CSS Modules (선택)

```typescript
import styles from './Card.module.css';

<div className={styles.card}>
  {content}
</div>
```

## 성능 최적화

### 1. 컴포넌트 메모이제이션

```typescript
import { memo } from 'react';

export const ExpensiveComponent = memo(({ data }) => {
  // 무거운 렌더링 로직
  return <div>{data}</div>;
});
```

### 2. 이미지 최적화

```typescript
<img
  src={image}
  loading="lazy"
  alt="설명"
  width={300}
  height={200}
/>
```

### 3. 코드 스플리팅

```typescript
import { lazy, Suspense } from 'react';

const HeavyComponent = lazy(() => import('./HeavyComponent'));

<Suspense fallback={<Loading />}>
  <HeavyComponent />
</Suspense>
```