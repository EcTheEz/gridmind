import { useState } from 'react';
import { getSimulation } from '../data/simulator';
import type { Sample } from '../data/types';
import { CompareBars, type CompareMetric } from '../components/charts/Compare';
import {
  Badge,
  Button,
  Note,
  Panel,
  PanelHead,
  SectionHead,
  SimBadge,
} from '../components/ui/Primitives';
import { Reveal } from '../components/ui/Reveal';
import { Icon } from '../components/ui/Icon';
import { kw, kwh, nf, pct, rm } from '../lib/format';

const rules = [
  {
    condition: 'solar − demand > 0',
    title: 'Absorb the surplus first',
    body: 'Charge the battery up to its power and headroom limits. Only the remainder is exported, because on-site use avoids a future import at a higher tariff.',
    tone: 'green',
  },
  {
    condition: 'solar − demand < 0',
    title: 'Discharge to the reserve',
    body: 'Serve the deficit from storage while keeping a reserve. The reserve is lower during the evening peak, where the value of stored energy is highest.',
    tone: 'cyan',
  },
  {
    condition: 'soc < threshold & off-peak',
    title: 'Top up cheaply',
    body: 'Between 01:00 and 05:00, if the battery is below 30%, top it up from low-tariff grid energy so it starts the solar day with usable headroom.',
    tone: 'blue',
  },
  {
    condition: 'otherwise',
    title: 'Hold, and avoid cycling',
    body: 'When there is no clear value in moving energy, the optimiser holds the battery state. Avoided cycling is itself a form of efficiency.',
    tone: 'amber',
  },
];

function actionLabel(action: Sample['action']) {
  switch (action) {
    case 'charge-solar':
      return 'Charging from solar surplus';
    case 'charge-grid':
      return 'Off-peak grid top-up';
    case 'discharge':
      return 'Discharging to supply demand';
    case 'export':
      return 'Exporting surplus';
    default:
      return 'Holding charge';
  }
}

function narrative(sample: Sample): string {
  const surplus = sample.solar - sample.demand;
  switch (sample.action) {
    case 'charge-solar':
      return `Solar generation of ${kw(sample.solar)} exceeds community demand by ${kw(
        surplus,
      )}. GridMind routes ${kw(sample.batteryPower)} into the battery, keeping that energy on site instead of exporting it at the feed-in rate.`;
    case 'discharge':
      return `Demand of ${kw(sample.demand)} is higher than generation. GridMind discharges ${kw(
        -sample.batteryPower,
      )} from storage, reducing grid import during a ${
        sample.price >= 0.42 ? 'peak' : 'off-peak'
      } tariff window of ${rm(sample.price, 3)}/kWh.`;
    case 'charge-grid': {
      const topUp = sample.batteryPower;
      return `This is an off-peak hour. With state of charge at ${pct(
        sample.soc,
        0,
      )}, GridMind draws ${kw(topUp)} from the grid to top the battery up at ${rm(
        sample.price,
        3,
      )}/kWh, ahead of the morning demand ramp.`;
    }
    case 'export':
      return `Generation covers demand and the battery cannot absorb more. GridMind exports ${kw(
        sample.gridExport,
      )} to the grid at the feed-in tariff rather than curtailing the array.`;
    default:
      return `Generation and demand are closely balanced at this instant. GridMind holds the battery steady and lets the grid cover the remaining ${kw(
        sample.gridImport,
      )} without unnecessary cycling.`;
  }
}

