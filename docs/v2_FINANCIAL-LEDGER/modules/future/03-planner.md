# 플래너 모듈

## 개요

여행 계획 등 특정 목적의 일정을 구조적으로 계획하고 관리하는 모듈입니다.  
TODO / 스케줄러 모듈이 일상적인 할 일 관리에 초점을 맞춘다면,  
플래너 모듈은 **계획 단위의 묶음**을 관리하는 데 초점을 맞춥니다.

> **개발 시점:** Fieldstack V1 완성 이후, 우선순위가 낮으므로 후순위 검토

---

## 주요 기능 (검토 중)

### 1. 여행 계획
- 국내 / 해외 여행 계획 생성
- 날짜별 일정 구성 (Day 1, Day 2 ...)
- 방문 장소, 숙소, 교통 정보 입력
- 예산 계획 및 지출 추적 — Ledger 모듈 연동

### 2. 계획 관리
- 계획 상태 관리: `계획 중` / `예약 완료` / `완료` / `취소`
- 체크리스트 (챙길 것 목록 등)
- 파일 및 이미지 첨부 (티켓, 바우처 등)

---

## 모듈 간 연동 (검토 중)

- 여행 기간 중 지출 → Ledger 모듈에 자동 기록 또는 연결
- 여행 일정 → Google Calendar 연동 (선택)

---

## 데이터 구조 (초안)

```ts
interface Plan {
  id: string
  userId: string
  type: 'travel' | 'etc'         // 추후 확장 가능
  title: string
  description?: string
  status: 'planning' | 'booked' | 'completed' | 'cancelled'
  startDate?: string
  endDate?: string
  budget?: number
  currency?: string
  tags?: string[]
  createdAt: string
  updatedAt: string
}

interface PlanDay {
  id: string
  planId: string
  date: string
  items: PlanDayItem[]
}

interface PlanDayItem {
  id: string
  time?: string
  title: string
  location?: string
  memo?: string
  type: 'place' | 'transport' | 'accommodation' | 'meal' | 'etc'
}
```

---

## 참고

- 추후 여행 외 다른 계획 유형(이벤트 준비, 스터디 플랜 등)으로 확장 가능성 있음 `(미정)`
