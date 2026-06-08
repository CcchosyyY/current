---
name: uitest
description: "Compare Pencil design vs live deployed UI, find differences, and auto-fix code. Use when checking UI consistency. Supports page: argument to target specific Pencil frames."
argument-hint: "[page:<pencil-frame-name>]"
---

# Pencil Design vs Live UI Comparison & Auto-Fix

## Purpose

Pencil 디자인 파일(`pencil/Main.pen`)과 Puppeteer를 이용해 배포된 실제 웹사이트의 **모든 UI 페이지**를 비교하여:

1. **시각적 차이** 발견 (Puppeteer 스크린샷 vs Pencil 디자인 스크린샷 비교)
2. **속성 레벨 차이** 발견 (색상, 간격, 타이포그래피, 레이아웃 등)
3. **차이점 보고서** 생성
4. **사용자 확인 후 코드 자동 수정**

> **범위**: 사이트 전체의 모든 UI 페이지를 대상으로 함. Main.pen에 디자인된 모든 페이지가 검증 대상.

## When to Run

- UI 구현 후 디자인 일치 여부를 확인할 때
- Pencil 디자인 업데이트 후 코드 반영이 필요할 때
- 디자인 QA/리뷰 시
- 배포 전 디자인 일관성 검증 시

## Arguments

스킬 실행 시 인자를 전달하여 비교 범위를 좁힐 수 있다.

### Syntax

```
/uitest                              # 인자 없음 → 모든 기본 대상 페이지 비교
/uitest page:<pencil-name>           # 특정 Pencil 프레임/페이지 이름으로 비교
/uitest page:<name1>,<name2>         # 여러 Pencil 프레임을 콤마로 구분하여 비교
```

### `page:` Argument

Pencil 디자인 파일 내의 프레임/컴포넌트 이름을 지정한다. 이 이름은 `pencil > batch_get`의 patterns 검색어로 사용된다.

**예시:**

| 명령어 | 동작 |
|--------|------|
| `/uitest page:home-dark` | Pencil에서 `home-dark` 이름의 프레임을 찾아 라이브 사이트와 비교 |
| `/uitest page:home-light` | `home-light` 프레임만 비교 |
| `/uitest page:blog-detail` | `blog-detail` 프레임만 비교 |
| `/uitest page:home-dark,home-light` | 두 프레임을 순차 비교 |
| `/uitest page:header` | `header` 컴포넌트만 비교 |

**이름 매칭 규칙:**
- 대소문자 구분 없이 매칭 (case-insensitive)
- 부분 매칭 지원: `home`을 넘기면 `home-dark`, `home-light` 등 `home`이 포함된 모든 프레임 매칭
- 정확한 매칭을 원하면 전체 이름을 입력 (e.g., `page:home-dark`)
- 매칭 결과가 0개이면 → 사용 가능한 프레임 목록을 보여주고 사용자에게 재선택 요청
- 매칭 결과가 너무 많으면 (5개 초과) → 목록을 보여주고 사용자에게 좁혀달라고 요청

## Default Comparison Targets

인자 없이 실행 시 사용하는 기본 비교 대상 페이지.

| Page | URL Path | Pencil Counterpart |
|------|----------|--------------------|
| Home (Post List) | `/` | Main page frame |
| Blog Detail | `/blog/[slug]` | Blog detail frame |
| About | `/about` | About frame |
| Memos | `/memos` | Memos page frame |

## Related Files

| File | Purpose |
|------|---------|
| `pencil/Main.pen` | Design source (Pencil MCP only) |
| `app/globals.css` | CSS variable definitions (theme colors) |
| `app/page.tsx` | Home page |
| `app/blog/[slug]/page.tsx` | Blog detail page |
| `app/about/page.tsx` | About page |
| `app/layout.tsx` | Root layout |
| `components/Header.tsx` | Navigation header |
| `components/Footer.tsx` | Footer |
| `components/PostCard.tsx` | Post card component |
| `components/SearchBar.tsx` | Search bar |
| `components/CategorySidebar.tsx` | Category sidebar |
| `components/TableOfContents.tsx` | Table of contents |
| `components/ThemeToggle.tsx` | Dark mode toggle |
| `app/memos/page.tsx` | Memos page (Server Component) |
| `app/memos/MemoList.tsx` | Memo list with CRUD (Client Component) |

## Workflow

### Step 0: Argument Parsing & Target Resolution

Parse the optional argument to determine comparison scope.

#### 0a. Parse Arguments

Extract `page:` argument from the skill invocation:

- **No argument** → Use all pages in the **Default Comparison Targets** table
- **`page:<name>`** → Parse `<name>` as the Pencil target (comma-separated for multiple)

