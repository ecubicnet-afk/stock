'use client';
const URL_REGEX = /(https?:\/\/[^\s<>"{}|\\^`[\]]+)/g;

/** Strip dangerous HTML tags and event handlers to prevent XSS */
function sanitizeHtml(html: string): string {
  return html
    // Remove script/iframe/object/embed/form tags and their content
    .replace(/<(script|iframe|object|embed|form|style)\b[^>]*>[\s\S]*?<\/\1>/gi, '')
    // Remove self-closing dangerous tags
    .replace(/<(script|iframe|object|embed|form|style)\b[^>]*\/?>/gi, '')
    // Remove event handler attributes (on*)
    .replace(/\s+on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]*)/gi, '')
    // Remove javascript: protocol in href/src
    .replace(/(href|src)\s*=\s*(?:"javascript:[^"]*"|'javascript:[^']*')/gi, '$1=""');
}

function linkifyHtml(html: string): string {
  // Don't linkify URLs already inside <a> tags
  // Split by existing <a...>...</a> tags, only linkify outside them
  const parts = html.split(/(<a\s[^>]*>.*?<\/a>)/gi);
  return parts.map((part) => {
    if (part.startsWith('<a ')) return part;
    return part.replace(URL_REGEX, '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-accent-cyan underline underline-offset-2 hover:text-accent-cyan/80 break-all">$1</a>');
  }).join('');
}

interface RichTextDisplayProps {
  html: string;
  className?: string;
}

export function RichTextDisplay({ html, className = '' }: RichTextDisplayProps) {
  const processedHtml = linkifyHtml(sanitizeHtml(html));

  return (
    <div
      className={`whitespace-pre-wrap ${className}`}
      dangerouslySetInnerHTML={{ __html: processedHtml }}
    />
  );
}
