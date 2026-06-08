---
name: 브랜치생성
description: 새 작업 브랜치 자동 생성 — 작업 맥락에서 이름을 알아서 짓고 main에서 분기해 git switch. base 한 폴더에서 작업하는 단일-폴더 워크플로우용.
user-invocable: true
---

# 브랜치생성 — 작업 브랜치 자동 생성

## Purpose

새 작업을 격리된 브랜치에서 시작한다. **main(base) 폴더 한 곳**에서 `git switch`로 브랜치만 갈아끼우는 단일-폴더 워크플로우. (worktree 안 씀 — 진짜 동시 병렬이 필요할 때만 별도로 worktree.)

`브랜치제거`(마무리)의 짝.

## When to Run

- 사용자가 "브랜치생성", "/브랜치생성", "새 브랜치 파줘", "이 작업 브랜치 만들어줘" 라고 할 때
- 새 기능/수정을 시작할 때

## Workflow

항상 base(`/home/chosangyun/current`)에서 실행.

### Step 1: 사전 점검

```bash
cd /home/chosangyun/current
git branch --show-current
git status --short
```

- **미커밋 변경이 있으면**: 새 작업 시작 전에 처리 방법 확인.
  - 이미 손댄 변경을 그대로 새 브랜치로 가져가려면 → 그냥 `git switch -c`(미커밋 변경을 새 브랜치로 들고 감).
  - main을 깨끗이 두고 분기하려면 → 먼저 커밋/stash 후 분기.
- 분기 기준은 **main**이 기본. 현재 다른 feature 브랜치 위라면 "main에서 딸까, 여기서 딸까" 한 줄 확인(기본 main).

### Step 2: 이름 결정 (`<name>` + `<prefix>`)

1. **인자/이름을 줬으면** → slugify (소문자, 공백·`_`→`-`, 영숫자·`-`만, 한국어면 짧게 영역).
2. **없으면** → 지금 작업 맥락에서 **1~3 단어 영어 kebab-case** 이름을 직접 만든다.
3. **맥락이 없으면** → "무슨 작업이에요?" 한 줄 질문.

**prefix**(작업 성격, 기본 `feat`): `feat`·`fix`·`refactor`·`perf`·`chore`·`docs`
→ 브랜치 = `<prefix>/<name>`

만들기 전에 한 줄 통지: 예) "`feat/search-perf` 브랜치 만들게요."

### Step 3: 생성

```bash
# main에서 깨끗하게 분기 (기본)
git switch main && git switch -c "<prefix>/<name>"
# 또는 현재 작업물을 들고 새 브랜치로
git switch -c "<prefix>/<name>"
```

충돌 가드: 같은 브랜치가 이미 있으면 만들지 말고 `<name>-2` 식 대안 제시.

### Step 4: 완료 리포트

```markdown
## 브랜치 생성 완료! 🌿

- 브랜치: `<prefix>/<name>` (main에서 분기)
- 현재 여기에 체크아웃됨

이제 여기서 작업하고, 끝나면 `/브랜치제거`로 main에 합치고 정리.
```

## Exceptions

1. **다른 브랜치 위에서 호출** — 기본은 main에서 분기. 사용자가 현재 브랜치 기준을 원하면 그대로.
2. **미커밋 변경 존재** — 새 브랜치로 들고 갈지 / main을 깨끗이 둘지 확인 후 진행.
3. **이름 충돌** — 막고 대안 이름.

## 관련

- `브랜치제거` (마무리 스킬, 짝)
- `작업완료` (세션 전체 마무리 — DID/TODO/블로그)
- 메모리 `feedback_worktree_workflow.md`(워크플로우 변천), `feedback_work_tracking.md`(커밋 규칙)
