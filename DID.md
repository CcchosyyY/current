# Done

## 2026-03-27 — UI/UX 리디자인 (카테고리 + 사이드바 + 폰트)

### 완료 항목
- 카테고리 시스템 확장: 5개 → 14개 (Core 7 + Extended 7)
- 사이드바 A안 리디자인 (컬러 아이콘, Main/More 그룹 구분, 카테고리별 active 색상)
- 폰트 변경: Space Grotesk + Inter → Nunito + Nunito Sans (둥근 느낌)
- 기사 텍스트 크기 조정 (13px → 11px)
- Category 타입에 color, group 필드 추가

### 변경 사항

| 영역 | 변경 내용 |
|------|-----------|
| 카테고리 | ai-ml, llm, image-gen, video-gen, music-audio, coding, ai-search + 확장 7개 |
| 사이드바 | 컬러 아이콘, Main/More 섹션 분리, 220px 너비, 스크롤 지원 |
| 폰트 | Nunito (헤딩) + Nunito Sans (본문) — 둥근 산세리프 |
| 타입 | CategorySlug 14개, Category에 color/group 추가 |
| mock 데이터 | 기존 카테고리 슬러그 매핑 (claude→llm, global-news→ai-ml 등) |

### 발견된 이슈
- 14개 카테고리 중 12개는 기사 데이터 0건 (mock 보충 필요)
- Nunito에 한글 글리프 없음 (Noto Sans KR 폴백 추가 필요)
- 사이드바 220px → 태블릿 반응형 튜닝 필요

---

## 2026-03-23 — AI 뉴스 큐레이션 플랫폼 MVP 구현

### 완료 항목
- MVP 전체 구현 (대시보드, 트렌딩, 북마크, 뉴스레터, 기사 상세 5개 페이지)
- API 4개 엔드포인트 구축 (articles, ai-models, bookmarks, newsletter)
- 보안 인프라 적용 (Rate Limiting, CSRF, Zod, 보안 헤더)
- 모바일 반응형 + Framer Motion 애니메이션 전면 적용
- Command Palette 검색 (Cmd+K), 북마크/공유, 토스트 알림 구현
- PPT 초안용 프로젝트 상세 정리

### 변경 사항

| 영역 | 변경 내용 |
|------|-----------|
| 대시보드 | 뉴스 피드, AI 모델 디렉토리(24개), 전문가 인사이트, 카테고리 필터 |
| 페이지 | 트렌딩(기간 필터), 북마크(Saved), 뉴스레터(구독), 기사 상세 |
| 컴포넌트 | Header, Sidebar, NewsCard, AIModelCard 등 11개 + 스켈레톤 2개 |
| API/보안 | Rate Limiting, CSRF, Zod 검증, Cache-Control, 보호 라우트 |
| UX | Command Palette, 사이드바 접기/펼치기, 모바일 오버레이, 토스트 |
| 커스텀 훅 | useBookmarks, useShare, useToast 3개 |

### 아키텍처 노트
- Server Component 우선 설계, 인터랙션 필요 시에만 Client Component 분리
- Mock 데이터로 전체 흐름 완성 후 DB 연동 전략 채택
- Claude Code 병렬 에이전트 12개 팀 활용, 2회 세션(약 30분)으로 구현 완료
