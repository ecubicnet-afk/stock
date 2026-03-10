const URL_REGEX = /(https?:\/\/[^\s<>"{}|\\^`[\]]+)/g;

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
  const processedHtml = linkifyHtml(html);

  return (
    <div
      className={`whitespace-pre-wrap ${className}`}
      dangerouslySetInnerHTML={{ __html: processedHtml }}
    />
  );
}
