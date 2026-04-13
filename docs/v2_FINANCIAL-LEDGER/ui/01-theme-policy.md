# Fieldstack Theme Policy

> 안정성과 일관성을 우선하는 공식 테마 운영 정책

---

## 1. 목적 (Purpose)

Fieldstack의 테마 시스템은 **자유로운 커스터마이징**보다 **안정성, 일관성, 유지보수 가능성**을 우선합니다.

이를 위해 Fieldstack은 사용자 정의(Custom) 테마를 직접 지원하지 않는 대신,
- 공식 테마
- 시즌 테마
- 콜라보 테마
- 커뮤니티 제안 기반 테마
를 중심으로 검증된 시각적 경험을 제공합니다.

---

## 2. 기본 원칙 (Core Principles)

- 테마는 **UI 구조를 변경하지 않는다**
- 테마는 **레이아웃, 컴포넌트 동작에 영향을 주지 않는다**
- 테마는 **시각적 스킨(Skin)**의 개념으로만 존재한다
- 모든 테마는 Fieldstack 내부 기준에 따라 제작 및 검수된다

> Fieldstack은 디자인 플랫폼이 아닌, **제품(Product)** 입니다.

---

## 3. 테마 유형 (Theme Types)

### 3.1 Core Themes

Fieldstack 기본 제공 테마

- Default Light
- Default Dark
- High Contrast (접근성 고려)

특징:
- 항상 사용 가능
- 시스템 전반의 기준 테마 역할

---

### 3.2 Seasonal Themes

연중 특정 기간에 제공되는 공식 시즌 테마

예시:
- Lunar New Year (설날)
- Spring / Summer
- Halloween
- Christmas

운영 방식:
- 기본값: 자동 적용
- 설정에서 비활성화 가능
- 시즌 종료 후 자동 비활성화 또는 보관

---

### 3.3 Collaboration Themes

크리에이터, 스튜디오, 이벤트 등과의 협업을 통해 제작되는 테마

특징:
- 한정 또는 상시 제공 가능
- Fieldstack 디자인 가이드라인을 반드시 준수
- UI/UX 구조 변경 불가

---

### 3.4 Community-Inspired Themes

사용자 제안을 기반으로 Fieldstack 내부에서 제작되는 공식 테마

- 사용자가 직접 테마를 제작하지 않음
- 아이디어만 제안 가능
- 채택 시 공식 테마로 편입

---

## 4. 지원하지 않는 항목 (Non-Goals)

다음 기능은 지원하지 않습니다:

- 사용자 CSS 직접 적용
- 컴포넌트 단위 스타일 오버라이드
- 테마 마켓플레이스
- 테마 플러그인
- 외부 테마 파일 로드

---

## 5. 사용자 테마 제안 시스템 (Theme Proposal)

### 5.1 제안 목적

커스텀 테마를 직접 지원하지 않는 대신,
사용자가 원하는 테마 방향을 공식적으로 제안할 수 있는 창구를 제공합니다.

---

### 5.2 제안 항목

사용자는 다음 정보만 제출할 수 있습니다:

- Theme Name
- 간단한 설명 (Description)
- 분위기 / 키워드 (Mood, Keywords)
- 색상 방향 제안 (Optional)
- 참고 이미지 또는 레퍼런스 (Optional)

제출 불가 항목:
- 코드
- CSS
- 디자인 파일(Figma 등)

---

### 5.3 검토 상태 (Review Status)

모든 제안은 아래 상태 중 하나를 가집니다:

- Submitted
- Under Review
- Planned
- In Production
- Released
- Not Planned

> 제작 여부 및 일정은 Fieldstack 내부 판단에 따라 결정됩니다.

---

### 5.4 채택 시 크레딧

채택된 테마 제안은 다음 방식으로 크레딧이 제공될 수 있습니다:

- 릴리즈 노트에 제안자 표기
- 테마 정보에 “Community Inspired” 표시
- 기타 상징적 감사 표시

금전적 보상이나 소유권 이전은 제공되지 않습니다.

---

## 6. 테마 제작 가이드라인 (Internal)

모든 테마는 다음 규칙을 따라야 합니다:

