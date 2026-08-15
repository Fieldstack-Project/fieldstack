# 부스 운영·행사 판매 관리 모듈

## 개요

서울코믹월드(서코, 부코, 수코 등)와 일러스타 페스 등 오프라인 행사에서 개인 창작자 또는 소규모 팀이 부스를 운영할 때 필요한 재고, 현장 판매, 예약 수령, 행사 후 정산을 관리하는 모듈입니다.

이 모듈은 선입금 폼, 통판 폼, 주문 접수 서비스를 대체하지 않습니다. 윗치폼처럼 이미 강한 외부 서비스를 주문 원본으로 두고, Fieldstack은 행사 현장에서 필요한 **운영판** 역할을 맡습니다.

> **개발 시점:** Fieldstack V1 완성 이후 검토  
> **상태:** 아이디어 및 초기 설계 단계  
> **핵심 방향:** 윗치폼과 경쟁하지 않고, 엑셀 가져오기·현장 판매·재고·정산을 보조

---

## 역할 경계

### 윗치폼 등 외부 서비스가 담당하는 영역

- 선입금 폼 생성
- 통판 폼 생성
- 행사 당일 수령 예약
- 주문 접수
- 입금 확인
- 주문자 정보 관리
- 옵션 선택
- 주문 취소·변경 요청 처리

### Fieldstack이 담당하는 영역

- 윗치폼 엑셀 파일 가져오기
- 외부 예약/선입금 주문의 행사 수령 체크
- 예약분과 현장 판매분 재고 분리
- 현장 판매 수기 기록
- 현금, 계좌이체, 카드 결제, 간편결제 결과 기록
- 증정, 파손, 분실, 재고 조정 기록
- 행사 종료 후 매출, 비용, 잔여 재고 정산
- Ledger 및 세무 준비 지원 기능으로 요약 데이터 전달

### 명시적으로 하지 않는 일

- 선입금 폼 또는 통판 폼 제공
- 결제 중개 또는 카드 결제 대행
- 윗치폼 주문 데이터 실시간 동기화
- 외부 서비스의 주문 상태를 원격으로 변경

---

## 윗치폼 연동 방향

윗치폼에는 API가 없다는 전제로 설계합니다. 주문 데이터는 사용자가 윗치폼에서 엑셀 파일로 내려받은 뒤 Fieldstack에 가져오는 방식만 고려합니다.

### 엑셀 가져오기 기능 (계획)

- 엑셀 또는 CSV 파일 업로드
- 컬럼 자동 감지 및 수동 매핑
- 주문번호, 닉네임, 입금자명, 전화번호 뒤 4자리 등 검색 키 생성
- 상품명·옵션명·수량을 Fieldstack 상품과 매칭
- 예약분 재고 자동 반영
- 중복 가져오기 방지
- 가져오기 이력 저장
- 원본 파일명, 가져온 시각, 행 수, 실패 행 수 기록

가져온 윗치폼 데이터는 Fieldstack 내부에서 새 주문으로 재생성하지 않고, **외부 주문 원본의 스냅샷**으로 취급합니다.

---

## 주요 기능 (검토 중)

### 1. 행사 관리

- 행사명, 날짜, 장소, 부스명, 부스 번호 기록
- 참가비, 교통비, 인쇄비, 포장비 등 행사 비용 연결
- 행사별 준비 상태 관리
- 행사 종료 후 정산 상태 관리

상태 예시:
- 준비 중
- 운영 중
- 정산 필요
- 정산 완료
- 취소

### 2. 상품 및 재고 관리

- 굿즈, 회지, 엽서, 스티커, 키링 등 상품 등록
- 행사별 준비 수량 입력
- 예약분, 현장 판매 가능분, 판매 완료분, 미수령분 분리 표시
- 증정, 파손, 분실, 재고 조정 기록
- 다음 행사로 잔여 재고 이월

재고 계산 기준:

```text
총 준비 수량
- 예약 배정 수량
- 현장 판매 수량
- 수령 완료 수량
- 증정 수량
- 파손/분실 수량
= 행사 후 잔여 수량
```

### 3. 예약 수령 체크

윗치폼에서 가져온 선입금 또는 행사 당일 예약 구매 데이터를 현장 수령 체크에 사용합니다.

행사 당일 화면에서 필요한 기능:
- 주문번호 검색
- 닉네임 검색
- 입금자명 검색
- 전화번호 뒤 4자리 검색
- 예약 상품 목록 표시
- 전체 수령 완료
- 일부 수령
- 대리 수령 메모
- 확인 필요 표시
- 미수령 목록 확인

### 4. 현장 판매 기록

현장에서 윗치폼이 아닌 방식으로 결제된 판매도 기록할 수 있어야 합니다.

지원 결제수단 예시:
- 현금
- 계좌이체
- 카드 결제
- 간편결제
- 기타 수기 입력

Fieldstack은 결제 자체를 처리하지 않습니다. 카드 단말기, 계좌이체, 간편결제 등 외부에서 결제가 끝난 결과를 운영자가 기록하는 방식입니다.

간단 POS 형태의 입력 흐름:
- 상품 선택
- 수량 선택
- 할인 또는 세트 적용
- 결제수단 선택
- 메모 입력
- 판매 완료
- 재고 자동 차감

### 5. 행사 후 정산

행사 종료 후 다음 정보를 요약합니다.

- 총 매출
- 윗치폼 예약/선입금 매출
- 현장 현금 매출
- 현장 계좌이체 매출
- 현장 카드 매출
- 현장 간편결제 매출
- 상품별 판매량
- 상품별 잔여 수량
- 미수령 예약 목록
- 증정/파손/분실 수량
- 행사 비용
- 순이익

