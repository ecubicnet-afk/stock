export function HeatmapPlaceholder() {
  return (
    <div className="bg-bg-card backdrop-blur-sm border border-border rounded-xl p-8 text-center opacity-60">
      <div className="grid grid-cols-8 gap-1 max-w-md mx-auto mb-4 opacity-30">
        {Array.from({ length: 32 }).map((_, i) => (
          <div
            key={i}
            className="aspect-square rounded-sm"
            style={{
              backgroundColor: i % 3 === 0 ? 'var(--color-up)' : i % 5 === 0 ? 'var(--color-down)' : 'var(--color-bg-secondary)',
              opacity: 0.3 + Math.random() * 0.5,
            }}
          />
        ))}
      </div>
      <p className="text-text-secondary text-sm">
        ヒートマップ - 今後実装予定
      </p>
      <p className="text-text-secondary/60 text-xs mt-1">
        日経225構成銘柄の時価総額と騰落率を可視化
      </p>
    </div>
  );
}