- 색상, 배경, 포인트 요소만 변경 가능
- 레이아웃 구조 변경 금지
- 컴포넌트 형태 변경 금지
- 접근성 대비 기준 충족
- 기본 테마 대비 가독성 유지

---

## 7. 설정에서 제공되는 사용자 선택지

사용자는 다음 범위 내에서만 개인화를 할 수 있습니다:

- 공식 테마 선택
- Light / Dark / System(자동) 모드 선택 (테마가 지원하는 경우에 한함)
- 시즌 테마 자동 적용 ON/OFF

> **System(자동)** 은 OS/브라우저의 `prefers-color-scheme` 설정을 따라 Light/Dark를 자동 전환합니다.

> Fieldstack은 **제한된 선택지**를 통해 안정적인 경험을 제공합니다.

---

## 8. 테마 모드 시스템 (Theme Mode System)

### 8.1 구조

테마와 모드는 **독립된 두 축**으로 관리됩니다.

```html
<html data-theme="halloween" data-mode="dark">
```

CSS는 두 축의 조합으로 토큰을 결정합니다:

```css
/* Default Light */
:root { --color-bg: #ffffff; }

/* Default Dark */
[data-mode="dark"] { --color-bg: #0f172a; }

/* Halloween Light */
[data-theme="halloween"] { --color-bg: #1a0a00; --color-primary: #f97316; }

/* Halloween Dark */
[data-theme="halloween"][data-mode="dark"] { --color-bg: #0d0500; }

/* Standalone 전용 테마 (모드 구분 없음) */
[data-theme="collab-x"] { --color-bg: #0a0a1a; --color-primary: #a855f7; }
```

---

### 8.2 테마별 지원 모드 정의

모든 테마는 지원하는 모드 목록(`modes`)을 메타데이터로 선언합니다.

```ts
type ThemeMode = 'light' | 'dark' | 'standalone';
type UserModeSelection = 'light' | 'dark' | 'system' | 'standalone';

type Theme = {
  id: string;
  name: string;
  modes: ThemeMode[];
};
```

---

### 8.3 모드 선택 UI 동작 규칙

| 테마의 `modes` | 설정 UI 동작 |
|---------------|-------------|
| `['light', 'dark']` | 모드 선택 활성화 — **Light / Dark / System(자동)** 선택 가능 |
| `['light']` 또는 `['dark']` | 모드 선택 비활성화 — 해당 모드로 고정, 안내 문구 표시 |
| `['standalone']` | 모드 선택 영역 자체를 숨김 — 테마 자체가 고유한 시각 경험 |

> **System(자동)** 은 `prefers-color-scheme` 미디어 쿼리를 기반으로 동작하며,
> 라이트/다크를 모두 지원하는 테마(`['light', 'dark']`)에서만 선택 가능합니다.
>
> `standalone` 테마는 라이트/다크 어느 쪽으로도 분류되지 않는 전용 테마입니다.
> 콜라보 테마, 특정 이벤트 전용 테마 등이 이 유형에 해당할 수 있습니다.

---

### 8.4 테마 예시

| 테마 | modes | 비고 |
|------|-------|------|
| Default | `['light', 'dark']` | 기본 제공, 항상 사용 가능 |
| High Contrast | `['light', 'dark']` | 접근성 기준 충족 |
| Halloween | `['light', 'dark']` | 시즌 테마 |
| Christmas | `['dark']` | 다크 전용 시즌 테마 |
| Collab-X | `['standalone']` | 전용 시각 경험, 모드 구분 없음 |

---

## 10. 정책 요약

- Fieldstack은 사용자 정의 테마를 직접 지원하지 않습니다
- 테마는 공식적으로만 제공됩니다
- 유저는 테마 아이디어를 제안할 수 있습니다
- 최종 제작 여부는 내부 검토를 통해 결정됩니다
- 일관성과 유지보수가 최우선 가치입니다

---

## 11. 철학 한 줄 요약

> 자유를 무제한으로 제공하는 대신 책임을 나누는 것이 아니라,
> 책임질 수 있는 범위 안에서 최고의 품질을 제공합니다.
