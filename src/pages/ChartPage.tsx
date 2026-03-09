export function ChartPage() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <div className="text-4xl mb-4 opacity-30">
          <svg className="w-16 h-16 mx-auto text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4v16" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-text-secondary mb-2">チャート</h2>
        <p className="text-text-secondary/60 text-sm">今後実装予定</p>
      </div>
    </div>
  );
}
