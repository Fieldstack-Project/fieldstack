# Core UI Component Library

## 개요

모듈 개발자가 UI를 처음부터 만들 필요 없이, `@fieldstack/controls`에서 제공하는 컴포넌트를 사용하여 빠르고 일관된 인터페이스를 구축할 수 있도록 지원합니다.

- 통일된 디자인 시스템 (CSS 커스텀 프로퍼티 기반, `fs-` 접두사)
- 다크 모드 자동 지원 (`[data-theme]` / `prefers-color-scheme`)
- 접근성 기본 처리 (aria, role, keyboard 탐색)
- 상세 구현 상태는 `ui/03-control-backlog.md`에서 관리
- 테마 시스템 정책은 `ui/01-theme-policy.md` 참고

> **구현 방향 메모 (Phase 1.5 기준)**
>
> - Control 구현은 `Radix UI Primitives` 기반으로 진행
> - 스타일/조합 패턴은 `shadcn/ui` 방식을 참고
> - 실제 앱/모듈에서는 외부 라이브러리를 직접 사용하지 않고 `@fieldstack/controls`를 통해서만 사용
> - 우선순위는 `P0 → P0.5 → P1 → P2` 순서로 적용

---

## 패키지 구조

```
packages/controls/src/
├── components/          # 컴포넌트 구현체
│   ├── Button.tsx
│   ├── Input.tsx
│   ├── Select.tsx
│   ├── Checkbox.tsx
│   ├── Radio.tsx
│   ├── Switch.tsx
│   ├── Modal.tsx
│   ├── FormField.tsx
│   ├── Alert.tsx
│   ├── Progress.tsx
│   ├── Textarea.tsx
│   ├── PasswordInput.tsx
│   ├── OtpInput.tsx
│   ├── PinInput.tsx
│   ├── SearchInput.tsx
│   ├── Spinner.tsx
│   ├── Toast.tsx
│   ├── EmptyState.tsx
│   └── Skeleton.tsx
├── styles/              # 컴포넌트별 CSS 파일 (fs- 접두사)
├── contracts.ts         # ControlDescriptor, CONTROL_DESCRIPTORS
├── foundation.ts
└── index.ts             # 전체 export
```

---

## P0 Controls (Core 필수)

### Button

```tsx
import { Button } from '@fieldstack/controls';

<Button variant="primary" size="md" loading={false}>저장</Button>
<Button variant="danger" disabled>삭제</Button>
<Button variant="ghost" block>전체 너비</Button>
```

**Props:**
- `variant`: `'primary' | 'secondary' | 'danger' | 'ghost'` — 기본값 `'secondary'`
- `size`: `'sm' | 'md' | 'lg'` — 기본값 `'md'`
- `loading`: `boolean` — 로딩 스피너 표시 + 자동 disabled
- `block`: `boolean` — 전체 너비 버튼
- `disabled`: `boolean`
- 나머지 `<button>` HTML 속성 모두 지원

---

### Input

`FormField`와 함께 사용하는 것을 권장합니다.

```tsx
import { Input, FormField } from '@fieldstack/controls';

<FormField label="이메일" required htmlFor="email">
  <Input
    id="email"
    type="email"
    placeholder="example@email.com"
    error={errors.email}
    helpText="업무용 이메일을 입력하세요"
  />
</FormField>
```

**Props:**
- `error`: `string` — 에러 메시지 표시, 입력 필드 에러 스타일 적용
- `helpText`: `string` — 보조 설명 (error가 없을 때만 표시)
- `type`: HTML input type (`'text' | 'email' | 'password' | 'number'` 등)
- 나머지 `<input>` HTML 속성 모두 지원

---

### Select

```tsx
import { Select, FormField } from '@fieldstack/controls';

const options = [
  { label: '식비', value: 'food' },
  { label: '교통비', value: 'transport', disabled: true },
];

<FormField label="카테고리" htmlFor="category">
  <Select
    id="category"
    options={options}
    placeholder="선택하세요"
    value={value}
    onChange={(e) => setValue(e.target.value)}
    error={errors.category}
  />
</FormField>
```