function DayStrip({ samples, index }: { samples: Sample[]; index: number }) {
  const width = 720;
  const height = 158;
  const pad = 8;
  const max = Math.max(...samples.map((sample) => Math.max(sample.solar, sample.demand)), 1);
  const point = (value: number) =>
    height - pad - (value / max) * (height - pad * 2);

  const path = (key: 'solar' | 'demand') =>
    samples
      .map((sample, i) => {
        const x = pad + (i / (samples.length - 1)) * (width - pad * 2);
        return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${point(sample[key]).toFixed(1)}`;
      })
      .join(' ');

  const markerX = pad + (index / (samples.length - 1)) * (width - pad * 2);
  const active = samples[index];

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="day-strip" aria-hidden="true">
      {[0.25, 0.5, 0.75].map((fraction) => (
        <line
          key={fraction}
          x1={pad}
          x2={width - pad}
          y1={pad + (height - pad * 2) * fraction}
          y2={pad + (height - pad * 2) * fraction}
          className="day-strip-grid"
        />
      ))}
      <path d={path('solar')} className="day-strip-solar" />
      <path d={path('demand')} className="day-strip-demand" />
      <line
        x1={markerX}
        x2={markerX}
        y1={pad}
        y2={height - pad}
        className="day-strip-marker"
      />
      <circle cx={markerX} cy={point(active.solar)} r="4" className="day-strip-dot day-strip-dot--solar" />
      <circle cx={markerX} cy={point(active.demand)} r="4" className="day-strip-dot day-strip-dot--demand" />
    </svg>
  );
}

export function Optimisation() {
  const sim = getSimulation('24h');
  const mm = sim.gridMind;
  const conv = sim.conventional;
  const [index, setIndex] = useState(56);
  const sample = sim.samples[index];

  const metrics: CompareMetric[] = [
    {
      key: 'cost',
      label: 'Electricity cost',
      conventional: conv.cost,
      gridMind: mm.cost,
      better: 'lower',
      format: (value) => rm(value),
    },
    {
      key: 'import',
      label: 'Grid electricity imports',
      conventional: conv.importKwh,
      gridMind: mm.importKwh,
      better: 'lower',
      format: (value) => kwh(value),
    },
    {
      key: 'utilisation',
      label: 'Renewable utilisation',
      conventional: conv.renewableUtilisation,
      gridMind: mm.renewableUtilisation,
      better: 'higher',
      format: (value) => pct(value, 0),
    },
    {
      key: 'peak',
      label: 'Peak grid import',
      conventional: conv.peakImport,
      gridMind: mm.peakImport,
      better: 'lower',
      format: (value) => kw(value),
    },
    {
      key: 'battery',
      label: 'Battery utilisation',
      conventional: conv.batteryUtilisation,
      gridMind: mm.batteryUtilisation,
      better: 'higher',
      format: (value) => pct(value, 0),
    },
  ];

  return (
    <>
      <section className="page-head">
        <div className="container">
          <p className="eyebrow">
            <span className="eyebrow-dash" aria-hidden="true" />
            Decision logic
          </p>
          <h1>Intelligent optimisation, made inspectable.</h1>
          <p className="page-lead">
            GridMind does not treat storage as a fixed schedule. It evaluates expected
            generation, expected demand, state of charge and tariff conditions, then
            chooses the action with the clearest system-level value.
          </p>
          <div className="page-head-meta">
            <SimBadge label="Illustrative scenario" />
            <span className="page-meta-item">Rule-based heuristic</span>
            <span className="page-meta-item">Replaceable decision layer</span>
          </div>
        </div>
      </section>

      <section className="section section--flush">
        <div className="container">
          <Reveal>
            <SectionHead
              eyebrow="Control policy"
              title="Four rules, evaluated every interval."
              lead="The policy is intentionally simple enough to audit. Each interval, GridMind compares forecast supply with forecast demand and applies the first matching rule."
              meta={<span className="mono-tag">deterministic policy</span>}
            />
          </Reveal>
          <div className="rule-grid">
            {rules.map((rule, indexValue) => (
              <Reveal key={rule.condition} delay={indexValue * 60}>
                <article className="rule-card" data-tone={rule.tone}>
                  <span className="rule-condition">{rule.condition}</span>
                  <h3>{rule.title}</h3>
                  <p>{rule.body}</p>
                </article>
              </Reveal>
            ))}
          </div>

          <Reveal delay={80}>
            <div className="objective-panel">
              <span className="objective-label">Surrogate objective</span>
              <code>
                minimise&nbsp; cost + w₁·peakImport + w₂·gridImport
              </code>
              <span className="objective-constraints">
                subject to&nbsp; SOC ∈ [12%, 95%] · |P| ≤ 250 kW · reserve ≥ 14% at peak
              </span>
              <p>
                Weights are fixed heuristics, not tuned or learned parameters. The
                formulation is exposed so that a stronger optimiser can replace it
                without changing the interface.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="section section--line">
        <div className="container">
          <Reveal>
            <Panel>
              <PanelHead
                title="Walk through a simulated day"
                sub="Move the slider to inspect the decision GridMind makes at each point in the 24-hour window."
                right={<Badge tone="green" dot>interactive</Badge>}
              />
              <div className="scenario">
                <DayStrip samples={sim.samples} index={index} />
                <div className="scenario-controls">
                  <div className="scenario-time">
                    <span className="scenario-time-label">Selected sample</span>
                    <span className="scenario-time-value">{sample.fullLabel}</span>
                  </div>
                  <input
                    className="range"
                    type="range"
                    min={0}
                    max={sim.samples.length - 1}
                    value={index}
                    onChange={(event) => setIndex(Number(event.target.value))}
                    aria-label="Select a point in the simulated 24-hour day"
                    aria-valuetext={`${sample.fullLabel}, ${actionLabel(sample.action)}`}
                  />
                  <div className="range-labels" aria-hidden="true">
                    <span>00:00</span>
                    <span>06:00</span>
                    <span>12:00</span>
                    <span>18:00</span>
                    <span>24:00</span>
                  </div>
                </div>

                <div className="scenario-body">
                  <div className="scenario-readouts">
                    <div>
                      <span>Solar</span>
                      <strong>{kw(sample.solar)}</strong>
                    </div>
                    <div>
                      <span>Demand</span>
                      <strong>{kw(sample.demand)}</strong>
                    </div>
                    <div>
                      <span>Battery</span>
                      <strong>
                        {sample.batteryPower >= 0 ? '+' : ''}
                        {nf(sample.batteryPower)} kW
                      </strong>
                    </div>
                    <div>
                      <span>Grid import</span>
                      <strong>{kw(sample.gridImport)}</strong>
                    </div>
                    <div>
                      <span>Tariff</span>
                      <strong>{rm(sample.price, 3)}/kWh</strong>
                    </div>
                  </div>

                  <div className="scenario-narrative">
                    <span className="scenario-action">
                      <Icon name="pulse" size={14} />
                      {actionLabel(sample.action)}
                    </span>
                    <p>{narrative(sample)}</p>
                    <span className="scenario-soc">
                      State of charge {pct(sample.soc, 0)} · {kw(Math.abs(sample.batteryPower))}{' '}
                      {sample.batteryPower > 0 ? 'into storage' : sample.batteryPower < 0 ? 'from storage' : 'inactive'}
                    </span>
                  </div>
                </div>
              </div>
            </Panel>
          </Reveal>
        </div>
      </section>

      <section className="section section--line">
        <div className="container split split--wide">
          <Reveal className="split-copy">
            <SectionHead
              eyebrow="Comparison"
              title="Conventional management vs GridMind."
              lead="Both scenarios use identical simulated solar generation, identical community demand and identical tariffs. The only difference is the decision layer and the presence of storage."
            />
            <ul className="check-list">
              <li>
                <Icon name="check" size={15} />
                Same seeded weather and load profile
              </li>
              <li>
                <Icon name="check" size={15} />
                Same battery capacity across both runs
              </li>
              <li>
                <Icon name="check" size={15} />
                Baseline has no storage dispatch — the grid absorbs every imbalance
              </li>
              <li>
                <Icon name="check" size={15} />
                All values are model output, not measured performance
              </li>
            </ul>
            <Note tone="amber">
              These comparisons illustrate the behaviour of the model. They are not
              verified experimental results and should not be quoted as achieved savings.
            </Note>
          </Reveal>

          <Reveal delay={80} className="split-panel">
            <Panel>
              <PanelHead
                title="24-hour window"
                sub="Simulated dispatch outcomes"
                right={<SimBadge label="Illustrative" />}
              />
              <CompareBars metrics={metrics} />
            </Panel>
          </Reveal>
        </div>
      </section>

      <section className="section section--line">
        <div className="container">
          <Reveal>
            <SectionHead
              eyebrow="Decision record"
              title="Every action has a reason and a consequence."
              lead="The table below is the trace GridMind produces for the simulated window. A pilot deployment would attach timestamps and telemetry to the same record."
            />
          </Reveal>
          <div className="table-wrap">
            <table className="data-table">
              <caption>Representative dispatch samples from the simulated day</caption>
              <thead>
                <tr>
                  <th scope="col">Time</th>
                  <th scope="col">Solar</th>
                  <th scope="col">Demand</th>
                  <th scope="col">Action</th>
                  <th scope="col">Battery</th>
                  <th scope="col">Grid</th>
                  <th scope="col">SOC</th>
                </tr>
              </thead>
              <tbody>
                {[28, 40, 52, 62, 74, 84].map((row) => {
                  const entry = sim.samples[row];
                  return (
                    <tr key={entry.t}>
                      <td className="mono-cell">{entry.fullLabel}</td>
                      <td className="mono-cell">{kw(entry.solar)}</td>
                      <td className="mono-cell">{kw(entry.demand)}</td>
                      <td>{actionLabel(entry.action)}</td>
                      <td className="mono-cell">
                        {entry.batteryPower >= 0 ? '+' : ''}
                        {nf(entry.batteryPower)} kW
                      </td>
                      <td className="mono-cell">
                        {entry.gridImport > 1
                          ? `${kw(entry.gridImport)} in`
                          : entry.gridExport > 1
                            ? `${kw(entry.gridExport)} out`
                            : '—'}
                      </td>
                      <td className="mono-cell">{pct(entry.soc, 0)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="section-footnote">
            <span aria-hidden="true">↳</span> Battery column: positive values charge, negative
            values discharge. Grid column shows import or export at that instant.
          </p>

          <div className="inline-cta">
            <p>Inspect the same decisions on the live dashboard clock.</p>
            <Button to="/dashboard" size="sm">
              Open the dashboard
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
