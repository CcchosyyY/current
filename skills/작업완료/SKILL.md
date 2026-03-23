---
name: 작업완료
description: 세션 마무리 자동화 — git commit/push, DID.md/TODO.md 업데이트, 개발일지 블로그 발행
user-invocable: true
---

# 작업완료

세션 마무리 시 변경사항을 정리하고 기록을 남깁니다.

---

## Step 1. Git commit + push

프로젝트 루트에서 실행합니다.

1. `git status`와 `git diff --stat`으로 변경사항을 파악합니다.
2. **변경사항이 없으면** (clean working tree) → 커밋을 건너뛰고 Step 2로 이동합니다.
3. 민감 파일 (`.env*`, 크리덴셜 등)은 제외하고 `git add` 합니다.
4. 변경 내용을 분석하여 커밋 메시지를 생성합니다.
   - 형식: `feat:`, `fix:`, `chore:` 등 conventional commit + 한국어 설명
   - 하나의 커밋으로 묶습니다 (세션 단위 커밋)
5. `git push origin <현재브랜치>`

push 실패 시 사용자에게 보고합니다.

---

## Step 2. DID.md + TODO.md 업데이트

DID.md와 TODO.md를 **동시에** 업데이트합니다.

### DID.md

`DID.md`의 **최상단**(제목 바로 아래)에 오늘 날짜 섹션을 추가합니다.
DID.md가 없으면 새로 생성합니다.

**작성 소스**: 세션 대화 내용 + Git 변경사항 + TODO.md

```markdown
## YYYY-MM-DD — [작업 제목 요약]

### 완료 항목
- 완료한 작업 목록

### 변경 사항

| 영역 | 변경 내용 |
|------|-----------|
| 결제 API | 빌링키 발급, 구독, 해지 4종 추가 |
| 프론트엔드 | 결제 페이지 3개 + 랜딩 페이지 분리 |

### 아키텍처 노트
- 주요 설계 결정 (있을 경우에만)
```

- **변경 사항은 영역별 그룹핑**으로 축약 (파일 하나하나 나열하지 않음)
- 같은 날짜 섹션이 이미 있으면 **기존 섹션에 병합**
- **최근 3개 날짜 항목만 유지**, 4번째 이후는 삭제 (블로그에 이미 발행됨)

### TODO.md

1. **완료 항목 삭제**: 이번 세션 + 이전에 이미 완료된 항목 모두 제거
2. **`[x]` 항목 제거**: 체크된 항목도 삭제
3. **새 할 일 추가**: 작업 중 발견된 TODO 추가
4. **최종 업데이트 날짜** 갱신
5. **미완료 항목만** 남김

---

## Step 3. 블로그 개발일지 발행

DID.md의 오늘 섹션을 **기반으로** 블로그 글을 작성합니다.

### 작성 원칙

DID.md를 그대로 복사하지 않습니다. **읽는 사람이 흥미를 느낄 수 있도록** 재구성합니다:

- **분량**: 400~800자 내외. 너무 짧지도, 길지도 않게
- **톤**: 개발자 동료에게 설명하듯이. 딱딱한 보고서가 아닌 편한 문체
- **구조**: 배경(왜 했는지) → 핵심 작업(어떻게 했는지) → 배운 점/삽질 → 다음 할 일
- **코드**: 핵심 로직이 있으면 5줄 이내로만. 없으면 안 넣어도 됨
- **변경 파일 리스트**: 블로그에는 넣지 않음

### MDX 콘텐츠

```mdx
---
title: "개발일지 YYYY-MM-DD — [제목]"
category: dev
---

## 오늘 한 일

[배경 + 핵심 작업. 왜 이걸 했고, 어떻게 해결했는지]

## 배운 점

[삽질했거나, 기술적으로 흥미로웠던 부분. 없으면 생략]

## 다음 할 일

[TODO.md 높은 우선순위 2~3개]
```

### 발행

```bash
source ~/.env.blog

curl -s -X POST "${BLOG_SUPABASE_URL}/rest/v1/posts" \
  -H "apikey: ${BLOG_SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Authorization: Bearer ${BLOG_SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{
    "title": "개발일지 YYYY-MM-DD — 제목",
    "slug": "devlog-YYYY-MM-DD",
    "content": "<MDX 콘텐츠>",
    "description": "한줄 요약",
    "category": "dev",
    "tags": ["devlog", "<프로젝트명>"],
    "project_id": "<프로젝트 ID>",
    "status": "published",
    "published_at": "YYYY-MM-DDT00:00:00.000Z"
  }'
```

- `project_id`와 `tags`는 현재 프로젝트에 맞게 설정 (CLAUDE.md 참고)
- 블로그 확인: `https://jyos-blog.vercel.app/blog/{slug}`
- 실패 시 에러 보고 후 다음 단계로 (블로킹하지 않음)
- slug 중복 시 `-2` 등 suffix 추가

---

## Step 4. 문서 커밋 + push

```bash
git add DID.md TODO.md
git commit -m "docs: DID.md/TODO.md 업데이트 (YYYY-MM-DD)

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
git push origin <현재브랜치>
```

---

## Step 5. 완료 리포트

간결하게 보고합니다.

```
## 작업완료

- 커밋: abc1234 "feat: ..." → pushed
- DID.md: YYYY-MM-DD 섹션 추가
- TODO.md: N건 삭제, N건 추가
- 블로그: https://jyos-blog.vercel.app/blog/devlog-YYYY-MM-DD
```
