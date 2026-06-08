# TODO — Current by Jyos

> AI 뉴스 큐레이션 (Next.js 16 + Supabase)
> "한 일" → `git log --oneline` · 깊은 맥락(왜/어떻게) → `docs/worklog/`
> 완료한 항목은 이 파일에서 **삭제**합니다 (git이 기록함)

---

## 🔥 Now — 지금 (1~3개만)

- [ ] (사용자) 로그인 → 북마크 → `/saved` end-to-end 1회 확인

## ⏭️ Next — 다음

- [ ] LLM(Claude Haiku) 분류 도입 — 키워드로 못 거르는 비즈니스 기사 누출 해결
- [ ] 기존 DB 기사 백필 (옛 분류·옛 소스 재분류) — LLM 도입 때 함께
- [ ] 모델 상세 모달 Figma 다듬기 → 코드 반영
- [ ] 기사 로고 fallback(모델→회사→사이트)을 Trending·Saved·상세에도 적용
- [ ] 검색 Supabase 전문 검색 연동 (현재 title/summary ilike)

## 💡 Someday — 백로그

**모델 / 회사**
- [ ] `PAGE_FIRST_SLUGS` 전체 모델로 확장 (현재 chatgpt만 파일럿)
- [ ] Try 버튼: 밝은 브랜드색 대비 보정 (글자색 토글)
- [ ] 회사 로고 171→200 보완 + 큰 로고(.ico) 64px 최적화 + berkshire-hathaway 대체
- [ ] 모델→회사 명시 매핑(companySlug) / 회사 상세(시총·창립·본사) 데이터 확장

**페이지 / 기능**
- [ ] Newsletter 상세("Read") 페이지
- [ ] Profile / Settings 페이지, 알림 벨(드롭다운)
- [ ] error.tsx / loading.tsx, 페이지별 SEO 메타데이터(generateMetadata)
- [ ] 대시보드 서버/클라이언트 컴포넌트 분리 (번들 최적화)

**Trending 페이지 개편** (현재: `view_count` 내림차순 정렬 + 기간 클라 필터뿐)
- [ ] 실제 조회수 추적 — 기사 열람 시 `view_count` +1 (RPC/API). 현재는 크롤마다 합성값 재계산 (`crawl-articles.mjs:638-649`)
- [ ] `is_trending` 실제화 — 크롤러 합성 플래그 → 조회수 + 최신성 신호 기반으로
- [ ] UI/UX 개선 — 순위 변동(▲▼) 실제 데이터화(지금은 isTrending→고정 ↗/−), 1~3위 강조, 빈상태·스켈레톤 다듬기, 모바일 레이아웃
- [ ] 기간 필터 서버화 — 현재 마운트 시점 `Date.now()` 기준 클라 필터(부정확) → 쿼리로 이관
- [ ] 기사 로고 fallback(모델→회사→사이트) Trending에도 적용 (위 Next 항목과 동일)

**폴리싱 / 인프라**
- [ ] Nunito 한글 폴백(Noto Sans KR), 사이드바 반응형, 라이트/다크 토글
- [ ] CSP unsafe-inline/eval 제거(nonce 기반), 페이지 전환 애니메이션
- [ ] Rate limiter 인메모리 → Upstash Redis
- [ ] Vercel 배포+Cron / CI·CD(GitHub Actions) / E2E(Playwright)
- [ ] 크롤러 Claude API 기사 요약 (현재 RSS snippet 그대로 사용)
- [ ] GitHub Actions Node 20 deprecation — `crawl.yml`의 `checkout@v4`·`setup-node@v4`가 Node 20에서 실행됨. **2026-06-16**부터 Node 24 강제(v4 액션은 지원해 계속 작동), **2026-09-16** Node 20 제거. 경고 끄려면 워크플로우에 `env: FORCE_JAVASCRIPT_ACTIONS_TO_NODE24: true` 추가

**Figma 디자인 시스템** (파일 `SwGySWU706nVMABEEK65hC`)
- [ ] 모델 모달 시안(node 46:2) 다듬기 → 코드 / 5개 페이지 컴포넌트 인스턴스화
- [ ] 화면 fill을 Color 변수 바인딩 / 모바일 프레임 / 아이콘 동기화 유지

**먼 미래**
- [ ] 대시보드 위젯 드래그 커스터마이징 / PWA / i18n
