export interface CompareMetric {
  key: string;
  label: string;
  conventional: number;
  gridMind: number;
  better: 'lower' | 'higher';
  format: (value: number) => string;
}

export function CompareBars({ metrics }: { metrics: CompareMetric[] }) {
  return (
    <div className="compare">
      <div className="compare-legend">
        <span className="legend-item">
          <span className="legend-swatch legend-swatch--base" aria-hidden="true" />
          Conventional management
        </span>
        <span className="legend-item">
          <span className="legend-swatch legend-swatch--gm" aria-hidden="true" />
          GridMind dispatch
        </span>
      </div>

      <div className="compare-rows">
        {metrics.map((metric) => {
          const max = Math.max(metric.conventional, metric.gridMind, 0.001) * 1.08;
          const change =
            metric.better === 'lower'
              ? ((metric.conventional - metric.gridMind) / Math.max(metric.conventional, 0.001)) * 100
              : ((metric.gridMind - metric.conventional) / Math.max(metric.conventional, 0.001)) * 100;
          const improved = change > 0.05;

          return (
            <div className="compare-row" key={metric.key}>
              <div className="compare-row-head">
                <span className="compare-label">{metric.label}</span>
                <span
                  className={`compare-delta ${improved ? 'compare-delta--pos' : ''}`}
                >
                  {improved ? `${change.toFixed(1)}% better` : 'no change'}
                </span>
              </div>

              <div className="compare-bar-row">
                <span className="compare-tag">Conventional</span>
                <div className="compare-track">
                  <div
                    className="compare-fill compare-fill--base"
                    style={{ width: `${(Math.max(0, metric.conventional) / max) * 100}%` }}
                  />
                </div>
                <span className="compare-value">{metric.format(metric.conventional)}</span>
              </div>

              <div className="compare-bar-row">
                <span className="compare-tag compare-tag--gm">GridMind</span>
                <div className="compare-track">
                  <div
                    className="compare-fill compare-fill--gm"
                    style={{ width: `${(Math.max(0, metric.gridMind) / max) * 100}%` }}
                  />
                </div>
                <span className="compare-value compare-value--gm">
                  {metric.format(metric.gridMind)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function EnergyMixBars({
  items,
}: {
  items: { key: string; label: string; value: number; color: string; display: string }[];
}) {
  const max = Math.max(...items.map((item) => item.value), 1);

  return (
    <div className="mix">
      {items.map((item) => (
        <div className="mix-row" key={item.key}>
          <div className="mix-head">
            <span className="mix-label">
              <span
                className="legend-swatch"
                style={{ background: item.color }}
                aria-hidden="true"
              />
              {item.label}
            </span>
            <span className="mix-value">{item.display}</span>
          </div>
          <div className="mix-track">
            <div
              className="mix-fill"
              style={{
                width: `${(Math.max(0, item.value) / max) * 100}%`,
                background: item.color,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
