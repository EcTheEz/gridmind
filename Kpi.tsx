import type { ReactNode } from 'react';
import { Icon, type IconName } from './Icon';

export function Kpi({
  label,
  value,
  unit,
  sub,
  icon,
  tone = 'green',
  progress,
}: {
  label: string;
  value: ReactNode;
  unit?: string;
  sub?: string;
  icon?: IconName;
  tone?: 'green' | 'cyan' | 'blue' | 'amber';
  progress?: number;
}) {
  return (
    <div className="kpi" data-tone={tone}>
      <div className="kpi-top">
        <span className="kpi-label">{label}</span>
        {icon && (
          <span className="kpi-icon">
            <Icon name={icon} size={15} />
          </span>
        )}
      </div>
      <p className="kpi-value">
        {value}
        {unit && <span className="kpi-unit">{unit}</span>}
      </p>
      {typeof progress === 'number' && (
        <div className="kpi-meter" aria-hidden="true">
          <div style={{ width: `${Math.min(100, Math.max(0, progress))}%` }} />
        </div>
      )}
      {sub && <p className="kpi-sub">{sub}</p>}
    </div>
  );
}
