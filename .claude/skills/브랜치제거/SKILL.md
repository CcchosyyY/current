---
name: 브랜치제거
description: 작업 브랜치 마무리 — 변경 commit → main에 merge(--no-ff) → push(Vercel 배포) → 브랜치 삭제. 단일-폴더(git switch) 워크플로우의 마무리.
user-invocable: true
---

# 브랜치제거 — 작업 브랜치 마무리 & 삭제

## Purpose

작업 브랜치를 main에 합치고 깔끔하게 삭제한다. `브랜치생성`의 짝.

흐름: **commit → main에 merge(--no-ff) → push(Vercel 배포) → 브랜치 삭제**

> 세션 전체 마무리(DID.md/TODO 정리·블로그 발행)는 `작업완료`가 담당. 이 스킬은 **브랜치 하나를 main으로 합치고 지우는 것**에 집중. 둘 다 필요하면 `브랜치제거` 후 `작업완료`.

## When to Run

- 사용자가 "브랜치제거", "/브랜치제거", "이 작업 끝났어 합쳐줘/정리해줘" 라고 할 때
- 한 브랜치 작업을 끝내고 main에 반영할 때

## Workflow

항상 base(`/home/chosangyun/current`)에서 실행.

### Step 0: 대상 브랜치 식별

```bash
cd /home/chosangyun/current
git branch --show-current
```

- **현재 브랜치**가 대상 (인자로 브랜치명을 주면 그걸).
- ⚠️ 대상이 `main`/`master`면 중단·안내 (삭제·머지 금지).
- 그 브랜치가 worktree에 체크아웃돼 있으면(`git worktree list`에 보이면) `git branch -d`가 실패하니, 먼저 그 worktree를 `git worktree remove`. (단일-폴더 워크플로우면 보통 해당 없음.)

### Step 1: 변경사항 commit (대상 브랜치 위에서)

```bash
git status --short
git diff --stat
```

- **clean이면** → 커밋 스킵, Step 2로.
- **변경 있으면**:
  1. 변경 분석 → **한국어 conventional 커밋 메시지** (`feat(scope): …`, `fix(db): …`).
  2. 무엇을 커밋할지 한 줄 요약.
  3. 커밋 (base의 `.claude`는 `.gitignore`로 무시되므로 `git add -A` 안전. `.env*` 등 민감파일도 gitignore라 제외):
     ```
     git add -A
     git commit -m "<type(scope): 설명>" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
     ```

### Step 2: main에 merge

```bash
git switch main
# main이 dirty면 중단·보고 (merge 위험)
[ -n "$(git status --porcelain)" ] && { echo "main에 미커밋 변경 있음 — 먼저 정리 필요"; exit 1; }
git pull --ff-only origin main   # 원격 최신 반영 (실패=diverge면 중단·보고)
git merge --no-ff "$BRANCH" -m "Merge $BRANCH: <한국어 한 줄 설명>"
```

- **merge 충돌 나면** → **자동 해결 금지**. 충돌 파일 보고 + "해결 후 `git commit`, 또는 `git merge --abort`" 안내. 브랜치는 **삭제하지 말고 보존**. 여기서 중단.

### Step 3: push (배포)

```bash
git push origin main
```

⚠️ main push = **프로덕션 배포**(Vercel `current-rho.vercel.app` 자동 배포). "완료"이므로 push까지 하되 리포트에 배포된다는 점 명시.

### Step 4: 브랜치 삭제

```bash
git branch -d "$BRANCH"   # merge됐으니 -d로 삭제. 실패(미머지)면 경고만, -D 강제 금지
git branch                # 남은 브랜치 확인
```

### Step 5: 완료 리포트

```markdown
## 브랜치제거 완료! 🧹

- 커밋: `<hash>` <메시지> (변경 없었으면 "커밋 없음")
- merge: `<branch>` → main (--no-ff)
- push: origin/main ✓ → **Vercel 배포 트리거됨**
- 삭제: 브랜치 `<branch>` ✓

현재 위치: main. 남은 브랜치: <git branch 요약>
```

## Exceptions

1. **대상이 main/master** — 절대 삭제·머지 금지, 안내만.
2. **merge 충돌** — 자동 해결 금지. 보고 후 중단, 브랜치 보존.
3. **main이 dirty / 원격과 diverge** — merge 위험하므로 중단·보고.
4. **`git branch -d` 실패**(미머지) — 강제삭제(`-D`) 금지, 경고만.
5. **브랜치가 worktree에 체크아웃됨** — `git branch -d` 전에 `git worktree remove` 필요.

## 관련

- `브랜치생성` (시작 스킬, 짝)
- `작업완료` (세션 전체 마무리 — DID/TODO/블로그)
- 메모리 `feedback_worktree_workflow.md`, `feedback_work_tracking.md`(커밋 규칙)
