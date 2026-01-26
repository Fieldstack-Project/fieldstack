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