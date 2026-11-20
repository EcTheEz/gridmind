import { useState } from 'react';
import type { Period } from '../data/types';
import { getSimulation, PERIOD_META } from '../data/simulator';
import { SeriesChart } from '../components/charts/SeriesChart';
import { EnergyFlowDiagram } from '../components/visuals/EnergyFlowDiagram';
import { EnergyMixBars } from '../components/charts/Compare';
import { Kpi } from '../components/ui/Kpi';
import { Badge, Note, Panel, PanelHead, SimBadge } from '../components/ui/Primitives';
import { Icon } from '../components/ui/Icon';
import { useLiveClock } from '../lib/hooks';
import { kw, kwh, nf, pct, rm } from '../lib/format';

const periods: { key: Period; label: string; note: string }[] = [
  { key: '24h', label: '24 hours', note: '15-min' },
  { key: '7d', label: '7 days', note: 'hourly' },
  { key: '30d', label: '30 days', note: '3-hour' },
];

function actionLabel(action: string) {
  switch (action) {
    case 'charge-solar':
      return 'Charging from solar surplus';
    case 'charge-grid':
      return 'Off-peak grid top-up';
    case 'discharge':
      return 'Discharging to the community';
    case 'export':
      return 'Exporting surplus';
    default:
      return 'Holding charge';
  }
}

