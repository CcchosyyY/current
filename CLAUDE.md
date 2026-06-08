# Current by Jyos — 프로젝트 지침

## 개발 서버 포트: 3003 (고정)

- 개발 서버는 **반드시 포트 3003**으로 띄울 것: `next dev -p 3003`
- 이유: 코드/사이트의 redirect URL(예: Supabase Auth redirect, OAuth 콜백 등)이
  `localhost:3003` 기준으로 설정되어 있어, 다른 포트(기본 3000)로 띄우면 리다이렉트가 깨짐.
- 접속: http://localhost:3003
