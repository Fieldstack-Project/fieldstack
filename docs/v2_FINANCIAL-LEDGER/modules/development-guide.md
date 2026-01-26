# 모듈 개발 가이드

## 시작하기

### 1. 모듈 템플릿 복사

```bash
cp -r modules/example modules/my-module
cd modules/my-module
```

### 2. module.json 수정

```json
{
  "name": "my-module",
  "version": "1.0.0",
  "displayName": "내 모듈",
  "description": "모듈 설명",
  "icon": "🎯",
  "routes": {
    "frontend": "/my-module",
    "api": "/api/my-module"
  },
  "permissions": ["db:read", "db:write"],
  "dependencies": [],
  "enabled": true
}
```

## 프로젝트 구조

```
modules/my-module/
├── module.json
├── README.md
├── frontend/
│   ├── index.tsx          # 메인 export
│   ├── pages/
│   │   ├── List.tsx
│   │   ├── Detail.tsx
│   │   └── Create.tsx
│   ├── components/
│   │   └── MyComponent.tsx
│   └── hooks/
│       └── useMyModule.ts
├── backend/
│   ├── index.ts           # 메인 export
│   ├── routes.ts
│   ├── service.ts
│   ├── schema.ts
│   ├── validation.ts
│   └── migrations/
│       └── 001_initial.sql
└── types/
    └── index.ts
```

## Backend 개발

### routes.ts

```typescript
// modules/my-module/backend/routes.ts

import { Router } from 'express';
import * as service from './service';
import { validateCreate, validateUpdate } from './validation';

const router = Router();

// 목록 조회
router.get('/', async (req, res) => {
  try {
    const items = await service.list(req.user.id);
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 상세 조회
router.get('/:id', async (req, res) => {
  try {
    const item = await service.getById(req.params.id, req.user.id);
    if (!item) {
      return res.status(404).json({ error: 'Not found' });
    }
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 생성
router.post('/', validateCreate, async (req, res) => {
  try {
    const item = await service.create(req.body, req.user.id);
    res.status(201).json(item);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 수정
router.put('/:id', validateUpdate, async (req, res) => {
  try {
    const item = await service.update(req.params.id, req.body, req.user.id);
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 삭제
router.delete('/:id', async (req, res) => {
  try {
    await service.remove(req.params.id, req.user.id);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
```

### service.ts

```typescript
// modules/my-module/backend/service.ts

import { db } from '@core/db';
import { eventBus } from '@core/events';

export async function list(userId: string) {
  return await db.query(
    'SELECT * FROM my_module_items WHERE user_id = ? ORDER BY created_at DESC',
    [userId]
  );
}

export async function getById(id: string, userId: string) {
  const results = await db.query(
    'SELECT * FROM my_module_items WHERE id = ? AND user_id = ?',
    [id, userId]
  );
  return results[0];
}

export async function create(data: any, userId: string) {
  const item = {
    id: generateId(),
    ...data,
    user_id: userId,
    created_at: new Date(),
    updated_at: new Date()
  };
  
  await db.query(
    'INSERT INTO my_module_items VALUES (?)',
    [item]
  );
  
  // 이벤트 발행
  eventBus.emit('my-module:created', item);
  
  return item;
}

export async function update(id: string, data: any, userId: string) {
  const item = await getById(id, userId);
  if (!item) {
    throw new Error('Not found');
  }
  
  const updated = {
    ...item,
    ...data,
    updated_at: new Date()
  };
  
  await db.query(
    'UPDATE my_module_items SET ? WHERE id = ? AND user_id = ?',
    [updated, id, userId]
  );
  
  eventBus.emit('my-module:updated', updated);
  
  return updated;
}

export async function remove(id: string, userId: string) {
  const item = await getById(id, userId);
  if (!item) {
    throw new Error('Not found');
  }
  
  await db.query(
    'DELETE FROM my_module_items WHERE id = ? AND user_id = ?',
    [id, userId]
  );
  
  eventBus.emit('my-module:deleted', { id, userId });
}
```

### validation.ts

