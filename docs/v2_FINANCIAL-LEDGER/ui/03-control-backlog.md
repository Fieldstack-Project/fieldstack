# Control Backlog (P0 -> P0.5 -> P1)

## 목적

Phase 1.5에서 Core Control을 우선순위 기반으로 구현하고,
Phase 2 이후 모듈/커뮤니티 요청에 따라 점진 확장하기 위한 관리 문서입니다.

## 운영 원칙

- P0는 Phase 1.5에서 우선 완료한다.
- P0.5는 핵심 흐름에서 반복 사용되는 항목을 우선 반영한다.
- P1은 전부 선행 구현하지 않고, 실제 요구가 발생한 항목부터 배치 처리한다.
- 커뮤니티 제안 Control도 동일 백로그에 추가하고 상태를 갱신한다.

## 상태 기준

- `미착수` - 구현 시작 전
- `규격 확정` - 인터페이스/계약 정의 완료, `packages/ui` 실제 구현 미착수
- `진행중` - 작업 중
- `완료` - `packages/ui`에 실제 컴포넌트 반영 + `ready: true` 확인 완료

> **현재 상태 (2026-04-12 기준):**
> P0/P0.5 전 항목은 `규격 확정` 상태입니다. `packages/controls/src/components/index.ts`에 계약 타입만 선언되어 있으며
> 실제 React 컴포넌트는 미구현입니다 (`ready: false`).
>
> `apps/web` 각 View에서 인라인으로 사용 중인 스타일/구조가 사실상의 레퍼런스이며,
> 2026-04-12 UI/UX 전면 개편으로 확정된 **다크 모드 디자인 토큰 시스템**을 기반으로
> `packages/controls` 구현을 진행하면 됩니다.

## P0 (Core 필수)

| Control | 우선순위 | 1.5 구현상태 | 비고 |
| --- | --- | --- | --- |
| Button | P0 | 규격 확정 | Primary/Secondary/Danger/Ghost |
| Input | P0 | 규격 확정 | text/email/number/password |
| Select / ComboBox | P0 | 규격 확정 | single/multi + search |
| Checkbox | P0 | 규격 확정 | 단일/그룹 + indeterminate |
| Radio | P0 | 규격 확정 | 단일 선택 그룹 |
| Switch / Toggle | P0 | 규격 확정 | on/off + keyboard |
| Modal / Dialog | P0 | 규격 확정 | confirm/alert/prompt 패턴 |
| Form Field Wrapper | P0 | 규격 확정 | label/help/error/required |
| Alert / Inline Message | P0 | 규격 확정 | success/warning/error/info |
| Progress | P0 | 규격 확정 | linear + step progress |

## P0.5 (핵심 흐름 반복 사용)

| Control | 우선순위 | 1.5 구현상태 | 비고 |
| --- | --- | --- | --- |
| Textarea | P0.5 | 규격 확정 | multi-line input |
| Password Input | P0.5 | 규격 확정 | show/hide + strength hint |
| OTP / PIN Input | P0.5 | 규격 확정 | 4~6자리 step-up 인증 |
| Search Input | P0.5 | 규격 확정 | debounce/clear |
| Spinner / Loader | P0.5 | 규격 확정 | blocking/non-blocking 로딩 |
| Toast / Notification | P0.5 | 규격 확정 | 전역 피드백 메시지 |
| Empty State Block | P0.5 | 규격 확정 | CTA 포함 빈 상태 |
| Skeleton Loader | P0.5 | 규격 확정 | list/card/form skeleton |

## P1 (자주 쓰이지만 일부 우선 구현)

| Control | 우선순위 | 1.5 구현상태 | 비고 |
| --- | --- | --- | --- |
| Tabs | P1 | 미착수 | settings/module 화면 분리 |
| Dropdown Menu | P1 | 미착수 | header/user/action menu |
| Tooltip | P1 | 미착수 | helper/explain UX |
| Badge / Tag | P1 | 미착수 | 상태 표기 (active/error 등) |
| Pagination | P1 | 미착수 | table/list 페이지 분할 |
| Date Picker | P1 | 미착수 | 단일/범위 선택 |
| File Uploader | P1 | 미착수 | drag&drop + progress |
| Drawer / Sheet | P1 | 미착수 | 모바일/보조 패널 |

## P2 (요청 기반 확장)

| Control | 우선순위 | 1.5 구현상태 | 비고 |
| --- | --- | --- | --- |
| Multi Select (Advanced) | P2 | 미착수 | group/search/chip + keyboard |
| Command Palette | P2 | 미착수 | 빠른 액션/검색 단축키 |
| Rich Text Editor | P2 | 미착수 | markdown/toolbar/attachment |
| Data Grid (Advanced Table) | P2 | 미착수 | column resize/pin/virtual scroll |
| Tree View | P2 | 미착수 | 계층형 데이터 탐색 |
| Accordion | P2 | 미착수 | 섹션 접기/펼치기 |
| Stepper | P2 | 미착수 | 다단계 프로세스 탐색 |
| Timeline | P2 | 미착수 | 활동 이력 시각화 |
| Calendar View | P2 | 미착수 | month/week/day 캘린더 |
| Date Range Picker (Advanced) | P2 | 미착수 | preset/quick range/timezone |
| Time Picker | P2 | 미착수 | 12h/24h + seconds |
| Color Picker | P2 | 미착수 | HEX/RGB + palette |
| Slider / Range Slider | P2 | 미착수 | 단일/범위 값 조절 |
| Segmented Control | P2 | 미착수 | 소형 탭 대체 선택 UI |
| Combobox Creatable | P2 | 미착수 | 옵션 생성 허용 |
| Mentions / Autocomplete | P2 | 미착수 | @mention/#tag 입력 보조 |
| Kanban Board | P2 | 미착수 | drag&drop 상태 보드 |
| Split Pane / Resizable Panel | P2 | 미착수 | 가변 레이아웃 편집 |
| Code Editor | P2 | 미착수 | JSON/YAML 설정 편집 |
| JSON Viewer / Diff Viewer | P2 | 미착수 | 설정 비교/검토 |
| Tour / Coachmark | P2 | 미착수 | 온보딩 단계 안내 |
| Hotkey Helper | P2 | 미착수 | 단축키 목록/가이드 |
| Activity Feed | P2 | 미착수 | 이벤트 스트림 컴포넌트 |
| Permission Matrix | P2 | 미착수 | 역할/권한 테이블 편집 |
| Bulk Action Bar | P2 | 미착수 | 다중 선택 일괄 처리 |

## P2+ (AI & External Integration 전용)

| Control | 우선순위 | 1.5 구현상태 | 비고 |
| --- | --- | --- | --- |
| API Key Generator | P2 | 미착수 | 외부 에이전트 연동용 키 발급 UI |
| Scope Selector Table | P2 | 미착수 | 모듈별 권한(Read/Write) 제어 매트릭스 |
| Audit Log Timeline | P2 | 미착수 | 외부 접속 및 API 실행 이력 시각화 |
| Skill Manifest Editor | P3 | 미착수 | 모듈별 노출 스킬 수동 조정 UI |
