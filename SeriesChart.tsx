import { useId, useState } from 'react';
import { clamp, nf } from '../../lib/format';
import { useMeasuredWidth } from '../../lib/hooks';

export interface ChartSeries {
  key: string;
  name: string;
  color: string;
  values: number[];
  axis?: 'left' | 'right';
  kind?: 'line' | 'area';
  dashed?: boolean;
  format?: (value: number) => string;
}

interface Props {
  labels: string[];
  fullLabels: string[];
  series: ChartSeries[];
  height?: number;
  leftUnit?: string;
  rightUnit?: string;
  leftMax?: number;
  rightMax?: number;
  ariaLabel: string;
}

function niceMax(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return 1;
  const pow = Math.pow(10, Math.floor(Math.log10(value)));
  const scaled = value / pow;
  const step =
    scaled <= 1 ? 1 : scaled <= 2 ? 2 : scaled <= 2.5 ? 2.5 : scaled <= 5 ? 5 : 10;
  return step * pow;
}

export function SeriesChart({
  labels,
  fullLabels,
  series,
  height = 240,
  leftUnit,
  rightUnit,
  leftMax,
  rightMax,
  ariaLabel,
}: Props) {
  const { ref, width } = useMeasuredWidth<HTMLDivElement>();
  const gradientId = useId().replace(/:/g, '');
  const [hover, setHover] = useState<number | null>(null);

  const n = labels.length;
  const hasRight = series.some((item) => item.axis === 'right');
  const leftSeries = series.filter((item) => item.axis !== 'right');
  const rightSeries = series.filter((item) => item.axis === 'right');

  const pad = { top: 20, right: hasRight ? 48 : 16, bottom: 30, left: 50 };
  const plotW = Math.max(10, width - pad.left - pad.right);
  const plotH = Math.max(10, height - pad.top - pad.bottom);

  const maxLeft =
    leftMax ??
    niceMax(Math.max(1, ...leftSeries.flatMap((item) => item.values)) * 1.04);
  const maxRight =
    rightMax ??
    niceMax(Math.max(1, ...rightSeries.flatMap((item) => item.values)) * 1.04);

  const x = (index: number) =>
    pad.left + (n <= 1 ? 0 : (index / (n - 1)) * plotW);
  const yFor = (value: number, axis: 'left' | 'right') => {
    const max = axis === 'right' ? maxRight : maxLeft;
    return pad.top + plotH * (1 - clamp(value, 0, max) / max);
  };

  const linePath = (values: number[], axis: 'left' | 'right') =>
    values
      .map(
        (value, index) =>
          `${index === 0 ? 'M' : 'L'}${x(index).toFixed(2)},${yFor(value, axis).toFixed(2)}`,
      )
      .join(' ');

  const areaPath = (values: number[], axis: 'left' | 'right') =>
    `${linePath(values, axis)} L${x(n - 1).toFixed(2)},${(pad.top + plotH).toFixed(
      2,
    )} L${x(0).toFixed(2)},${(pad.top + plotH).toFixed(2)} Z`;

  const tickCount = Math.max(2, Math.min(6, Math.floor(width / 145)));
  const tickIndices = Array.from({ length: tickCount }, (_, index) =>
    Math.round((index / (tickCount - 1)) * (n - 1)),
  ).filter((value, index, all) => all.indexOf(value) === index);

  const yTicks = [0, 0.25, 0.5, 0.75, 1];

  function handlePointer(event: React.PointerEvent<SVGSVGElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    if (rect.width === 0) return;
    const localX = ((event.clientX - rect.left) / rect.width) * width;
    const ratio = (localX - pad.left) / plotW;
    setHover(clamp(Math.round(ratio * (n - 1)), 0, n - 1));
  }

  const tipX = hover === null ? 0 : clamp(x(hover), 92, width - 92);

  return (
    <div className="chart" ref={ref}>
      <div className="chart-legend">
        {series.map((item) => (
          <span className="legend-item" key={item.key}>
            <span
              className="legend-swatch"
              style={{ background: item.color }}
              aria-hidden="true"
            />
            {item.name}
          </span>
        ))}
        {hasRight && rightUnit && (
          <span className="legend-axis">right axis · {rightUnit}</span>
        )}
      </div>

      <div className="chart-canvas">
        <svg
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          role="img"
          aria-label={ariaLabel}
          onPointerMove={handlePointer}
          onPointerLeave={() => setHover(null)}
        >
          <defs>
            {series.map((item, index) => (
              <linearGradient
                key={item.key}
                id={`${gradientId}-${index}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="0%" stopColor={item.color} stopOpacity="0.26" />
                <stop offset="100%" stopColor={item.color} stopOpacity="0" />
              </linearGradient>
            ))}
          </defs>

          {yTicks.map((fraction) => {
            const y = pad.top + plotH * (1 - fraction);
            return (
              <g key={fraction}>
                <line
                  className="chart-grid"
                  x1={pad.left}
                  x2={width - pad.right}
                  y1={y}
                  y2={y}
                />
                <text className="chart-axis-text" x={pad.left - 10} y={y + 3.5} textAnchor="end">
                  {nf(maxLeft * fraction)}
                </text>
                {hasRight && (
                  <text
                    className="chart-axis-text chart-axis-text--right"
                    x={width - pad.right + 10}
                    y={y + 3.5}
                    textAnchor="start"
                  >
                    {nf(maxRight * fraction)}
                  </text>
                )}
              </g>
            );
          })}

          {tickIndices.map((index) => (
            <text
              key={index}
              className="chart-axis-text"
              x={x(index)}
              y={height - 9}
              textAnchor={
                index === 0 ? 'start' : index === n - 1 ? 'end' : 'middle'
              }
            >
              {labels[index]}
            </text>
          ))}

          {leftUnit && (
            <text className="chart-unit" x={pad.left} y={12}>
              {leftUnit}
            </text>
          )}
          {hasRight && rightUnit && (
            <text
              className="chart-unit"
              x={width - pad.right}
              y={12}
              textAnchor="end"
            >
              {rightUnit}
            </text>
          )}

          {series.map((item, index) => {
            const axis = item.axis === 'right' ? 'right' : 'left';
            return (
              <g key={item.key}>
                {item.kind === 'area' && (
                  <path
                    d={areaPath(item.values, axis)}
                    fill={`url(#${gradientId}-${index})`}
                  />
                )}
                <path
                  d={linePath(item.values, axis)}
                  fill="none"
                  stroke={item.color}
                  strokeWidth={item.kind === 'area' ? 1.6 : 2}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  strokeDasharray={item.dashed ? '4 4' : undefined}
                />
              </g>
            );
          })}

          {hover !== null && (
            <g className="chart-crosshair">
              <line
                x1={x(hover)}
                x2={x(hover)}
                y1={pad.top}
                y2={pad.top + plotH}
              />
              {series.map((item) => (
                <circle
                  key={item.key}
                  cx={x(hover)}
                  cy={yFor(
                    item.values[hover] ?? 0,
                    item.axis === 'right' ? 'right' : 'left',
                  )}
                  r={3.4}
                  fill={item.color}
                  stroke="#05070d"
                  strokeWidth="1.5"
                />
              ))}
            </g>
          )}
        </svg>

        {hover !== null && (
          <div
            className="chart-tip"
            style={{ left: `${tipX}px`, top: '4px' }}
            aria-hidden="true"
          >
            <p className="chart-tip-label">{fullLabels[hover]}</p>
            {series.map((item) => (
              <p className="chart-tip-row" key={item.key}>
                <span
                  className="legend-swatch"
                  style={{ background: item.color }}
                />
                <span className="chart-tip-name">{item.name}</span>
                <span className="chart-tip-value">
                  {item.format
                    ? item.format(item.values[hover] ?? 0)
                    : nf(item.values[hover] ?? 0, 1)}
                </span>
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