```
Input: "/uitest page:home-dark"
Parsed: targets = ["home-dark"]

Input: "/uitest page:home-dark,blog-detail"
Parsed: targets = ["home-dark", "blog-detail"]

Input: "/uitest"
Parsed: targets = [] (use defaults)
```

#### 0b. Resolve Pencil Targets

Use `pencil > batch_get` with patterns to search for matching frames/components:

1. For each parsed target name, search in Pencil:
   ```
   pencil > batch_get(patterns: ["<target-name>"])
   ```
2. Collect all matching nodes (case-insensitive, partial match supported)

**Handling edge cases:**

- **0 matches**: Display available frames/pages from Pencil and use `AskUserQuestion` to let the user pick:
  ```markdown
  `<target-name>` 와 일치하는 Pencil 프레임을 찾을 수 없습니다.

  사용 가능한 프레임 목록:
  - frame-name-1
  - frame-name-2
  - ...

  어떤 프레임을 비교하시겠습니까?
  ```

- **Too many matches (>5)**: Show the list and ask the user to narrow down:
  ```markdown
  `<target-name>` 검색 결과가 N개로 너무 많습니다:
  - match-1
  - match-2
  - ...

  더 구체적인 이름을 입력해주세요.
  ```

- **1~5 matches**: Proceed with all matches. Display resolved targets:
  ```markdown
  ## Comparison Targets Resolved

  | # | Pencil Frame | Matched Name |
  |---|-------------|--------------|
  | 1 | home-dark   | home-dark    |
  ```

#### 0c. Map Pencil Targets to Live URLs

For each resolved Pencil frame, determine the corresponding live URL to capture.

**Auto-mapping rules** (by frame name pattern):

| Frame Name Contains | URL Path | Theme |
|--------------------|----------|-------|
| `home` | `/` | - |
| `blog-detail` or `blog` | `/blog/[first-available-slug]` | - |
| `about` | `/about` | - |
| `-dark` suffix | Same URL, force dark mode | `dark` |
| `-light` suffix | Same URL, force light mode | `light` |

- If the frame name contains `-dark`, apply dark mode via `chrome-devtools > evaluate_script` (set `document.documentElement.classList` or `data-theme` attribute) before taking screenshots
- If the frame name contains `-light`, ensure light mode is active
- If no URL can be auto-mapped, use `AskUserQuestion` to ask the user for the URL

Display the final target plan before proceeding:

```markdown
## Target Plan

| # | Pencil Frame | Live URL | Theme | Status |
|---|-------------|----------|-------|--------|
| 1 | home-dark   | `/`      | dark  | Ready  |
```

### Step 1: Pencil Design Information Collection

Collect design tokens, structure, and screenshots from the Pencil design file.
**Scope:** Only collect information for the targets resolved in Step 0.

#### 1a. Extract Design Variables

Use `pencil > get_variables` to extract CSS variables (colors, spacing, fonts, etc.).

Record all design tokens for comparison.

#### 1b. Explore Design Tree

Use `pencil > batch_get` with the resolved target node IDs from Step 0:

- Read the full subtree of each target frame
- Identify child components and their properties
- Record reusable atomic components (`reusable: true`) used within the target
- Record the design tree structure and component hierarchy

#### 1c. Capture Design Screenshots

Use `pencil > get_screenshot` for each resolved target frame and its major child components.

Save/display screenshots for visual comparison in Step 3.

### Step 2: Live Site UI Capture

Capture the deployed site using Chrome DevTools and Puppeteer for cross-verification.
**Scope:** Only capture pages/URLs resolved in Step 0c.

#### 2a. Chrome DevTools — Primary Capture

1. Use `chrome-devtools > new_page` to open a browser
2. For each target from Step 0c:
   - `chrome-devtools > navigate_page` to `https://jyos-blog.vercel.app/<mapped-path>`
   - **If target requires dark/light mode:** Use `chrome-devtools > evaluate_script` to set the theme before capturing:
     ```javascript
     // Force dark mode
     document.documentElement.setAttribute('data-theme', 'dark');
     document.documentElement.classList.add('dark');
     // Force light mode
     document.documentElement.setAttribute('data-theme', 'light');
     document.documentElement.classList.remove('dark');
     ```
     Wait briefly for theme transition to complete.
   - `chrome-devtools > take_screenshot` for full page and element-level screenshots
   - `chrome-devtools > take_snapshot` for accessibility tree (element uid mapping)
   - `chrome-devtools > evaluate_script` to extract computed styles via `getComputedStyle()`:
     - Background colors, text colors
     - Padding, margin, gap
     - Font size, font weight, font family
     - Border radius
     - Flex direction, align-items, justify-content

