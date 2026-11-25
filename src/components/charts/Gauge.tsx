import { useId } from 'react';
import { nf } from '../../lib/format';

export function Gauge({
  value,
  headline,
  caption,
  tone = '#35f0a4',
  size = 'md',
}: {
  value: number;
  headline?: string;
  caption?: string;
  tone?: string;
  size?: 'sm' | 'md';
}) {
  const gradientId = useId().replace(/:/g, '');
  const clamped = Math.min(100, Math.max(0, value));

  return (
    <div className={`gauge gauge--${size}`}>
      <svg viewBox="0 0 200 158" role="img" aria-label={`${headline ?? 'Gauge'}: ${nf(clamped, 0)}%`}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="1" x2="1" y2="0">
            <stop offset="0%" stopColor="#22d3ee" />
            <stop offset="100%" stopColor={tone} />
          </linearGradient>
        </defs>
        <path
          d="M 39.4 127 A 70 70 0 1 1 160.6 127"
          fill="none"
          stroke="rgba(148,163,184,0.14)"
          strokeWidth="9"
          strokeLinecap="round"
          pathLength={100}
        />
        <path
          d="M 39.4 127 A 70 70 0 1 1 160.6 127"
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth="9"
          strokeLinecap="round"
          pathLength={100}
          strokeDasharray={`${clamped} 100`}
          className="gauge-progress"
        />
        <text className="gauge-value" x="100" y="96" textAnchor="middle">
          {nf(clamped, 0)}
          <tspan className="gauge-unit" dx="2">%</tspan>
        </text>
        {caption && (
          <text className="gauge-caption" x="100" y="120" textAnchor="middle">
            {caption}
          </text>
        )}
      </svg>
      {headline && <p className="gauge-label">{headline}</p>}
    </div>
  );
}