```typescript
// modules/my-module/backend/validation.ts

import { z } from 'zod';

const createSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  amount: z.number().positive()
});

const updateSchema = createSchema.partial();

export function validateCreate(req, res, next) {
  try {
    createSchema.parse(req.body);
    next();
  } catch (error) {
    res.status(400).json({ error: error.errors });
  }
}

export function validateUpdate(req, res, next) {
  try {
    updateSchema.parse(req.body);
    next();
  } catch (error) {
    res.status(400).json({ error: error.errors });
  }
}
```

### schema.ts

```typescript
// modules/my-module/backend/schema.ts

export const schema = {
  tableName: 'my_module_items',
  columns: {
    id: { type: 'uuid', primaryKey: true },
    user_id: { type: 'uuid', nullable: false },
    name: { type: 'string', maxLength: 100 },
    description: { type: 'text', nullable: true },
    amount: { type: 'decimal', precision: 10, scale: 2 },
    created_at: { type: 'timestamp', default: 'now()' },
    updated_at: { type: 'timestamp', default: 'now()' }
  },
  indexes: [
    { columns: ['user_id'] },
    { columns: ['created_at'] }
  ]
};
```

### index.ts (Backend Entry)

```typescript
// modules/my-module/backend/index.ts

import routes from './routes';
import { scheduler } from '@core/scheduler';
import { eventBus } from '@core/events';

export default routes;

export async function initialize() {
  console.log('Initializing my-module...');
  
  // DB 마이그레이션
  await runMigrations();
  
  // Scheduler 작업 등록
  scheduler.register({
    name: 'my-module-daily-task',
    schedule: '0 0 * * *',
    handler: async () => {
      // 일일 작업
    }
  });
  
  // Event listener 등록
  eventBus.on('user:created', handleNewUser);
}

export async function shutdown() {
  console.log('Shutting down my-module...');
  eventBus.off('user:created', handleNewUser);
}

async function handleNewUser(user: any) {
  // 새 사용자 처리
}

async function runMigrations() {
  // 마이그레이션 실행
}
```

## Frontend 개발

### index.tsx (Frontend Entry)

```typescript
// modules/my-module/frontend/index.tsx

import { Routes, Route } from 'react-router-dom';
import List from './pages/List';
import Detail from './pages/Detail';
import Create from './pages/Create';

export default function MyModule() {
  return (
    <Routes>
      <Route path="/" element={<List />} />
      <Route path="/:id" element={<Detail />} />
      <Route path="/create" element={<Create />} />
    </Routes>
  );
}

// 네비게이션 메뉴 정보
export const navigation = {
  label: '내 모듈',
  icon: '🎯',
  path: '/my-module'
};
```

### pages/List.tsx

```typescript
// modules/my-module/frontend/pages/List.tsx

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageLayout, DataTable, Button } from '@core/ui';
import { useMyModule } from '../hooks/useMyModule';

export default function List() {
  const navigate = useNavigate();
  const { items, loading, deleteItem } = useMyModule();
  
  const columns = [
    { key: 'name', label: '이름', sortable: true },
    { key: 'description', label: '설명' },
    { key: 'amount', label: '금액', format: 'currency' },
    {
      key: 'actions',
      label: '작업',
      render: (item) => (
        <Button
          variant="danger"
          size="sm"
          onClick={() => handleDelete(item.id)}
        >
          삭제
        </Button>
      )
    }
  ];
  
  const handleDelete = async (id: string) => {
    if (confirm('정말 삭제하시겠습니까?')) {
      await deleteItem(id);
    }
  };
  
  return (
    <PageLayout
      title="내 모듈"
      actions={
        <Button
          variant="primary"
          onClick={() => navigate('/my-module/create')}
        >
          + 추가
        </Button>
      }
    >
      <DataTable
        columns={columns}
        data={items}
        loading={loading}
        searchable
        sortable
        pagination
        onRowClick={(item) => navigate(`/my-module/${item.id}`)}
      />
    </PageLayout>
  );
}
```

### pages/Create.tsx