#### 2b. Puppeteer — Cross-Verification

1. `puppeteer > puppeteer_navigate` to the same pages
2. `puppeteer > puppeteer_screenshot` for the same areas
3. `puppeteer > puppeteer_evaluate` to extract the same style values
4. Compare Puppeteer results with Chrome DevTools results to ensure measurement accuracy

If results differ between the two tools, flag the discrepancy and use the more reliable measurement.

### Step 3: Comparison Analysis

Perform both visual and property-level comparison.

#### 3a. Visual Comparison

Use Claude's multimodal capabilities to compare:
- Pencil design screenshots (from Step 1c) vs live site screenshots (from Step 2a/2b)
- Identify visible differences in layout, spacing, colors, typography, and component appearance

#### 3b. Property-Level Comparison

Compare specific design attributes between Pencil and live site:

| Property Category | Pencil Attribute | CSS Property |
|-------------------|-----------------|--------------|
| Colors | `fill`, `color` | `background-color`, `color` |
| Spacing | `padding`, `gap`, `margin` | `padding`, `gap`, `margin` |
| Typography | `fontSize`, `fontWeight`, `fontFamily` | `font-size`, `font-weight`, `font-family` |
| Corners | `cornerRadius` | `border-radius` |
| Layout | `layout direction`, `alignment` | `flex-direction`, `align-items`, `justify-content` |
| Sizing | `width`, `height` | `width`, `height` |

#### 3c. Build Difference List

Compile all differences into a structured list for the report.

### Step 4: Difference Report & User Confirmation & Code Fix

#### 4a. Display Difference Report

Output a table of all differences found:

```markdown
## UI Difference Report

### Visual Comparison Summary

[Summary of visual differences observed from screenshot comparison]

### Property-Level Differences

| # | Component | Property | Pencil Value | Actual Value | Target File |
|---|-----------|----------|--------------|--------------|-------------|
| 1 | Header | background-color | #FFFFFF | #F5F5F5 | components/Header.tsx |
| 2 | PostCard | border-radius | 8px | 4px | components/PostCard.tsx |
| 3 | ... | ... | ... | ... | ... |

### Files to Modify

- `app/globals.css` — CSS variable updates
- `components/Header.tsx` — Tailwind class changes
- ...
```

#### 4b. User Confirmation

Use `AskUserQuestion` to let the user choose:

1. **Fix all** — Apply all recommended fixes automatically
2. **Select individually** — Review and select which differences to fix
3. **Skip** — Exit without changes

#### 4c. Apply Code Fixes (after confirmation)

For each approved fix:

1. Check the exact attribute value from the Pencil **Atomic component (`reusable: true`)**
2. Find the corresponding React component file (`components/*.tsx`, `app/**/*.tsx`)
3. For CSS variable differences → Edit `app/globals.css`
4. For Tailwind class differences → Edit the component file

**Rules:**
- Follow the project's CSS variable-based theming convention (no direct color values like `text-gray-500`)
- Use Tailwind utility classes only (no CSS modules)
- Preserve existing `dark:` prefix usage pattern (CSS variables auto-switch, only `prose` uses `dark:prose-invert`)

### Step 5: Post-Fix Verification

#### 5a. Re-capture

After fixes are applied:
- If dev server is running, capture screenshots from `localhost:3000`
- Otherwise, run `npm run build` to verify the build succeeds

#### 5b. Re-compare

Take new screenshots and compare with Pencil design again.

#### 5c. Final Report

```markdown
## Post-Fix Verification Report

### Changes Applied

| # | File | Change Description | Status |
|---|------|--------------------|--------|
| 1 | `app/globals.css` | Updated --color-primary variable | Applied |
| 2 | `components/Header.tsx` | Changed padding from p-4 to p-6 | Applied |

### Before / After Comparison

[Visual comparison showing improvement]

### Remaining Differences

[List any differences that still remain, if any]
```

---

## Exceptions

The following are **not problems**:

1. **Admin pages** — `/admin/*` pages are not designed in Pencil and should be skipped
2. **Dynamic content differences** — Different post titles, dates, or content between design mockup and live site are expected
3. **Responsive breakpoint variations** — Minor differences at different viewport sizes are acceptable if the design only specifies one breakpoint
4. **Browser-specific rendering** — Sub-pixel differences in font rendering across browsers
5. **Animation/transition states** — Hover states, transitions, and animations may not match static screenshots
6. **Third-party widget styling** — External embeds or widgets not controlled by the project
