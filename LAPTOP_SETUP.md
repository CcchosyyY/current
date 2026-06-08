# 노트북(또는 새 머신)에서 이 프로젝트 + Claude Code 환경 그대로 쓰기

`git clone`만으로는 안 따라오는 것들이 있다. 아래 순서대로 하면 데스크톱과 동일하게 동작한다.

> 전제: 새 머신도 **WSL2 + 홈 디렉토리 `/home/chosangyun`** 이라고 가정한다.
> 계정명이 다르면 아래 `chosangyun` 경로와 `~/.claude/settings.json`의 statusLine 절대경로를 새 경로로 바꿀 것.

---

## 0. 사전 준비 (새 머신)
- [ ] **Node 24 + npm** (`node -v` → v24.x, `npm -v` → 11.x)
- [ ] **Claude Code** 설치 + `claude login` (★ **데스크톱과 같은 계정**)
      → 로그인만 하면 claude.ai 커넥터(Figma·Gmail·Calendar·Drive·Notion·Supabase)는 자동으로 따라온다.
- [ ] git

## 1. 레포 클론
```bash
git clone <이 저장소 URL> ~/current
cd ~/current
npm install
```
이걸로 따라오는 것: **코드 전체, 프로젝트 CLAUDE.md(포트 3003 규칙), `.claude/skills/`(커스텀 스킬 9개), `.env.example`**.

## 2. git으로 안 오는 파일 복사 (★ 핵심)
아래 6종은 gitignore이거나 레포 밖(홈 디렉토리)이라 **수동 복사**해야 한다.

### (A) 데스크톱에서 한 번에 묶기
데스크톱(기존 머신)에서 실행 → `claude-portable.tar.gz` 생성:
```bash
cd ~
tar czf claude-portable.tar.gz \
  current/.env.local \
  .claude/CLAUDE.md \
  .claude/settings.json \
  .claude/status.sh \
  .claude/wt.sh \
  .claude/projects/-home-chosangyun-current/memory
```
> `~/.profile`의 토큰 줄은 보안상 tar에 안 넣음 → 아래 (C)에서 따로 옮긴다.

### (B) 새 머신에서 풀기
`claude-portable.tar.gz`를 새 머신 `~`로 옮긴 뒤:
```bash
cd ~
tar xzf claude-portable.tar.gz
```
풀리는 위치:
| 파일 | 역할 |
|---|---|
| `~/current/.env.local` | Supabase URL/anon, `ANTHROPIC_API_KEY`, `SUPABASE_SECRET_KEY` — 앱·크롤러·LLM 분류 |
| `~/.claude/CLAUDE.md` | 전역 규칙(WSL2·한국어·Puppeteer) |
| `~/.claude/settings.json` | 권한·effortLevel·theme·statusLine·**MCP 서버 11개** |
| `~/.claude/status.sh`, `wt.sh` | statusLine / worktree 스크립트 |
| `~/.claude/projects/.../memory/` | 누적 메모리(선택) |

### (C) MCP 토큰 (`~/.profile`)
데스크톱 `~/.profile`에서 아래 3줄을 찾아 **새 머신 `~/.profile`에 복사**한 뒤 `source ~/.profile`:
```bash
export GITHUB_PERSONAL_ACCESS_TOKEN=...   # github MCP
export FIGMA_API_KEY=...                  # figma MCP
export SUPABASE_ACCESS_TOKEN=...          # supabase MCP
```
> 없으면 해당 MCP만 인증 실패하고 나머지는 정상 동작.

## 3. (선택) pencil MCP — 디자인 작업할 때만
`.pen` 디자인 파일 편집용. 디자인을 안 건드리면 생략 가능.
데스크톱 `~/.claude.json`의 `mcpServers.pencil` 항목을 새 머신 `~/.claude.json`에 동일하게 추가하거나, pencil을 다시 설치/등록한다.
> `current.pen` 자체도 gitignore라 따로 복사해야 함.

## 4. 동작 확인
```bash
cd ~/current
npm run dev -- -p 3003       # → http://localhost:3003 (포트 3003 고정)
```
Claude Code 안에서:
- `/skills` → 브랜치생성·브랜치제거·작업실행·작업완료·작업준비 + verify류가 보이면 OK
- 하단 statusLine이 데스크톱처럼 뜨면 OK (안 뜨면 settings.json의 status.sh 절대경로 확인)

---

## ⚠️ 알려진 제약 / 차이
- **Puppeteer 브라우저 자동화**: WSL2에선 Windows Chrome 디버그 포트 접근 불가 → 데스크톱과 **동일하게 제약**. (전역 CLAUDE.md 규칙대로 `mcp__puppeteer__*` 사용, `chrome-devtools` MCP는 WSL2에서 미동작.) 새 머신이 네이티브 Windows/Mac이면 오히려 더 쉬울 수 있음.
- **대화/세션 히스토리**: 로컬이라 안 따라옴 → 새 머신에서 "이어서 대화"는 안 됨(작업엔 영향 없음).
- **statusLine 절대경로**: `settings.json`이 `/home/chosangyun/.claude/status.sh`를 가리킴 → 계정명이 다르면 그 경로만 수정.

## 한 줄 요약
`git clone` + `npm install` + (A)(B)(C) tar 복사 + `claude login` = 데스크톱과 동일.
