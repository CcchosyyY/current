"use client";

import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

// 모델 답변 본문 렌더링. 답변은 신뢰할 수 없는 입력이라:
// - HTML은 그대로 글자로 보인다 (rehype-raw 안 씀 → <script> 등 실행 안 됨)
// - 링크는 새 탭 + noopener, 이미지는 불러오지 않고 링크로만 (외부 추적 이미지 방지)
// 크기: sm 나란히 칸 · md 하나씩 칸 · lg 크게 보기.

const components = (large: boolean): Components => ({
  p: ({ children }) => <p className="my-3 first:mt-0 last:mb-0">{children}</p>,
  h1: ({ children }) => <h3 className={`mt-5 mb-2 font-semibold text-white ${large ? "text-xl" : "text-base"}`}>{children}</h3>,
  h2: ({ children }) => <h3 className={`mt-5 mb-2 font-semibold text-white ${large ? "text-lg" : "text-[15px]"}`}>{children}</h3>,
  h3: ({ children }) => <h4 className="mt-4 mb-1.5 font-semibold text-white">{children}</h4>,
  h4: ({ children }) => <h4 className="mt-4 mb-1.5 font-semibold text-text-primary">{children}</h4>,
  ul: ({ children }) => <ul className="my-3 list-disc space-y-1 pl-5 marker:text-text-tertiary">{children}</ul>,
  ol: ({ children }) => <ol className="my-3 list-decimal space-y-1 pl-5 marker:text-text-tertiary">{children}</ol>,
  li: ({ children }) => <li className="pl-0.5">{children}</li>,
  strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
  em: ({ children }) => <em className="italic">{children}</em>,
  blockquote: ({ children }) => (
    <blockquote className="my-3 border-l-2 border-primary/50 pl-3 text-text-secondary">{children}</blockquote>
  ),
  hr: () => <hr className="my-4 border-white/10" />,
  a: ({ href, children }) => (
    <a href={href} target="_blank" rel="noopener noreferrer nofollow" className="text-primary-light underline underline-offset-2 hover:text-primary">
      {children}
    </a>
  ),
  img: ({ src, alt }) =>
    typeof src === "string" && src ? (
      <a href={src} target="_blank" rel="noopener noreferrer nofollow" className="text-primary-light underline underline-offset-2">
        [이미지: {alt || src}]
      </a>
    ) : null,
  // 인라인 코드. 코드 블록 안의 code는 pre가 감싸므로 아래 pre 스타일이 덮는다.
  code: ({ children }) => (
    <code className="rounded bg-white/10 px-1 py-0.5 font-mono text-[0.9em] text-violet-200">{children}</code>
  ),
  pre: ({ children }) => (
    <pre className="my-3 overflow-x-auto rounded-lg border border-white/10 bg-black/50 p-3 font-mono text-[0.87em] leading-relaxed [&_code]:bg-transparent [&_code]:p-0 [&_code]:text-[1em] [&_code]:text-text-primary">
      {children}
    </pre>
  ),
  table: ({ children }) => (
    // 좁은 칸에서 열이 찌그러져 글자가 한 자씩 세로로 쌓이지 않게: 칸마다 최소 폭 + 단어 단위 줄바꿈,
    // 넘치면 표만 가로 스크롤
    <div className="my-3 overflow-x-auto rounded-lg border border-white/10">
      <table className="w-max min-w-full border-collapse text-left text-[0.92em] [word-break:keep-all]">{children}</table>
    </div>
  ),
  th: ({ children }) => (
    <th className="min-w-[6rem] max-w-[18rem] border-b border-white/20 bg-white/[0.04] px-3 py-2 font-semibold text-white">{children}</th>
  ),
  td: ({ children }) => <td className="min-w-[6rem] max-w-[18rem] border-b border-white/5 px-3 py-2 align-top">{children}</td>,
});

const SMALL = components(false);
const LARGE = components(true);

export type MarkdownSize = "sm" | "md" | "lg";
const TEXT: Record<MarkdownSize, string> = {
  sm: "text-[14px] leading-relaxed",
  md: "text-[15px] leading-7",
  lg: "text-[17px] leading-8",
};

export default function Markdown({ text, size = "sm" }: { text: string; size?: MarkdownSize }) {
  return (
    <div className={`break-words text-text-primary ${TEXT[size]}`}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={size === "lg" ? LARGE : SMALL}>
        {text}
      </ReactMarkdown>
    </div>
  );
}
