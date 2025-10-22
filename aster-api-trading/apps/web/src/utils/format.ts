/**
 * Format number with commas and optional decimal places
 */
export function formatNumber(value: number | string, decimals: number = 2): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '0.00';

  return num.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Format currency with $ and commas
 */
export function formatCurrency(value: number | string, decimals: number = 2): string {
  return `$${formatNumber(value, decimals)}`;
}

/**
 * Format percentage
 */
export function formatPercent(value: number, decimals: number = 2): string {
  return `${formatNumber(value, decimals)}%`;
}