**Props:**
- `options`: `{ label: string; value: string; disabled?: boolean }[]`
- `placeholder`: `string` — 첫 번째 비활성 옵션으로 표시
- `error`: `string`
- 나머지 `<select>` HTML 속성 모두 지원

---

### Checkbox / CheckboxGroup

```tsx
import { Checkbox, CheckboxGroup } from '@fieldstack/controls';

// 단일
<Checkbox id="agree" label="약관에 동의합니다" checked={checked} onChange={...} />

// 그룹
<CheckboxGroup label="알림 설정">
  <Checkbox id="email-noti" label="이메일" checked={...} onChange={...} />
  <Checkbox id="sms-noti"   label="SMS"   checked={...} onChange={...} />
</CheckboxGroup>

// indeterminate
<Checkbox id="all" label="전체 선택" indeterminate={someChecked} checked={allChecked} onChange={...} />
```

**CheckboxProps:**
- `label`: `string`
- `indeterminate`: `boolean` — 부분 선택 상태
- 나머지 `<input type="checkbox">` 속성 모두 지원

**CheckboxGroupProps:**
- `label`: `string` — `<legend>`로 렌더링
- `children`: `ReactNode`

---

### RadioGroup

```tsx
import { RadioGroup } from '@fieldstack/controls';

const options = [
  { label: '월간', value: 'monthly' },
  { label: '연간', value: 'yearly' },
];

<RadioGroup
  name="billing"
  options={options}
  value={selected}
  onChange={setSelected}
  label="결제 주기"
/>
```

**Props:**
- `name`: `string` — radio 그룹 name 속성
- `options`: `{ label: string; value: string; disabled?: boolean }[]`
- `value`: `string` — 현재 선택값
- `onChange`: `(value: string) => void`
- `label`: `string` — `<legend>`로 렌더링

---

### Switch

```tsx
import { Switch } from '@fieldstack/controls';

<Switch
  id="dark-mode"
  label="다크 모드"
  checked={isDark}
  onChange={setIsDark}
/>
```

**Props:**
- `checked`: `boolean`
- `onChange`: `(checked: boolean) => void`
- `label`: `string`
- `disabled`: `boolean`
- `id`: `string`

---

### Modal

```tsx
import { Modal, Button } from '@fieldstack/controls';
import { useState } from 'react';

const [open, setOpen] = useState(false);

<Button onClick={() => setOpen(true)}>열기</Button>

<Modal
  open={open}
  onClose={() => setOpen(false)}
  title="확인"
  size="sm"
  footer={
    <Button variant="danger" onClick={handleDelete}>삭제</Button>
  }
>
  정말 삭제하시겠습니까?
</Modal>
```

**Props:**
- `open`: `boolean`
- `onClose`: `() => void` — ESC 키 및 배경 클릭 시 자동 호출
- `title`: `string`
- `size`: `'sm' | 'md' | 'lg'` — 기본값 `'md'`
- `footer`: `ReactNode` — 하단 액션 영역
- `children`: `ReactNode`

---

### FormField

라벨, 도움말, 에러 메시지를 컴포넌트에 일관되게 붙이는 래퍼입니다.
`Input`, `Select`, `Textarea`, `PasswordInput` 등과 함께 사용합니다.

```tsx
import { FormField, Input } from '@fieldstack/controls';

<FormField label="금액" required htmlFor="amount" error={errors.amount} helpText="원 단위로 입력">
  <Input id="amount" type="number" />
</FormField>
```

**Props:**
- `label`: `string`
- `htmlFor`: `string` — label의 for 속성
- `required`: `boolean` — `*` 표시
- `error`: `string`
- `helpText`: `string` — error가 없을 때만 표시
- `children`: `ReactNode`

