'use client';
const URL_REGEX = /(https?:\/\/[^\s<>"{}|\\^`[\]]+)/g;

interface Props {
  text: string;
  className?: string;
}

export function LinkifiedText({ text, className }: Props) {
  const parts = text.split(URL_REGEX);

  return (
    <span className={className}>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <a
            key={i}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent-cyan underline underline-offset-2 hover:text-accent-cyan/80 break-all"
            onClick={(e) => e.stopPropagation()}
          >
            {part}
          </a>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </span>
  );
}
