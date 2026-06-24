interface IntentKeywordTagsProps {
  keywords: string | null;
  max?: number;
}

export function IntentKeywordTags({ keywords, max = 6 }: IntentKeywordTagsProps) {
  if (!keywords) return <span className="text-xs text-text-muted italic">No keywords</span>;

  const tags = keywords
    .split(',')
    .map((k) => k.trim())
    .filter(Boolean);

  const visible = tags.slice(0, max);
  const remaining = tags.length - visible.length;

  return (
    <div className="flex flex-wrap gap-1.5">
      {visible.map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center px-2.5 py-1 rounded-md bg-info-soft text-info text-2xs font-semibold border border-[rgba(59,130,246,0.12)]"
        >
          {tag}
        </span>
      ))}
      {remaining > 0 && (
        <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-glass-2 text-text-muted text-2xs font-semibold">
          +{remaining} more
        </span>
      )}
    </div>
  );
}