---

### Alert

```tsx
import { Alert } from '@fieldstack/controls';

<Alert variant="success" title="저장 완료">변경사항이 저장되었습니다.</Alert>
<Alert variant="error" onClose={() => clearError()}>연결에 실패했습니다.</Alert>
```

**Props:**
- `variant`: `'success' | 'warning' | 'error' | 'info'`
- `title`: `string` — 굵은 제목 (선택)
- `onClose`: `() => void` — 닫기 버튼 표시
- `children`: `ReactNode` — 본문 메시지

---

### Progress / StepProgress

```tsx
import { Progress, StepProgress } from '@fieldstack/controls';

// 진행률 바
<Progress value={72} size="md" label="업로드 중" />

// 설치 마법사 등 단계 표시
<StepProgress
  steps={['Welcome', '계정 설정', 'DB 설정', '완료']}
  currentStep={1}
/>
```

**ProgressProps:**
- `value`: `number` — 0~100
- `size`: `'sm' | 'md'` — 기본값 `'md'`
- `label`: `string` — aria-label

**StepProgressProps:**
- `steps`: `string[]` — 단계 이름 목록
- `currentStep`: `number` — 현재 단계 인덱스 (0부터)

---

## P0.5 Controls (반복 사용)

### Textarea

```tsx
import { Textarea, FormField } from '@fieldstack/controls';

<FormField label="메모" htmlFor="memo">
  <Textarea id="memo" rows={4} placeholder="내용을 입력하세요" error={errors.memo} />
</FormField>
```

**Props:**
- `error`: `string`
- `helpText`: `string`
- 나머지 `<textarea>` HTML 속성 모두 지원

---

### PasswordInput

```tsx
import { PasswordInput, FormField } from '@fieldstack/controls';

<FormField label="비밀번호" htmlFor="pw">
  <PasswordInput id="pw" value={pw} onChange={(e) => setPw(e.target.value)} showStrength />
</FormField>
```

**Props:**
- `showStrength`: `boolean` — 비밀번호 강도 표시 바 (weak / fair / strong)
- `error`: `string`
- 나머지 `<input>` 속성 지원 (type 제외 — 내부에서 관리)

---

### OtpInput

숫자 전용 개별 셀 입력. 붙여넣기, 방향키, Backspace 키보드 조작 지원.

```tsx
import { OtpInput } from '@fieldstack/controls';

<OtpInput length={6} value={otp} onChange={setOtp} error={errors.otp} />
```

**Props:**
- `length`: `number` — 기본값 `6`
- `value`: `string`
- `onChange`: `(value: string) => void`
- `error`: `string`
- `disabled`: `boolean`

---

### PinInput

관리자 PIN 입력용. 단일 `<input type="password">` 기반, 숫자만 허용.

```tsx
import { PinInput } from '@fieldstack/controls';

<PinInput length={4} value={pin} onChange={setPin} error={errors.pin} />
```

**Props:**
- `length`: `4 | 6` — 기본값 `4`
- `value`: `string`
- `onChange`: `(value: string) => void`
- `error`: `string`
- `disabled`: `boolean`

---

### SearchInput

디바운스 내장 검색 입력. 값이 있을 때 X(지우기) 버튼 자동 표시.

```tsx
import { SearchInput } from '@fieldstack/controls';

<SearchInput
  value={query}
  onChange={(e) => setQuery(e.target.value)}
  onSearch={(value) => fetchResults(value)}
  onClear={() => setQuery('')}
  debounceMs={300}
  placeholder="검색어를 입력하세요"
/>
```

**Props:**
- `onSearch`: `(value: string) => void` — 디바운스 후 호출
- `debounceMs`: `number` — 기본값 `300`
- `onClear`: `() => void` — X 버튼 클릭 시 호출
- 나머지 `<input>` 속성 지원 (type 제외)

---

### Spinner

