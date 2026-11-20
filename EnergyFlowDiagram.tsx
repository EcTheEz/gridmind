import { Icon } from '../ui/Icon';
import { kw, nf } from '../../lib/format';

interface Props {
  solar: number;
  demand: number;
  soc: number;
  batteryPower: number;
  gridImport: number;
  gridExport: number;
}

function Node({
  x,
  y,
  width,
  title,
  value,
  detail,
  icon,
  color,
}: {
  x: number;
  y: number;
  width: number;
  title: string;
  value: string;
  detail: string;
  icon: 'sun' | 'battery' | 'grid' | 'home';
  color: string;
}) {
  return (
    <g className="flow-node" transform={`translate(${x} ${y})`}>
      <rect width={width} height="100" rx="12" />
      <g transform="translate(16 18)" style={{ color }}>
        <rect width="38" height="38" rx="9" className="flow-node-icon" />
        <g transform="translate(7 7)">
          <Icon name={icon} size={24} strokeWidth={1.5} />
        </g>
      </g>
      <text x="66" y="24" className="flow-node-title">
        {title}
      </text>
      <text x="66" y="50" className="flow-node-value">
        {value}
      </text>
      <text x="66" y="70" className="flow-node-detail">
        {detail}
      </text>
    </g>
  );
}

function Link({
  d,
  color,
  active,
  reverse,
  delay,
}: {
  d: string;
  color: string;
  active: boolean;
  reverse: boolean;
  delay: number;
}) {
  return (
    <g
      className="flow-link"
      data-active={active ? 'true' : 'false'}
      data-reverse={reverse ? 'true' : 'false'}
    >
      <path d={d} className="flow-link-base" />
      <path
        d={d}
        className="flow-link-packet"
        style={{ stroke: color, animationDelay: `${delay}s` }}
      />
    </g>
  );
}

export function EnergyFlowDiagram({
  solar,
  demand,
  soc,
  batteryPower,
  gridImport,
  gridExport,
}: Props) {
  const charging = batteryPower > 0.5;
  const discharging = batteryPower < -0.5;
  const exporting = gridExport > gridImport;
  const batteryMagnitude = Math.abs(batteryPower);

  return (
    <svg
      viewBox="0 0 780 430"
      className="flow-diagram"
      role="img"
      aria-label={`Energy flow: solar ${kw(solar)}, community demand ${kw(
        demand,
      )}, battery ${nf(soc, 0)} percent, grid import ${kw(
        gridImport,
      )}, grid export ${kw(gridExport)}.`}
    >
      <defs>
        <radialGradient id="flow-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#35f0a4" stopOpacity="0.1" />
          <stop offset="100%" stopColor="#35f0a4" stopOpacity="0" />
        </radialGradient>
      </defs>

      <ellipse cx="390" cy="215" rx="230" ry="150" fill="url(#flow-glow)" />

      <Link
        d="M214 74 C270 80 278 128 288 168"
        color="#35f0a4"
        active={solar > 1}
        reverse={false}
        delay={0}
      />
      <Link
        d="M566 74 C510 80 502 128 492 168"
        color="#4b8cff"
        active={charging || discharging}
        reverse={charging}
        delay={0.6}
      />
      <Link
        d="M390 306 L390 278"
        color="#8bd8ff"
        active={gridImport > 1 || gridExport > 1}
        reverse={exporting}
        delay={0.3}
      />

      <Node
        x={24}
        y={24}
        width={190}
        title="Solar generation"
        value={kw(solar)}
        detail={solar > 1 ? 'Producing now' : 'No output'}
        icon="sun"
        color="#35f0a4"
      />
      <Node
        x={566}
        y={24}
        width={190}
        title="Battery storage"
        value={`${nf(soc, 0)}% SOC`}
        detail={
          charging
            ? `${kw(batteryPower)} charging`
            : discharging
              ? `${kw(batteryMagnitude)} discharging`
              : 'Holding charge'
        }
        icon="battery"
        color="#4b8cff"
      />

      <g className="flow-hub" transform="translate(285 152)">
        <rect width="210" height="126" rx="14" />
        <text x="20" y="28" className="flow-hub-eyebrow">
          COMMUNITY BUS
        </text>
        <text x="20" y="62" className="flow-hub-value">
          {kw(demand)}
        </text>
        <text x="20" y="84" className="flow-hub-detail">
          Community demand
        </text>
        <text x="20" y="106" className="flow-hub-detail flow-hub-detail--dim">
          GridMind dispatch active
        </text>
        <circle cx="184" cy="22" r="3" className="flow-hub-dot" />
      </g>

      <Node
        x={295}
        y={306}
        width={190}
        title="Utility grid"
        value={exporting ? kw(gridExport) : kw(gridImport)}
        detail={exporting ? 'Exporting to grid' : 'Importing from grid'}
        icon="grid"
        color="#8bd8ff"
      />

      <text x="256" y="118" className="flow-label" textAnchor="middle">
        {solar > 1 ? `${kw(solar)} in` : 'idle'}
      </text>
      <text x="524" y="118" className="flow-label" textAnchor="middle">
        {charging ? `${kw(batteryPower)} in` : discharging ? `${kw(batteryMagnitude)} out` : 'idle'}
      </text>
      <text x="400" y="296" className="flow-label" textAnchor="start">
        {gridImport > 1 ? `${kw(gridImport)} in` : gridExport > 1 ? `${kw(gridExport)} out` : 'idle'}
      </text>
    </svg>
  );
}
