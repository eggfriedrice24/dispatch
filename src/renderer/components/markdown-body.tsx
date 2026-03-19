import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

/**
 * Render GitHub-flavored markdown (PR body, comments).
 *
 * Uses react-markdown + remark-gfm for tables, strikethrough, task lists, etc.
 * Styled to match the Dispatch design system's warm dark palette.
 */

interface MarkdownBodyProps {
  content: string;
  className?: string;
}

export function MarkdownBody({ content, className = "" }: MarkdownBodyProps) {
  if (!content.trim()) {
    return <p className="text-text-ghost text-xs italic">No description provided.</p>;
  }

  return (
    <div className={`prose-dispatch ${className}`}>
      <Markdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Open external links in browser
          a({ href, children, ...rest }) {
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                {...rest}
              >
                {children}
              </a>
            );
          },
        }}
      >
        {content}
      </Markdown>
    </div>
  );
}
