interface TradingViewWidgetProps {
  symbol: string;
  height?: number;
}

export function TradingViewWidget({ symbol, height = 500 }: TradingViewWidgetProps) {
  const src = `https://s.tradingview.com/widgetembed/?frameElementId=tv_widget&symbol=${encodeURIComponent(symbol)}&interval=D&theme=dark&style=1&locale=ja&timezone=Asia%2FTokyo&allow_symbol_change=1&hide_volume=0&calendar=0&withdateranges=1`;

  return (
    <iframe
      src={src}
      style={{ width: '100%', height: `${height}px`, border: 'none' }}
      allow="autoplay; fullscreen"
      sandbox="allow-scripts allow-same-origin allow-popups"
      title={`TradingView Chart - ${symbol}`}
    />
  );
}
