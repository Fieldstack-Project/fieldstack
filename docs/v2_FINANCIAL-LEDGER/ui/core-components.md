# Core UI Component Library

## 개요

모듈 개발자가 UI/UX를 처음부터 만들 필요 없이, Core에서 제공하는 컴포넌트를 사용하여 빠르고 일관된 인터페이스를 구축할 수 있도록 지원합니다.

## 장점

- ✅ 통일된 디자인 시스템
- ✅ 즉시 사용 가능한 컴포넌트
- ✅ 반응형 자동 처리
- ✅ 다크모드 자동 지원
- ✅ 접근성 자동 처리

## Core UI 구성

```
packages/core/ui/
├── components/          # 기본 컴포넌트
│   ├── Button.tsx
│   ├── Input.tsx
│   ├── Select.tsx
│   ├── Modal.tsx
│   ├── Table.tsx
│   ├── Card.tsx
│   ├── Tabs.tsx
│   ├── Form.tsx
│   ├── DatePicker.tsx
│   └── Dropdown.tsx
│
├── layouts/            # 레이아웃 컴포넌트
│   ├── PageLayout.tsx   # 표준 페이지
│   ├── FormLayout.tsx   # 폼 페이지
│   └── ListLayout.tsx   # 리스트 페이지
│
├── hooks/              # 공통 Hooks
│   ├── useForm.ts
│   ├── useModal.ts
│   ├── useTable.ts
│   └── useNotification.ts
│
└── index.ts
```

## 기본 컴포넌트

### Button

```typescript
import { Button } from '@core/ui';

<Button variant="primary" onClick={handleClick}>
  저장
</Button>

<Button variant="secondary" size="sm">
  취소
</Button>

<Button variant="danger" loading={isLoading}>
  삭제
</Button>
```

**Props:**
- `variant`: 'primary' | 'secondary' | 'danger' | 'ghost'
- `size`: 'sm' | 'md' | 'lg'
- `loading`: boolean
- `disabled`: boolean

### Input

```typescript
import { Input } from '@core/ui';

<Input
  label="이메일"
  type="email"
  placeholder="example@email.com"
  value={email}
  onChange={setEmail}
  error={errors.email}
  required
/>
```

**Props:**
- `label`: string
- `type`: 'text' | 'email' | 'password' | 'number'
- `placeholder`: string
- `error`: string
- `required`: boolean

### Select

```typescript
import { Select } from '@core/ui';

<Select
  label="카테고리"
  options={[
    { value: 'food', label: '식비' },
    { value: 'transport', label: '교통비' }
  ]}
  value={category}
  onChange={setCategory}
/>
```

### Card

```typescript
import { Card } from '@core/ui';

<Card title="월간 요약" actions={<Button>상세보기</Button>}>
  <p>총 지출: 1,234,567원</p>
</Card>
```

### Modal

```typescript
import { Modal, useModal } from '@core/ui';

const modal = useModal();

<>
  <Button onClick={modal.open}>열기</Button>
  
  <Modal
    isOpen={modal.isOpen}
    onClose={modal.close}
    title="확인"
  >
    <p>정말 삭제하시겠습니까?</p>
    <Button onClick={handleDelete}>삭제</Button>
  </Modal>
</>
```

### Table

```typescript
import { Table } from '@core/ui';

<Table
  columns={[
    { key: 'name', label: '이름' },
    { key: 'price', label: '가격' }
  ]}
  data={items}
  onRowClick={handleRowClick}
/>
```

## 레이아웃 컴포넌트

### PageLayout

표준 페이지 레이아웃:

```typescript
import { PageLayout } from '@core/ui';

<PageLayout
  title="가계부"
  subtitle="수입과 지출을 관리하세요"
  actions={<Button variant="primary">추가</Button>}
  breadcrumb={['홈', '가계부']}
>
  {children}
</PageLayout>
```

### FormLayout

폼 전용 레이아웃:

```typescript
import { FormLayout } from '@core/ui';

<FormLayout
  title="새 항목 추가"
  onSubmit={handleSubmit}
  onCancel={handleCancel}
  submitText="저장"
>
  <Input label="금액" type="number" />
  <Select label="카테고리" options={categories} />
</FormLayout>
```

### ListLayout

리스트 페이지 레이아웃:

```typescript
import { ListLayout } from '@core/ui';

<ListLayout
  title="구독 목록"
  filters={<CategoryFilter />}
  actions={<Button>추가</Button>}
>
  {items.map(item => <ItemCard key={item.id} item={item} />)}
</ListLayout>
```

## 고급 컴포넌트

