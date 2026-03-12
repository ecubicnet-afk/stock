'use client';
import { useEffect, useRef, useState } from 'react';

interface MiniTradingViewChartProps {
  symbol: string;
  height?: number;
}

export function MiniTradingViewChart({ symbol, height = 60 }: MiniTradingViewChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  // IntersectionObserver for lazy loading
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '100px' }
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // Load widget when visible
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !isVisible) return;

    container.innerHTML = '';

    const widgetDiv = document.createElement('div');
    widgetDiv.className = 'tradingview-widget-container__widget';
    container.appendChild(widgetDiv);

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-mini-symbol-overview.js';
    script.type = 'text/javascript';
    script.async = true;
    script.innerHTML = JSON.stringify({
      symbol,
      width: '100%',
      height,
      locale: 'ja',
      dateRange: '1M',
      colorTheme: 'dark',
      isTransparent: true,
      autosize: false,
      chartOnly: true,
      noTimeScale: true,
    });

    container.appendChild(script);

    return () => {
      if (container) {
        container.innerHTML = '';
      }
    };
  }, [symbol, height, isVisible]);

  return (
    <div
      ref={containerRef}
      style={{ height: `${height}px`, width: '100%', overflow: 'hidden' }}
    />
  );
}
