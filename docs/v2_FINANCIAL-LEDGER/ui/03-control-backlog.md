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
- `규격 확정` - 인터페이스/계약 정의 완료, `packages/controls` 실제 구현 미착수
- `진행중` - 작업 중
- `완료` - `packages/controls`에 실제 컴포넌트 반영 + `ready: true` 확인 완료

> **현재 상태 (2026-04-17 기준):**
> P0/P0.5 전 항목 구현 완료 (`ready: true`). `packages/controls/src/components/`에 React 컴포넌트 반영.
> `packages/controls/src/styles/index.css`에 라이트/다크 모드 공통 스타일 정의.
> `global.css` 토큰도 라이트 모드 기본값 + 다크 모드 오버라이드(`[data-theme="dark"]` / `prefers-color-scheme`) 구조로 재설계 완료.
> `apps/web` Settings에서 테마 선택 시 `document.documentElement`에 `data-theme` 적용 및 localStorage 저장 동작.
> P1 DataTable 구현 완료 — 컬럼 정렬(3단계), 전체 검색, 페이지네이션, 커스텀 셀 렌더링 지원.

## P0 (Core 필수)

| Control | 우선순위 | 1.5 구현상태 | 비고 |
| --- | --- | --- | --- |
| Button | P0 | 완료 | Primary/Secondary/Danger/Ghost, size, loading |
| Input | P0 | 완료 | text/email/number/password, error, helpText |
| Select / ComboBox | P0 | 완료 | single select + placeholder, error |
| Checkbox | P0 | 완료 | 단일/그룹 + indeterminate |
| Radio | P0 | 완료 | RadioGroup |
| Switch / Toggle | P0 | 완료 | on/off + keyboard |
| Modal / Dialog | P0 | 완료 | size(sm/md/lg), ESC 닫기, backdrop 클릭 닫기 |
| Form Field Wrapper | P0 | 완료 | label/help/error/required |
| Alert / Inline Message | P0 | 완료 | success/warning/error/info, onClose |
| Progress | P0 | 완료 | linear + StepProgress |

## P0.5 (핵심 흐름 반복 사용)

| Control | 우선순위 | 1.5 구현상태 | 비고 |
| --- | --- | --- | --- |
| Textarea | P0.5 | 완료 | multi-line, error, helpText |
| Password Input | P0.5 | 완료 | show/hide + strength hint |
| OTP / PIN Input | P0.5 | 완료 | 4~6자리, paste 지원, keyboard 이동 |
| Search Input | P0.5 | 완료 | debounce, clear 버튼 |
| Spinner / Loader | P0.5 | 완료 | blocking overlay / inline |
| Toast / Notification | P0.5 | 완료 | ToastProvider + useToast hook |
| Empty State Block | P0.5 | 완료 | icon, title, description, CTA action |
| Skeleton Loader | P0.5 | 완료 | text(lines) / circular / rect |

## P1 (자주 쓰이지만 일부 우선 구현)

| Control | 우선순위 | 구현상태 | 비고 |
| --- | --- | --- | --- |
| DataTable | P1 | 완료 | 컬럼 정렬(asc/desc/none), 전체 검색, 페이지네이션(10/20/50/100), 커스텀 셀 render, 로딩 스켈레톤 |
| Tabs | P1 | 미착수 | settings/module 화면 분리 |
| Dropdown Menu | P1 | 미착수 | header/user/action menu |
| Tooltip | P1 | 미착수 | helper/explain UX |
| Badge / Tag | P1 | 미착수 | 상태 표기 (active/error 등) |
| Pagination | P1 | 미착수 | 독립 사용 페이지네이션 (DataTable 내장과 별개) |
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