```tsx
import { Spinner } from '@fieldstack/controls';

// 인라인
<Spinner size="sm" />

// 텍스트 포함
<Spinner size="md" label="저장 중..." />

// 화면 전체 블로킹 오버레이
<Spinner size="lg" label="로딩 중..." blocking />
```

**Props:**
- `size`: `'sm' | 'md' | 'lg'` — 기본값 `'md'`
- `label`: `string` — 표시 텍스트 및 aria-label
- `blocking`: `boolean` — 전체 화면 오버레이 모드

---

### Toast / useToast

앱 루트에 `ToastProvider`를 한 번 감싸고, 하위 어디서나 `useToast()`로 호출합니다.

```tsx
// main.tsx (또는 앱 루트)
import { ToastProvider } from '@fieldstack/controls';
<ToastProvider><App /></ToastProvider>

// 컴포넌트 내부
import { useToast } from '@fieldstack/controls';

const { toast } = useToast();

toast({ variant: 'success', message: '저장되었습니다.' });
toast({ variant: 'error', title: '오류', message: '저장에 실패했습니다.', duration: 6000 });
```

**ToastItem:**
- `variant`: `'success' | 'warning' | 'error' | 'info'`
- `title`: `string` (선택)
- `message`: `string`
- `duration`: `number` — ms, 기본값 `4000`. `0`이면 자동 닫힘 없음

---

### EmptyState

목록이 비었거나 데이터가 없는 상태를 표시합니다.

```tsx
import { EmptyState } from '@fieldstack/controls';

<EmptyState
  icon="📋"
  title="등록된 항목이 없습니다"
  description="첫 번째 항목을 추가해보세요."
  action={{ label: '+ 추가', onClick: () => setOpen(true) }}
/>
```

**Props:**
- `icon`: `string` — 이모지 또는 텍스트 아이콘 (선택)
- `title`: `string`
- `description`: `string` (선택)
- `action`: `{ label: string; onClick: () => void }` (선택)

---

### Skeleton

콘텐츠 로딩 중 자리표시자입니다.

```tsx
import { Skeleton } from '@fieldstack/controls';

// 텍스트 여러 줄
<Skeleton variant="text" lines={3} />

// 원형 (아바타)
<Skeleton variant="circular" width={40} height={40} />

// 직사각형 (카드, 이미지)
<Skeleton variant="rect" width="100%" height={120} />
```

**Props:**
- `variant`: `'text' | 'circular' | 'rect'` — 기본값 `'text'`
- `lines`: `number` — `variant="text"`일 때 줄 수, 기본값 `1`
- `width`: `string | number`
- `height`: `string | number`

---

## 미구현 (P1 이상, 향후 추가)

아래 항목은 현재 미구현이며 모듈 요구사항 또는 커뮤니티 제안 기반으로 추가됩니다.

| 컴포넌트 | 우선순위 | 비고 |
|---------|---------|------|
| Combobox | P1 | 다중 선택 + 검색 + 생성. 단일 선택은 현재 `Select`로 커버 |
| DataTable | P1 | 정렬·필터·페이지네이션 내장 테이블 |
| DatePicker | P1 | 날짜/날짜범위 선택 |
| Tabs | P1 | 탭 네비게이션 |
| Card | P1 | 콘텐츠 카드 컨테이너 |
| Dropdown / Menu | P1 | 컨텍스트 메뉴, 액션 메뉴 |
| FormBuilder | P2 | JSON 스키마 기반 폼 자동 생성 |
| PageLayout | P2 | 표준 페이지 레이아웃 (제목, 액션, 브레드크럼) |

---

## CSS 임포트

컴포넌트 사용 전 스타일을 임포트해야 합니다.

```ts
// global.css — 디자인 토큰 (라이트/다크)
import '@fieldstack/controls/styles/global.css';

// controls.css — 컴포넌트 스타일
import '@fieldstack/controls/styles/controls.css';
```