export function Dashboard() {
  const [period, setPeriod] = useState<Period>('24h');
  const sim = getSimulation(period);
  const sim24 = getSimulation('24h');
  const { index, playing, setPlaying } = useLiveClock(sim24.samples.length);

  const now = sim24.samples[index];
  const gm24 = sim24.gridMind;
  const gm = sim.gridMind;
  const conventional = sim.conventional;
  const stepHours = PERIOD_META[period].hours / sim.samples.length;

  const labels = sim.samples.map((sample) => sample.label);
  const fullLabels = sim.samples.map((sample) => sample.fullLabel);

  const dischargedKwh = sim.samples.reduce(
    (total, sample) =>
      total + (sample.batteryPower < 0 ? -sample.batteryPower : 0) * stepHours,
    0,
  );

  const costReduction =
    conventional.cost > 0 && gm.cost < conventional.cost
      ? ((conventional.cost - gm.cost) / conventional.cost) * 100
      : 0;

  return (
    <>
      <section className="page-head page-head--compact">
        <div className="container">
          <div className="dash-head-row">
            <div>
              <p className="eyebrow">
                <span className="eyebrow-dash" aria-hidden="true" />
                Control centre
              </p>
              <h1>Live Energy Dashboard</h1>
              <p className="page-lead">
                A simulated energy-management view of one community: generation,
                demand, storage and grid exchange moving through a full day.
              </p>
            </div>
            <div className="dash-head-side">
              <SimBadge label="Simulated — not live infrastructure" />
              <div className="dash-clock">
                <span className="dash-clock-label">Model time</span>
                <span className="dash-clock-value">{now.fullLabel}</span>
                <span className="dash-clock-sub">
                  sample {index + 1} / {sim24.samples.length}
                </span>
              </div>
            </div>
          </div>

          <div className="dash-toolbar">
            <div className="live-controls">
              <button
                type="button"
                className="play-button"
                onClick={() => setPlaying(!playing)}
                aria-pressed={playing}
                aria-label={playing ? 'Pause the simulation clock' : 'Play the simulation clock'}
              >
                <Icon name={playing ? 'pause' : 'play'} size={15} />
                <span>{playing ? 'Pause' : 'Play'}</span>
              </button>
              <span className="live-tag">
                <span className="status-dot" aria-hidden="true" />
                {playing ? 'Stepping through the day' : 'Clock paused'}
              </span>
              <span className="toolbar-action">{actionLabel(now.action)}</span>
            </div>

            <div className="segmented" role="group" aria-label="Select analysis period">
              {periods.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  className="segment"
                  data-active={period === item.key ? 'true' : 'false'}
                  aria-pressed={period === item.key}
                  onClick={() => setPeriod(item.key)}
                >
                  <span>{item.label}</span>
                  <small>{item.note}</small>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="section section--flush">
        <div className="container">
          <div className="kpi-grid">
            <Kpi
              label="Solar generation"
              value={nf(now.solar)}
              unit="kW"
              icon="sun"
              tone="green"
              sub={now.solar > 1 ? 'Producing now' : 'No solar output'}
              progress={(now.solar / sim24.solarPeakKw) * 100}
            />
            <Kpi
              label="Community demand"
              value={nf(now.demand)}
              unit="kW"
              icon="home"
              tone="cyan"
              sub="Across the modelled community"
            />
            <Kpi
              label="Battery charge"
              value={nf(now.soc, 0)}
              unit="%"
              icon="battery"
              tone="blue"
              sub={`${kw(Math.abs(now.batteryPower))} ${
                now.batteryPower > 0 ? 'charging' : now.batteryPower < 0 ? 'discharging' : 'idle'
              }`}
              progress={now.soc}
            />
            <Kpi
              label="Grid import"
              value={nf(now.gridImport)}
              unit="kW"
              icon="plug"
              tone="amber"
              sub={now.gridImport > 1 ? 'Supplying the community' : 'No import'}
            />
            <Kpi
              label="Grid export"
              value={nf(now.gridExport)}
              unit="kW"
              icon="arrowUpRight"
              tone="cyan"
              sub={now.gridExport > 1 ? 'Surplus to the grid' : 'No export'}
            />
            <Kpi
              label="Renewable utilisation"
              value={nf(gm24.renewableUtilisation, 0)}
              unit="%"
              icon="leaf"
              tone="green"
              sub="24 h · on-site solar use"
            />
            <Kpi
              label="Estimated electricity cost"
              value={rm(gm24.cost)}
              icon="bolt"
              tone="amber"
              sub="Projected net cost · 24 h window"
            />
          </div>
        </div>
      </section>

      <section className="section section--tight">
        <div className="container">
          <Panel>
            <PanelHead
              title="Energy flow"
              sub="Power movement at the current simulation sample. Arrow direction follows the active flow."
              right={
                <>
                  <Badge tone="green" dot>
                    live sample
                  </Badge>
                  <SimBadge label="Model" />
                </>
              }
            />
            <EnergyFlowDiagram
              solar={now.solar}
              demand={now.demand}
              soc={now.soc}
              batteryPower={now.batteryPower}
              gridImport={now.gridImport}
              gridExport={now.gridExport}
            />
            <p className="panel-caption">
              Solar feeds the community bus first. Any surplus charges the battery before
              export; any deficit is covered by the battery down to its reserve, then by
              the grid. {now.price >= 0.42 ? 'A peak tariff applies at this time.' : 'An off-peak tariff applies at this time.'}
            </p>
          </Panel>
        </div>
      </section>

      <section className="section section--tight">
        <div className="container">
          <div className="chart-grid">
            <Panel>
              <PanelHead
                title="Solar generation over time"
                sub={`${PERIOD_META[period].label} · ${sim.resolution}`}
                right={<span className="mono-tag">kW</span>}
              />
              <SeriesChart
                labels={labels}
                fullLabels={fullLabels}
                height={216}
                leftUnit="kW"
                ariaLabel="Simulated solar generation over the selected period"
                series={[
                  {
                    key: 'solar',
                    name: 'Solar generation',
                    color: '#35f0a4',
                    values: sim.samples.map((sample) => sample.solar),
                    kind: 'area',
                    format: (value) => kw(value),
                  },
                ]}
              />
            </Panel>

            <Panel>
              <PanelHead
                title="Community demand over time"
                sub={`${PERIOD_META[period].label} · ${sim.resolution}`}
                right={<span className="mono-tag">kW</span>}
              />
              <SeriesChart
                labels={labels}
                fullLabels={fullLabels}
                height={216}
                leftUnit="kW"
                ariaLabel="Simulated community electricity demand over the selected period"
                series={[
                  {
                    key: 'demand',
                    name: 'Community demand',
                    color: '#22d3ee',
                    values: sim.samples.map((sample) => sample.demand),
                    kind: 'area',
                    format: (value) => kw(value),
                  },
                ]}
              />
            </Panel>

            <Panel>
              <PanelHead
                title="Battery state of charge"
                sub="Modelled 600 kWh / 250 kW community battery"
                right={<span className="mono-tag">SOC</span>}
              />
              <SeriesChart
                labels={labels}
                fullLabels={fullLabels}
                height={216}
                rightUnit="%"
                rightMax={100}
                ariaLabel="Simulated battery state of charge over the selected period"
                series={[
                  {
                    key: 'soc',
                    name: 'State of charge',
                    color: '#4b8cff',
                    values: sim.samples.map((sample) => sample.soc),
                    axis: 'right',
                    format: (value) => pct(value, 0),
                  },
                ]}
              />
            </Panel>

            <Panel>
              <PanelHead
                title="Grid import & export"
                sub="Positive exchange with the external grid"
                right={<span className="mono-tag">kW</span>}
              />
              <SeriesChart
                labels={labels}
                fullLabels={fullLabels}
                height={216}
                leftUnit="kW"
                ariaLabel="Simulated grid import and export over the selected period"
                series={[
                  {
                    key: 'import',
                    name: 'Grid import',
                    color: '#4b8cff',
                    values: sim.samples.map((sample) => sample.gridImport),
                    kind: 'area',
                    format: (value) => kw(value),
                  },
                  {
                    key: 'export',
                    name: 'Grid export',
                    color: '#fbbf24',
                    values: sim.samples.map((sample) => sample.gridExport),
                    kind: 'area',
                    format: (value) => kw(value),
                  },
                ]}
              />
            </Panel>
          </div>
        </div>
      </section>

      <section className="section section--tight">
        <div className="container">
          <div className="chart-grid chart-grid--summary">
            <Panel>
              <PanelHead
                title="Energy totals"
                sub={`Generated, consumed and exchanged · ${PERIOD_META[period].label.toLowerCase()}`}
                right={<SimBadge label="Illustrative" />}
              />
              <EnergyMixBars
                items={[
                  {
                    key: 'solar',
                    label: 'Solar generated',
                    value: gm.solarKwh,
                    color: '#35f0a4',
                    display: kwh(gm.solarKwh),
                  },
                  {
                    key: 'demand',
                    label: 'Community demand',
                    value: gm.demandKwh,
                    color: '#22d3ee',
                    display: kwh(gm.demandKwh),
                  },
                  {
                    key: 'import',
                    label: 'Grid import',
                    value: gm.importKwh,
                    color: '#4b8cff',
                    display: kwh(gm.importKwh),
                  },
                  {
                    key: 'export',
                    label: 'Grid export',
                    value: gm.exportKwh,
                    color: '#fbbf24',
                    display: kwh(gm.exportKwh),
                  },
                  {
                    key: 'discharge',
                    label: 'Battery discharge',
                    value: dischargedKwh,
                    color: '#7c8cf8',
                    display: kwh(dischargedKwh),
                  },
                ]}
              />
            </Panel>

            <Panel>
              <PanelHead
                title="Selected window summary"
                sub="GridMind dispatch against a no-storage conventional baseline"
                right={<span className="mono-tag">{sim.windowLabel}</span>}
              />
              <div className="summary-grid">
                <div className="summary-item">
                  <span>Net electricity cost</span>
                  <strong>{rm(gm.cost)}</strong>
                  <em>vs {rm(conventional.cost)} conventional</em>
                </div>
                <div className="summary-item">
                  <span>Grid imports</span>
                  <strong>{kwh(gm.importKwh)}</strong>
                  <em>vs {kwh(conventional.importKwh)}</em>
                </div>
                <div className="summary-item">
                  <span>Peak grid import</span>
                  <strong>{kw(gm.peakImport)}</strong>
                  <em>vs {kw(conventional.peakImport)}</em>
                </div>
                <div className="summary-item">
                  <span>Renewable utilisation</span>
                  <strong>{pct(gm.renewableUtilisation, 0)}</strong>
                  <em>vs {pct(conventional.renewableUtilisation, 0)}</em>
                </div>
              </div>
              <div className="summary-foot">
                <span className="summary-delta">
                  {costReduction > 0 ? `−${nf(costReduction, 1)}% cost` : 'no cost change'}
                </span>
                <span>
                  {pct(gm.selfSufficiency, 0)} of demand served without grid import in the
                  selected window
                </span>
              </div>
            </Panel>
          </div>
        </div>
      </section>

      <section className="section section--tight">
        <div className="container">
          <Panel className="assumptions">
            <PanelHead
              title="Model assumptions"
              sub="Everything on this page is generated from a deterministic simulation."
              right={<SimBadge label="Not measured data" />}
            />
            <dl className="assumption-list">
              <div>
                <dt>Solar array</dt>
                <dd>420 kW modelled peak, weather-attenuated daily profile</dd>
              </div>
              <div>
                <dt>Community load</dt>
                <dd>120 households, morning and evening peaks, weekend variation</dd>
              </div>
              <div>
                <dt>Battery</dt>
                <dd>600 kWh usable, 250 kW power, 12–95% SOC limits, 96% efficiency</dd>
              </div>
              <div>
                <dt>Tariff</dt>
                <dd>RM 0.245/kWh off-peak, RM 0.42/kWh 14:00–22:00, RM 0.10/kWh feed-in</dd>
              </div>
              <div>
                <dt>Baseline</dt>
                <dd>Identical solar and load, no storage and no dispatch</dd>
              </div>
              <div>
                <dt>Determinism</dt>
                <dd>Seeded generator — the same window always produces the same numbers</dd>
              </div>
            </dl>
            <Note tone="amber">
              This dashboard is a demonstration tool. It is not connected to any metering,
              inverter or utility system, and its outputs must not be used for operational
              decisions.
            </Note>
          </Panel>
        </div>
      </section>
    </>
  );
}
