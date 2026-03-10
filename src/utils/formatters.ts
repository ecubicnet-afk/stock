export function formatNumber(value: number, decimals?: number): string {
  if (value == null || isNaN(value)) return '---';
  const d = decimals ?? (value >= 100 ? 2 : value >= 1 ? 2 : 4);
  return value.toLocaleString('en-US', {
    minimumFractionDigits: d,
    maximumFractionDigits: d,
  });
}

export function formatChange(value: number, decimals?: number): string {
  if (value == null || isNaN(value)) return '---';
  const d = decimals ?? 2;
  const prefix = value > 0 ? '+' : '';
  return `${prefix}${value.toLocaleString('en-US', {
    minimumFractionDigits: d,
    maximumFractionDigits: d,
  })}`;
}

export function formatPercent(value: number): string {
  if (value == null || isNaN(value)) return '---';
  const prefix = value > 0 ? '+' : '';
  return `${prefix}${value.toFixed(2)}%`;
}

export function formatCurrency(value: number, currency: string): string {
  if (currency === 'JPY') {
    return `¥${formatNumber(value, 2)}`;
  }
  if (currency === 'USD') {
    return `$${formatNumber(value, 2)}`;
  }
  if (currency === 'EUR') {
    return `€${formatNumber(value, 2)}`;
  }
  if (currency === 'GBP') {
    return `£${formatNumber(value, 2)}`;
  }
  return formatNumber(value);
}

export function formatJPY(value: number): string {
  return new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(value);
}

export function getChangeColor(value: number): string {
  if (value == null || isNaN(value)) return 'text-text-secondary';
  if (value > 0) return 'text-up';
  if (value < 0) return 'text-down';
  return 'text-text-secondary';
}

export function getChangeBgColor(value: number): string {
  if (value == null || isNaN(value)) return 'bg-text-secondary/10';
  if (value > 0) return 'bg-up/10';
  if (value < 0) return 'bg-down/10';
  return 'bg-text-secondary/10';
}

export function formatJST(date: Date): string {
  return date.toLocaleString('ja-JP', {
    timeZone: 'Asia/Tokyo',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

export function formatDateJST(date: Date): string {
  return date.toLocaleString('ja-JP', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'short',
  });
}