정산 결과는 Ledger 모듈에 수입·지출 항목으로 연결할 수 있습니다.

### 6. 부스 준비 체크리스트

행사 준비 과정에서 반복적으로 필요한 항목을 체크리스트로 관리합니다.

예시:
- 재고 포장 완료
- 예약분 분리 완료
- 가격표 출력
- QR 결제 이미지 준비
- 거스름돈 준비
- 카드 단말기 준비
- 테이블보, 진열대, 집게, 테이프 준비
- 쓰레기봉투, 보조배터리 준비
- 행사 후 정산 완료

---

## 판매 출처 구분

모든 판매 또는 재고 변동에는 출처를 기록합니다.

예시:

```ts
type BoothTransactionSource =
  | 'witchform_prepaid'      // 윗치폼 선입금/예약
  | 'witchform_eventday'     // 윗치폼 행사 당일 폼 주문
  | 'onsite_cash'            // 현장 현금
  | 'onsite_bank_transfer'   // 현장 계좌이체
  | 'onsite_card'            // 현장 카드 결제
  | 'onsite_simple_pay'      // 현장 간편결제
  | 'free_sample'            // 증정
  | 'lost_or_damaged'        // 분실/파손
  | 'inventory_adjustment'   // 재고 조정
```

윗치폼 예약분과 현장 판매분은 모두 재고에 영향을 주지만, 정산과 검산을 위해 출처를 섞지 않습니다.

---

## 데이터 구조 (초안)

```ts
interface BoothEvent {
  id: string
  userId: string
  title: string
  venue?: string
  boothName?: string
  boothNumber?: string
  startDate: string
  endDate?: string
  status: 'preparing' | 'active' | 'needs_settlement' | 'settled' | 'cancelled'
  notes?: string
  createdAt: string
  updatedAt: string
}

interface BoothProduct {
  id: string
  userId: string
  name: string
  sku?: string
  price: number
  cost?: number
  category?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

interface BoothInventoryAllocation {
  id: string
  eventId: string
  productId: string
  preparedQuantity: number
  reservedQuantity: number
  onsiteAvailableQuantity: number
  soldQuantity: number
  pickedUpQuantity: number
  giftedQuantity: number
  lostOrDamagedQuantity: number
  remainingQuantity: number
}

interface ExternalOrderSnapshot {
  id: string
  eventId: string
  source: 'witchform'
  externalOrderId?: string
  buyerAlias?: string
  depositorName?: string
  phoneLast4?: string
  importedFileName: string
  importedAt: string
  pickupStatus: 'pending' | 'picked_up' | 'partial' | 'needs_check' | 'not_picked_up'
  notes?: string
}

interface BoothSaleRecord {
  id: string
  eventId: string
  source: BoothTransactionSource
  paymentMethod?: 'cash' | 'bank_transfer' | 'card' | 'simple_pay' | 'external_form' | 'free' | 'adjustment'
  totalAmount: number
  soldAt: string
  notes?: string
}
```

---

## 모듈 간 연동

### Booth → Ledger

행사 정산이 완료되면 다음 데이터를 Ledger에 전달할 수 있습니다.

- 행사별 총 매출
- 결제수단별 매출
- 행사 비용
- 상품별 매출 요약
- 현장 판매 기록
- 윗치폼 예약/선입금 매출 요약

Ledger에는 세부 주문 전체가 아니라 정산된 수입·지출 항목과 참고 메타데이터를 연결하는 방향을 우선 검토합니다.

### Booth → 세무 준비 지원

세무 준비 지원 기능에는 다음 정보를 참고자료로 전달할 수 있습니다.

- 행사 매출 자료
- 행사 비용 자료
- 결제수단별 합계
- 상품별 판매 내역
- 영수증 및 증빙
- 미수령 또는 환불 참고 기록

이 연동은 신고를 대신하기 위한 것이 아니라, 사용자가 세무사에게 전달할 자료를 정리하기 위한 보조 흐름입니다.

---

## API 엔드포인트 (초안)

```text
GET    /api/booth/events
POST   /api/booth/events
GET    /api/booth/events/:id
PUT    /api/booth/events/:id
DELETE /api/booth/events/:id

GET    /api/booth/events/:id/products
POST   /api/booth/events/:id/products
PATCH  /api/booth/events/:id/inventory

POST   /api/booth/events/:id/import/witchform
GET    /api/booth/events/:id/external-orders
PATCH  /api/booth/external-orders/:id/pickup

POST   /api/booth/events/:id/sales
GET    /api/booth/events/:id/settlement
POST   /api/booth/events/:id/settle
```

---

## 검토 필요 항목

1. 윗치폼 엑셀 파일의 실제 컬럼 변형 대응
2. 행사 당일 모바일/태블릿 입력 UX
3. 오프라인 또는 네트워크 불안정 상황에서의 임시 저장
4. 중복 수령 체크 방지 방식
5. 대리 수령 기록에 필요한 최소 정보
6. 카드 결제 수수료 또는 간편결제 수수료 입력 여부
7. 여러 명이 같은 부스를 운영할 때 동시 입력 충돌 처리
8. 행사 후 미수령/환불 처리 방식
9. 개인정보 저장 최소화와 가져온 엑셀 원본 보관 정책

---

## 참고 서비스

- 윗치폼: 선입금, 통판, 행사 당일 예약 구매 폼 운영에 사용

Fieldstack은 윗치폼의 폼 운영 기능을 대체하지 않고, 윗치폼에서 내려받은 엑셀 데이터를 행사 운영용 참고 데이터로 가져와 재고, 수령, 현장 판매, 행사 후 정산을 돕는 방향으로 검토합니다.
