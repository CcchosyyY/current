import { resolveArticleLogo } from "@/lib/article-logo";

interface ArticleLogoProps {
  // 로고 결정에 필요한 최소 필드 (Article 전체를 넘겨도 됨)
  article: {
    aiModel?: string | null;
    title?: string | null;
    source?: string | null;
  };
  size?: number;
  className?: string;
}

/**
 * 기사 1건의 로고를 우선순위대로 렌더:
 *   1. AI 모델 브랜드 SVG  2. 본문에서 감지한 회사 로고  3. 사이트 로고(파란 삼각형)
 * 훅이 없는 순수 표현 컴포넌트라 서버/클라이언트 양쪽에서 사용 가능.
 */
export default function ArticleLogo({
  article,
  size = 18,
  className = "",
}: ArticleLogoProps) {
  const logo = resolveArticleLogo(article);

  if (logo.kind === "model") {
    // 로컬 정적 SVG → next/image 최적화 이득 0 (dangerouslyAllowSVG:false), plain img가 더 가벼움
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={logo.src}
        alt={logo.alt}
        width={size}
        height={size}
        className={`shrink-0 ${className}`}
      />
    );
  }

  if (logo.kind === "company") {
    // 회사 로고는 ico/png/jpeg 등 혼합 포맷 → next/image 대신 일반 img 사용
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={logo.src}
        alt={logo.alt}
        width={size}
        height={size}
        className={`shrink-0 rounded-sm object-contain ${className}`}
      />
    );
  }

  // 매칭되는 로고가 없으면 사이트 로고(파란 삼각형)
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={`shrink-0 text-primary ${className}`}
      aria-hidden
    >
      <path d="M10.5 2L4 20h16L10.5 2z" fill="currentColor" opacity="0.9" />
    </svg>
  );
}