### DataTable

정렬, 필터, 페이지네이션 내장:

```typescript
import { DataTable } from '@core/ui';

<DataTable
  columns={[
    { key: 'date', label: '날짜', sortable: true },
    { key: 'amount', label: '금액', sortable: true, format: 'currency' },
    { key: 'category', label: '카테고리', filterable: true }
  ]}
  data={entries}
  searchable
  searchPlaceholder="검색..."
  sortable
  filterable
  pagination
  pageSize={20}
  onRowClick={handleRowClick}
/>
```

**기능:**
- 정렬 (오름차순/내림차순)
- 필터링 (카테고리별)
- 검색 (전체 컬럼)
- 페이지네이션
- 행 클릭 이벤트
- 포맷팅 (통화, 날짜 등)

### FormBuilder

JSON 스키마로 폼 자동 생성:

```typescript
import { FormBuilder } from '@core/ui';

<FormBuilder
  schema={{
    fields: [
      {
        name: 'amount',
        type: 'number',
        label: '금액',
        required: true,
        min: 0
      },
      {
        name: 'category',
        type: 'select',
        label: '카테고리',
        options: categories,
        required: true
      },
      {
        name: 'date',
        type: 'date',
        label: '날짜',
        defaultValue: new Date()
      },
      {
        name: 'description',
        type: 'textarea',
        label: '메모',
        rows: 3
      }
    ]
  }}
  onSubmit={handleSubmit}
  onCancel={handleCancel}
/>
```

**지원하는 필드 타입:**
- text, email, password
- number, currency
- date, datetime
- select, multiselect
- textarea
- checkbox, radio
- file

## Hooks

### useForm

폼 상태 관리:

```typescript
import { useForm } from '@core/ui';

const form = useForm({
  initialValues: {
    amount: 0,
    category: ''
  },
  validations: {
    amount: (value) => value > 0 || '금액은 0보다 커야 합니다',
    category: (value) => value.length > 0 || '카테고리를 선택하세요'
  },
  onSubmit: async (values) => {
    await createEntry(values);
  }
});

<form onSubmit={form.handleSubmit}>
  <Input
    label="금액"
    value={form.values.amount}
    onChange={(e) => form.setValue('amount', e.target.value)}
    error={form.errors.amount}
  />
  <Button type="submit" loading={form.isSubmitting}>
    저장
  </Button>
</form>
```

### useTable

테이블 상태 관리:

```typescript
import { useTable } from '@core/ui';

const table = useTable({
  data: entries,
  sortBy: 'date',
  sortOrder: 'desc',
  pageSize: 20
});

<DataTable
  {...table.getTableProps()}
  data={table.paginatedData}
  onSort={table.handleSort}
  onPageChange={table.setPage}
/>
```

### useNotification

알림 표시:

```typescript
import { useNotification } from '@core/ui';

const notify = useNotification();

const handleSave = async () => {
  try {
    await saveData();
    notify.success('저장되었습니다');
  } catch (error) {
    notify.error('저장에 실패했습니다');
  }
};
```

## 사용 예시

### 완전한 페이지 예제

```typescript
import { 
  PageLayout, 
  DataTable, 
  Button, 
  Card,
  useModal,
  FormBuilder 
} from '@core/ui';

export default function LedgerPage() {
  const modal = useModal();
  const [entries, setEntries] = useState([]);
  
  return (
    <PageLayout
      title="가계부"
      actions={
        <Button variant="primary" onClick={modal.open}>
          + 추가
        </Button>
      }
    >
      <Card title="최근 내역">
        <DataTable
          columns={[
            { key: 'date', label: '날짜', sortable: true },
            { key: 'category', label: '카테고리' },
            { key: 'amount', label: '금액', format: 'currency' }
          ]}
          data={entries}
          searchable
          pagination
        />
      </Card>
      
      <Modal
        isOpen={modal.isOpen}
        onClose={modal.close}
        title="새 항목"
      >
        <FormBuilder
          schema={ledgerSchema}
          onSubmit={handleCreate}
          onCancel={modal.close}
        />
      </Modal>
    </PageLayout>
  );
}
```

## 테마 커스터마이징

```typescript
// packages/core/ui/theme.ts
export const theme = {
  colors: {
    primary: '#3B82F6',
    secondary: '#6B7280',
    danger: '#EF4444',
    success: '#10B981'
  },
  fonts: {
    sans: 'Inter, sans-serif',
    mono: 'JetBrains Mono, monospace'
  },
  spacing: {
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem'
  }
};
```

사용자는 자유롭게 테마를 커스터마이징할 수 있습니다.