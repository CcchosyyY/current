# Done

> **블로그 발행 대기 버퍼** — 직전 1개 세션 섹션만 유지하고, 블로그 발행 후 비웁니다.
> 영구 기록: `git log --oneline`(한 일) · `docs/worklog/<기능>.md`(왜/어떻게)

## 2026-10-10 — 4개월 휴면 복구 · 공백 기사 백필 · 전 기사 이미지 표시

> 6/9 이후 휴면 → Supabase 일시정지 + 크롤러 cron 자동 비활성화(GitHub 60일 규칙, 8/8 마지막 실행) 상태에서 재가동.

### 완료 항목
- **복구**: Supabase 프로젝트 재개, service_role 키 `.env.local` 반영, GitHub Actions `Crawl articles` 재활성화. Anthropic 키 로컬 추가(앞에 `s` 오타 섞여 401 → 수정). 이 머신 git 작성자(`CcchosyyY`, 레포 로컬) + `gh` 로그인 설정.
- **공백 기사 백필**: 크롤러 `--backfill --since=` 모드 — WordPress 피드 `?paged=N`으로 8/8까지 역수집. 734건 → 스코프/Haiku 필터 188건 → **178건 신규**(9월 0→95건). Haiku 비용 ~$0.05.
- **크롤러 운영 조정**: cron 6h → **12h**(KST 09/21시), 피드당 상한 12 → **20**(전체 70 → 120), 죽은 **VentureBeat → SiliconANGLE** 교체(VB RSS는 429 + 우회 경로도 8~9월 이후 갱신 정지).
- **이미지**: Verge·Wired 호스트가 allowlist에 없어 137건 이미지가 렌더 시 버려지던 것 수정. RSS에 이미지 없는 소스(TechCrunch 전량, MIT TR 대부분)는 기사 페이지 **og:image 폴백**(HEAD로 실제 이미지 검증). `--fill-images`로 기존 305건 채움 → **568건 중 566건 이미지 정상**(나머지 2건은 원문에도 이미지 없음 → placeholder).
- **버그 수정**: 제목 HTML 엔티티(`&#8217;` 등) 미디코딩 → 디코드 일반화 + DB 22건 정리 / 이미지 URL 엔티티(`&#038;`) 93건 정리 / `/api/articles` 범위 밖 페이지 500 → 빈 페이지 + 실제 total.

### 검증 (2026-10-10, dev :3003)
- 페이지 `/` `/trending` `/models` `/newsletter` 200, `/saved` 307(보호 정상), API 200
- 568건 전 기사 이미지를 `/_next/image` 경유로 실제 로드 확인(566 ok)
- API 범위 밖 페이지(13·999, 카테고리·검색 필터 포함) 200 + 정확한 total, `tsc --noEmit` 통과
- GitHub Actions 로그로 Secrets의 Anthropic 키 정상(Haiku 호출 성공) 확인

### 변경 사항

| 영역 | 변경 내용 |
|------|-----------|
| 크롤러 | `--backfill`/`--fill-images` 모드, Haiku 40건 단위 분할 호출, og:image 폴백·이미지 URL 정리, 제목 엔티티 디코드, 상한 20, SiliconANGLE |
| CI | `crawl.yml` cron 12시간 주기 |
| 이미지 | `image-config.ts`에 Verge·Wired·SiliconANGLE 호스트 |
| API | `/api/articles` PGRST103(범위 밖) → 빈 페이지 |
| DB | 기사 390 → 568건, 이미지·엔티티 데이터 정리 (DB 14MB / 무료 500MB) |

### 아키텍처 노트
- 크롤러는 Haiku 실패 시 키워드 분류로 **조용히 폴백**하고 성공 처리됨 → Actions 초록불만으로 키 정상 판단 불가. 로그의 `LLM usage` 줄로 확인.
- GitHub은 레포 커밋이 60일 없으면 schedule 워크플로우를 끔 → 크롤러가 멈추면 DB도 비활성 → Supabase 일시정지로 연쇄. keepalive 필요(DO.md Now).
- 백필은 페이지네이션 되는 WordPress 피드만 가능 — Verge·Wired 공백은 RSS로 복구 불가.

---
