# TODO / 스케줄러 모듈

## 개요

할 일 관리 및 일정 추적을 위한 모듈입니다.  
개인 태스크 관리에 집중하며, 협업 기능보다는 1인 사용자의 업무 흐름에 최적화합니다.

> **개발 시점:** Fieldstack V1 완성 이후 검토  
> **참고 서비스:** [TickTick](https://ticktick.com/)

---

## 주요 기능 (검토 중)

### 1. 할 일 관리
- 할 일 생성, 수정, 삭제
- 마감일 및 알림 설정
- 우선순위 설정 (높음 / 보통 / 낮음)
- 태그 및 카테고리 분류
- 반복 일정 설정

### 2. 목록 관리
- 여러 목록(리스트) 생성 및 분류
- 완료 항목 별도 보관

### 3. 캘린더 뷰
- 마감일 기준 캘린더 형태로 조회
- Google Calendar 연동 (선택)

### 4. 통계
- 완료율 추적
- 기간별 처리 건수

---

## 미포함 기능

- **포모도로 타이머** — 추가하지 않음

---

## 모듈 간 연동 (검토 중)

- 프로젝트·외주 관리 모듈의 마일스톤 → TODO 항목 자동 생성
- Subscription 결제일 → 캘린더 뷰에 표시

---

## 데이터 구조 (초안)

```ts
interface Todo {
  id: string
  userId: string
  listId?: string
  title: string
  description?: string
  priority: 'high' | 'medium' | 'low'
  dueDate?: string
  reminderAt?: string
  isCompleted: boolean
  completedAt?: string
  repeat?: RepeatRule
  tags?: string[]
  createdAt: string
  updatedAt: string
}

interface TodoList {
  id: string
  userId: string
  name: string
  color?: string
  createdAt: string
}
```

---

## API 엔드포인트 (초안)

```
GET    /api/todos                  # 목록 조회
GET    /api/todos/:id              # 상세 조회
POST   /api/todos                  # 신규 생성
PUT    /api/todos/:id              # 수정
DELETE /api/todos/:id              # 삭제
PATCH  /api/todos/:id/complete     # 완료 처리

GET    /api/todo-lists             # 목록 리스트 조회
POST   /api/todo-lists             # 목록 생성
DELETE /api/todo-lists/:id         # 목록 삭제
```