```typescript
// modules/my-module/frontend/pages/Create.tsx

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FormLayout, Input, useNotification } from '@core/ui';
import { useMyModule } from '../hooks/useMyModule';

export default function Create() {
  const navigate = useNavigate();
  const notify = useNotification();
  const { createItem } = useMyModule();
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    amount: 0
  });
  
  const handleSubmit = async () => {
    try {
      await createItem(formData);
      notify.success('생성되었습니다');
      navigate('/my-module');
    } catch (error) {
      notify.error('생성에 실패했습니다');
    }
  };
  
  return (
    <FormLayout
      title="새 항목 추가"
      onSubmit={handleSubmit}
      onCancel={() => navigate('/my-module')}
    >
      <Input
        label="이름"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        required
      />
      <Input
        label="설명"
        value={formData.description}
        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
      />
      <Input
        label="금액"
        type="number"
        value={formData.amount}
        onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
        required
      />
    </FormLayout>
  );
}
```

### hooks/useMyModule.ts

```typescript
// modules/my-module/frontend/hooks/useMyModule.ts

import { useState, useEffect } from 'react';
import { api } from '@core/api';

export function useMyModule() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchItems();
  }, []);
  
  const fetchItems = async () => {
    setLoading(true);
    try {
      const data = await api.get('/api/my-module');
      setItems(data);
    } finally {
      setLoading(false);
    }
  };
  
  const createItem = async (data: any) => {
    const newItem = await api.post('/api/my-module', data);
    setItems([...items, newItem]);
    return newItem;
  };
  
  const updateItem = async (id: string, data: any) => {
    const updated = await api.put(`/api/my-module/${id}`, data);
    setItems(items.map(item => item.id === id ? updated : item));
    return updated;
  };
  
  const deleteItem = async (id: string) => {
    await api.delete(`/api/my-module/${id}`);
    setItems(items.filter(item => item.id !== id));
  };
  
  return {
    items,
    loading,
    createItem,
    updateItem,
    deleteItem,
    refresh: fetchItems
  };
}
```

## 타입 정의

```typescript
// modules/my-module/types/index.ts

export interface MyModuleItem {
  id: string;
  userId: string;
  name: string;
  description?: string;
  amount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateMyModuleItemDto {
  name: string;
  description?: string;
  amount: number;
}

export interface UpdateMyModuleItemDto extends Partial<CreateMyModuleItemDto> {}
```

## 테스트

### Backend 테스트

```typescript
// modules/my-module/backend/__tests__/service.test.ts

import { describe, it, expect, beforeEach } from 'vitest';
import * as service from '../service';

describe('MyModule Service', () => {
  beforeEach(async () => {
    // 테스트 DB 초기화
  });
  
  it('should create item', async () => {
    const data = {
      name: 'Test',
      amount: 1000
    };
    
    const item = await service.create(data, 'user-123');
    
    expect(item.name).toBe('Test');
    expect(item.amount).toBe(1000);
  });
  
  it('should list items', async () => {
    const items = await service.list('user-123');
    expect(Array.isArray(items)).toBe(true);
  });
});
```

### Frontend 테스트

```typescript
// modules/my-module/frontend/__tests__/List.test.tsx

import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import List from '../pages/List';

describe('List Page', () => {
  it('should render title', () => {
    render(<List />);
    expect(screen.getByText('내 모듈')).toBeInTheDocument();
  });
});
```

## 배포

### 1. GitHub에 업로드

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/username/my-module
git push -u origin main
```

### 2. README 작성

```markdown
# My Module

모듈 설명

## 설치

\`\`\`bash
git clone https://github.com/username/my-module modules/my-module
\`\`\`

## 사용법

...
```

### 3. 공식 레지스트리에 등록

module-registry 저장소에 PR 제출

## 모범 사례

### ✅ 해야 할 것

- Core UI 컴포넌트 사용
- 타입 정의 명확하게
- 에러 처리 철저하게
- 사용자 데이터만 접근
- Event Bus로 모듈 간 통신
- 테스트 작성

### ❌ 하지 말아야 할 것

- 다른 모듈 직접 import
- 전역 상태 오염
- 하드코딩된 값
- 다른 모듈의 DB 테이블 접근
- 민감한 정보 로그 출력