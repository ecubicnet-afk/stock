import { useEffect, useRef } from 'react';

interface TradingViewWidgetProps {
  symbol: string;
  height?: number;
}

export function TradingViewWidget({ symbol, height = 500 }: TradingViewWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.innerHTML = '';

    const widgetDiv = document.createElement('div');
    widgetDiv.className = 'tradingview-widget-container__widget';
    widgetDiv.style.height = '100%';
    widgetDiv.style.width = '100%';
    container.appendChild(widgetDiv);

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.type = 'text/javascript';
    script.async = true;
    script.innerHTML = JSON.stringify({
      symbol,
      width: '100%',
      height,
      locale: 'ja',
      colorTheme: 'dark',
      timezone: 'Asia/Tokyo',
      style: '1',
      interval: 'D',
      allow_symbol_change: true,
      hide_volume: false,
      calendar: false,
      withdateranges: true,
      support_host: 'https://www.tradingview.com',
    });

    container.appendChild(script);

    return () => {
      if (container) {
        container.innerHTML = '';
      }
    };
  }, [symbol, height]);

  return (
    <div
      ref={containerRef}
      className="tradingview-widget-container"
      style={{ height: `${height}px`, width: '100%' }}
    />
  );
}
