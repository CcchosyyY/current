---
name: 작업준비
description: 세션 시작 자동화 — Chrome 탭 열기, dev 서버 시작, git 상태 확인, TODO 요약. 작업 시작 시 사용.
user-invocable: true
---

# 작업준비 — 세션 시작 자동화

## Purpose

작업 세션 시작 시 개발 환경을 자동으로 셋업하고 현재 상태를 브리핑:

1. **Chrome 탭 열기** — 필요한 웹 페이지 일괄 오픈
2. **Dev 서버 시작** — `npm run dev` 백그라운드 실행
3. **Git 상태 확인** — 미커밋 변경사항, 현재 브랜치 알림
4. **TODO 브리핑** — TODO.md에서 높은 우선순위 항목 요약

## When to Run

- 작업 세션을 시작할 때
- 사용자가 "작업준비"를 입력했을 때

## Workflow

### Step 1: Chrome 탭 열기

```bash
"/mnt/c/Program Files/Google/Chrome/Application/chrome.exe" \
  "https://claude.ai" \
  "https://vercel.com/cho-sang-yuns-projects/jyosblog" \
  "https://supabase.com/dashboard/project/eshgriacghldbvaezpat" \
  "http://localhost:3001" &>/dev/null &
```

### Step 2: Dev 서버 시작

dev 서버가 이미 실행 중인지 확인 후 시작:

```bash
# 포트 3001이 사용 중인지 확인
if lsof -i :3001 &>/dev/null; then
  echo "Dev 서버가 이미 실행 중입니다 (port 3001)"
else
  cd ~/MyBlog && PORT=3001 npm run dev &
fi
```

### Step 3: Git 상태 확인

```bash
git status
git log --oneline -5
```

다음을 사용자에게 보고:
- 현재 브랜치
- 미커밋 변경사항 유무 (있으면 파일 목록)
- 최근 커밋 5개

### Step 4: TODO 브리핑

`/home/chosangyun/MyBlog/TODO.md`를 읽고:
- **높은 우선순위** 미완료 항목(`- [ ]`) 전부 나열
- **중간 우선순위** 미완료 항목 중 상위 3개만 나열

### Step 5: 완료 리포트

```markdown
## 작업준비 완료!

### 환경
- Chrome: 4개 탭 오픈
- Dev 서버: localhost:3001 ✓

### Git 상태
- 브랜치: main
- 미커밋 변경: 없음 / N개 파일

### 오늘 할 일 (높은 우선순위)
- [ ] 항목1
- [ ] 항목2
- ...
```

## Related Files

| File | Purpose |
|------|---------|
| `TODO.md` | 할 일 목록 |
| `DID.md` | 완료 작업 기록 |

## Exceptions

1. **Chrome 실행 실패** — WSL에서 Windows Chrome 경로가 다를 수 있음. 실패해도 나머지 단계 계속 진행
2. **Dev 서버 이미 실행 중** — 중복 실행하지 않고 스킵
3. **TODO.md 없음** — 파일이 없으면 브리핑 스킵
