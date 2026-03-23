---
name: verify-backend
description: "Verify backend security patterns, auth flow, and Supabase error handling. Use after modifying API routes, auth, or lib utilities."
---

# Backend Security & Pattern Verification

## Purpose

1. **API 인증 검증** - 보호 엔드포인트에 `isAuthenticated()` 호출 여부
2. **비밀번호 비교 보안** - timing-safe comparison 사용 여부
3. **Supabase 에러 처리** - try-catch + null/empty 반환 패턴 준수
4. **입력 유효성 검사** - API 라우트에서 요청 body 검증
5. **쿠키 보안** - httpOnly, secure, sameSite 설정

## When to Run

- API 라우트 (`app/api/**/route.ts`) 수정 후
- `lib/auth.ts` 또는 인증 관련 코드 변경 후
- Supabase 함수 (`lib/*.ts`) 추가/수정 후
- `middleware.ts` 변경 후
- 보안 관련 코드 리뷰 시

## Related Files

| File | Purpose |
|------|---------|
| `app/api/admin/login/route.ts` | Admin login/logout API |
| `app/api/posts/route.ts` | Posts CRUD API |
| `app/api/quick-memos/route.ts` | Quick memos CRUD API |
| `lib/auth.ts` | Session management (create/verify/delete) |
| `lib/supabase.ts` | Supabase client singleton |
| `lib/posts.ts` | Post CRUD functions |
| `lib/quick-memos.ts` | Quick memo CRUD functions |
| `lib/categories.ts` | Category definitions + async CRUD |
| `lib/settings.ts` | Blog settings CRUD functions |
| `lib/suggest-category.ts` | Category suggestion |
| `app/api/admin/settings/route.ts` | Blog settings API (GET, PUT) |
| `app/api/admin/categories/route.ts` | Categories management API (GET, POST, PUT, DELETE) |
| `middleware.ts` | Admin route protection |

## Workflow

### Step 1: Verify API Authentication Guards

**Check:** All mutation endpoints (POST, PUT, DELETE) in admin-related routes must call `isAuthenticated()`.

**Tool:** Grep

```
Pattern: "isAuthenticated"
Path: app/api/
Glob: "**/route.ts"
```

**PASS:** Every admin API route file contains `isAuthenticated()` call for protected operations.
**FAIL:** An admin route has POST/PUT/DELETE handlers without `isAuthenticated()` check.

**Fix:** Add `if (!(await isAuthenticated())) { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }` at the start of the handler.

### Step 2: Verify Timing-Safe Password Comparison

**Check:** Password comparison in login route must use `crypto.timingSafeEqual`, never `===` or `==`.

**Tool:** Grep

```
Pattern: "timingSafeEqual"
Path: app/api/admin/login/route.ts
```

**PASS:** `crypto.timingSafeEqual` is used for password comparison.
**FAIL:** Direct `===` or `==` comparison found for password matching.

**Additional check:** Verify `ADMIN_PASSWORD` undefined guard exists:

```
Pattern: "!adminPassword"
Path: app/api/admin/login/route.ts
```

**PASS:** Guard against undefined `ADMIN_PASSWORD` exists.
**FAIL:** Missing undefined check allows bypass when env var is unset.

**Fix:** Use `safeCompare()` function with `crypto.timingSafeEqual` and add `!adminPassword` guard.

### Step 3: Verify Supabase Error Handling Pattern

**Check:** All Supabase functions in `lib/` must follow try-catch + null/empty return pattern.

**Tool:** Grep

```
Pattern: "try {"
Path: lib/
Glob: "*.ts"
```

Cross-check against functions that call `supabase.from()`:

```
Pattern: "supabase\\.from\\("
Path: lib/
Glob: "*.ts"
```

**PASS:** Every function calling `supabase.from()` is wrapped in try-catch.
**FAIL:** A Supabase call exists outside try-catch.

**Fix:** Wrap in try-catch, return null/empty array on error, log with `console.error`.

### Step 4: Verify Cookie Security Settings

**Check:** Session cookie must be set with httpOnly, secure, sameSite: strict.

**Tool:** Read `lib/auth.ts`, find `cookieStore.set` call.

```
Pattern: "httpOnly.*true"
Path: lib/auth.ts
```

```
Pattern: "sameSite.*strict"
Path: lib/auth.ts
```

**PASS:** All three security attributes are present and correctly set.
**FAIL:** Missing or incorrect cookie security attribute.

**Fix:** Ensure `{ httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict' }`.

### Step 5: Verify Middleware Coverage

**Check:** Middleware must protect `/admin/*` routes.

**Tool:** Read `middleware.ts`, verify matcher config.

```
Pattern: "/admin"
Path: middleware.ts
```

**PASS:** Middleware matcher includes `/admin/:path*`.
**FAIL:** Admin routes are not covered by middleware.

**Fix:** Add `/admin/:path*` to middleware matcher config.

### Step 6: Verify Input Validation on API Routes

**Check:** API routes accepting JSON body must validate input before processing.

**Tool:** Grep for `request.json()` calls and verify they are inside try-catch.

```
Pattern: "request\\.json\\(\\)"
Path: app/api/
Glob: "**/route.ts"
```

**PASS:** All `request.json()` calls are wrapped in try-catch with proper error responses.
**FAIL:** Raw `request.json()` without error handling.

**Fix:** Wrap in try-catch, return 400 status on parse failure.

## Output Format

```markdown
## Backend Verification Report

| # | Check | Status | Details |
|---|-------|--------|---------|
| 1 | API Auth Guards | PASS/FAIL | ... |
| 2 | Timing-Safe Password | PASS/FAIL | ... |
| 3 | Supabase Error Handling | PASS/FAIL | ... |
| 4 | Cookie Security | PASS/FAIL | ... |
| 5 | Middleware Coverage | PASS/FAIL | ... |
| 6 | Input Validation | PASS/FAIL | ... |
```

## Exceptions

1. **Public API routes** - `app/api/posts/route.ts` GET handler does not require authentication (public read access)
2. **Static data functions** - Synchronous functions in `lib/categories.ts` (e.g., `getCategoryName`, `CATEGORIES` array) do not call Supabase and do not need try-catch. Async CRUD functions (`getCategories`, `createCategory`, etc.) DO require try-catch.
3. **Build-time functions** - Functions only called during static generation (e.g., `getAllPosts` for `generateStaticParams`) may have different error handling requirements
