# Current by Jyos — 프로젝트 컨텍스트

> Claude Code가 이 프로젝트를 도울 때 반드시 이 문서를 먼저 읽고 시작할 것.
> 이 문서는 프로젝트의 목적, 기술 스택, 구조, 개발 원칙을 모두 담고 있다.

---

## 1. 프로젝트 개요

**서비스명:** Current (by Jyos)
- 브랜드: `Current` (메인) / `Jyos` (사업자, 서브 브랜드)
- 사업자명: Jyos (개인사업자 기보유)
- 로고: 상어 지느러미 심볼 + "Current" 텍스트 조합

**한 줄 소개:**
AI 기술 뉴스를 자동 수집·요약하고 카드형 UI로 제공하는 뉴스 큐레이션 플랫폼 + IoT 하드웨어 디스플레이

**배경 및 문제 정의:**
AI 기술의 발전 속도가 너무 빠르다. Claude, ChatGPT, Gemini 등 주요 AI 모델의 업데이트가 수개월 간격으로 쏟아지고, 관련 기사도 매일 수백 개씩 나온다. 그러나 이 정보를 한눈에 모아볼 수 있는 도구가 없어서 일일이 직접 찾아다녀야 한다. Current는 이 문제를 해결하기 위해 만드는 서비스다.

**최종 목표:**
- 졸업 프로젝트로 제출 (컴퓨터공학부, 개발 기간 9개월)
- 실제 운영 서비스로 론칭하여 수익화까지 달성
- 광고(Google AdSense) + 구독(₩2,000/월) + 하드웨어 판매 3가지 수익 모델

---

## 2. 핵심 기능 (Phase별)

### Phase 1 — AI 기술 뉴스 대시보드 (핵심)
- Claude / ChatGPT / Gemini 공식 블로그 RSS 자동 수집
- Claude API를 이용한 한국어 요약 파이프라인
- 카드형 UI로 보기 쉽게 표시
- 카테고리 필터, 별표(즐겨찾기) 저장 기능
- 유명 AI 연구자 코멘트 섹션 (Andrej Karpathy, Sam Altman 등 공개 블로그/SNS 기반)
- Cron Job으로 하루 1회 자동 수집 및 요약

### Phase 2 — 글로벌 뉴스레터 확장
- 미국 경제, 유럽·중동 경제, 한국 정치 등 카테고리 확장
- 글로벌 뉴스: NewsAPI.org 활용
- 한국 뉴스: 네이버 뉴스 RSS 활용
- 뉴스레터 형식 UI
- 구독자 맞춤 피드

### Phase 3 — 주식 연계 스마트 추천 (데모 수준)
- 기사 키워드 추출 → 관련 종목 매핑
- Yahoo Finance API (yfinance) 주가 데이터 연동
- 삼성전자, 대기업 이슈 → 관련 주식 차트 연동
- 졸업 발표용 데모 수준으로 구현 (완성도보다 컨셉 시연 중심)

### Phase 4 — IoT 하드웨어 디스플레이 (최종 목표)
- ESP32 + 4인치 TFT 디스플레이 (ILI9341 또는 동급)
- Wi-Fi로 백엔드 API에서 헤드라인 수신
- 별표 저장한 카테고리의 헤드라인을 디스플레이에 표시
- Fusion 360으로 케이스 설계, 3D 프린팅으로 제작
- 한글 폰트 처리 주의 (비트맵 폰트 또는 우선 영문 헤드라인으로 구현)

---

## 3. 수익화 모델

**광고:**
- Google AdSense: 양쪽 사이드바 광고 (무료·유료 유저 모두에게 표시)
- 금융·투자 카테고리 기사가 있어 광고 단가 유리

**구독 (₩2,000/월):**
- 광고 제거가 아닌 추가 기능 제공 방식
- 주식 연계 추천, 맞춤 피드, 하드웨어 연동 등
- 결제: Stripe (글로벌) / 토스페이먼츠 (한국)

**인프라:**
- Vercel 무료 배포로 시작
- 유저 증가 시 AWS(EC2, S3, RDS, CloudFront)로 이전

---

## 4. 기술 스택

### 프론트엔드
- **Next.js 15** (App Router) — SSR, SSG, ISR 모두 활용, /app 디렉토리 기반 라우팅
- **TypeScript** — strict 모드, 모든 파일 .tsx / .ts
- **Tailwind CSS** — utility-first 스타일링, 별도 CSS 파일 최소화

### 백엔드 (Next.js 내부)
- **Next.js Route Handler** (app/api/) — RESTful API 설계
- **Python** (별도 스크립트) — feedparser, BeautifulSoup4, requests
- Cron Job 또는 GitHub Actions로 스케줄링

### 데이터베이스 / 인증
- **Supabase** — PostgreSQL, Auth + Google OAuth, RLS, Realtime
- **Redis** (선택, 추후) — API 응답 캐싱, 중복 요약 방지

### AI / 외부 API
- **Claude API** (Anthropic) — 기사 요약 파이프라인, claude-sonnet 계열
- **NewsAPI.org** — 글로벌 뉴스 수집
- **yfinance** (Python) — Yahoo Finance 주가 데이터

### 하드웨어
- **ESP32** — Wi-Fi, C++ (Arduino), ArduinoJson, HTTPClient
- **4인치 TFT 디스플레이** — ILI9341, TFT_eSPI 라이브러리
- **3D 프린팅 케이스** — Fusion 360 설계

### 배포 / 인프라
- **Vercel** — 프론트엔드 + API 배포, 환경변수, Cron Jobs
- **GitHub** — 버전 관리, GitHub Actions CI/CD (추후)
- **AWS** (스케일 시) — EC2, S3, RDS, CloudFront

---

## 5. 개발 로드맵 (9개월)

| 기간 | 목표 | 주요 작업 |
|------|------|----------|
| M1~2 | 기반 개발 | JS/TS 학습, Next.js 환경 구성, Supabase 설계, AI 뉴스 카드 UI |
| M3 | 크롤링·AI | Python RSS 크롤러, Claude API 요약 파이프라인, Cron Job |
| M4 | 뉴스 확장 | 글로벌 뉴스 카테고리, 한국 뉴스, Phase 2 완성 |
| M5 | 주식 연계 | yfinance 연동, 키워드→종목 매핑, Phase 3 데모 |
| M6~7 | 하드웨어 | ESP32 + TFT 세팅, API 연동, 3D 케이스 설계·프린팅 |
| M8~9 | 완성·발표 | 통합 테스트, 결제·광고 연동, PPT·보고서·발표 준비 |

---

## 6. 공부 로드맵 (병행)

JavaScript → TypeScript → React → Next.js → Tailwind CSS → SQL/PostgreSQL → Supabase → Python → REST API/HTTP → Git/GitHub → Docker (심화) → AWS (심화)

---

> 프로젝트: Current by Jyos
> 개발자: 1인 개발
> 상태: 기획 확정 전 (유연하게 조정 가능)
