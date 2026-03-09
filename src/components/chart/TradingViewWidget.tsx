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

    // Clear previous widget
    container.innerHTML = '';

    const widgetDiv = document.createElement('div');
    widgetDiv.className = 'tradingview-widget-container__widget';
    widgetDiv.style.height = `${height}px`;
    widgetDiv.style.width = '100%';
    container.appendChild(widgetDiv);

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.type = 'text/javascript';
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol,
      interval: 'D',
      timezone: 'Asia/Tokyo',
      theme: 'dark',
      style: '1',
      locale: 'ja',
      allow_symbol_change: true,
      calendar: false,
      support_host: 'https://www.tradingview.com',
      height,
      width: '100%',
      hide_volume: false,
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
