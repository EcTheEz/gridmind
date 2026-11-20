export function nf(value: number, digits = 0): string {
  return value.toLocaleString('en-MY', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

export function kw(value: number, digits = 0): string {
  return `${nf(value, digits)} kW`;
}

export function kwh(value: number, digits = 0): string {
  return `${nf(value, digits)} kWh`;
}

export function pct(value: number, digits = 1): string {
  return `${nf(value, digits)}%`;
}

export function rm(value: number, digits = 0): string {
  return `RM ${nf(value, digits)}`;
}

export function signed(value: number, digits = 1): string {
  const sign = value > 0 ? '+' : '';
  return `${sign}${nf(value, digits)}`;
}

export function deltaPct(from: number, to: number): number {
  if (from === 0) return 0;
  return ((to - from) / Math.abs(from)) * 100;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
