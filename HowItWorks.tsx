import { Button, Note, Panel, PanelHead, SectionHead, SimBadge } from '../components/ui/Primitives';
import { Reveal } from '../components/ui/Reveal';
import { Pipeline, SYSTEM_STEPS } from '../components/visuals/Pipeline';
import { Icon, type IconName } from '../components/ui/Icon';

const moduleDetails: {
  key: string;
  icon: IconName;
  number: string;
  title: string;
  body: string;
  inputs: string[];
  output: string;
}[] = [
  {
    key: 'solar',
    icon: 'sun',
    number: '01',
    title: 'Solar forecasting',
    body: 'Predicts renewable energy generation using solar geometry, array characteristics and available weather information. The output is an expected generation profile rather than a single number, so the optimiser can plan across the day.',
    inputs: ['Weather and irradiance inputs', 'Array capacity and orientation', 'Historical output'],
    output: 'Expected solar profile, kW per interval',
  },
  {
    key: 'demand',
    icon: 'home',
    number: '02',
    title: 'Demand forecasting',
    body: 'Estimates future electricity consumption across the community from historical load shapes, time of day and weekday patterns. The platform separates the forecast from the load data source so a metered feed can replace the simulator later.',
    inputs: ['Historical community load', 'Calendar and occupancy patterns', 'Forecast horizon'],
    output: 'Expected demand profile, kW per interval',
  },
  {
    key: 'battery',
    icon: 'battery',
    number: '03',
    title: 'Battery optimisation',
    body: 'Determines when batteries should charge, discharge or retain stored energy. Decisions respect state-of-charge limits, power limits and round-trip efficiency, and prioritise solar surplus over grid charging.',
    inputs: ['Solar and demand forecasts', 'State of charge', 'Tariff schedule'],
    output: 'Charge / discharge / hold for each interval',
  },
  {
    key: 'grid',
    icon: 'grid',
    number: '04',
    title: 'Grid management',
    body: 'Coordinates electricity imports and exports to balance community energy requirements. The objective is not zero grid use — it is deliberate grid use: import at the cheapest, lowest-impact moments and export only when it adds value.',
    inputs: ['Battery dispatch plan', 'Import and export limits', 'Tariff structure'],
    output: 'Grid setpoints and exchange schedule',
  },
  {
    key: 'analysis',
    icon: 'chart',
    number: '05',
    title: 'Performance analysis',
    body: 'Evaluates system performance through energy efficiency, cost, grid dependency, peak demand and renewable utilisation. Results are compared against a conventional baseline using identical weather, load and tariffs.',
    inputs: ['Measured or simulated outcomes', 'Conventional baseline', 'Evaluation metrics'],
    output: 'Performance report and next-cycle inputs',
  },
];

export function HowItWorks() {
  return (
    <>
      <section className="page-head">
        <div className="container">
          <p className="eyebrow">
            <span className="eyebrow-dash" aria-hidden="true" />
            System architecture
          </p>
          <h1>One system. Five coordinated decisions.</h1>
          <p className="page-lead">
            GridMind coordinates forecasting, storage and grid exchange in a closed
            control loop. Each module has a defined input and output contract, so a
            single stage can be upgraded — or connected to real data — without
            rewriting the platform.
          </p>
          <div className="page-head-meta">
            <SimBadge label="Reference architecture" />
            <span className="page-meta-item">5 modules · 1 loop</span>
            <span className="page-meta-item">Forecast-ready interfaces</span>
          </div>
        </div>
      </section>

      <section className="section section--flush">
        <div className="container">
          <Reveal>
            <Panel>
              <PanelHead
                title="The control loop"
                sub="Generation and load are forecast, dispatched, scheduled and evaluated in sequence."
                right={<span className="mono-tag">closed-loop</span>}
              />
              <Pipeline />
            </Panel>
          </Reveal>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <Reveal>
            <SectionHead
              eyebrow="Module reference"
              title="What each stage consumes and produces."
              lead="The contracts below are the integration surface. Today they are filled by the deterministic simulator; in a pilot, they would be filled by inverters, smart meters and weather services."
            />
          </Reveal>

          <div className="module-grid">
            {moduleDetails.map((module, index) => (
              <Reveal key={module.key} delay={index * 50}>
                <article className="module-card">
                  <div className="module-top">
                    <span className="module-icon">
                      <Icon name={module.icon} size={20} />
                    </span>
                    <span className="module-number">{module.number}</span>
                  </div>
                  <h3>{module.title}</h3>
                  <p>{module.body}</p>
                  <div className="module-io">
                    <div>
                      <p className="io-label">Consumes</p>
                      <ul>
                        {module.inputs.map((input) => (
                          <li key={input}>{input}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="io-label">Produces</p>
                      <p className="io-output">{module.output}</p>
                    </div>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section section--line">
        <div className="container split">
          <Reveal className="split-copy">
            <SectionHead
              eyebrow="Why connected"
              title="Isolated features optimise parts. This optimises the system."
              lead="A strong solar forecast is useful. A strong battery schedule is useful. But the value comes from the coupling: the battery schedule depends on the forecast, the grid schedule depends on the battery, and the next forecast depends on what was learned."
            />
            <ul className="check-list">
              <li>
                <Icon name="check" size={15} />
                Storage is charged from expected surplus, not from arbitrary schedules
              </li>
              <li>
                <Icon name="check" size={15} />
                Grid imports are shifted away from expensive, high-demand windows
              </li>
              <li>
                <Icon name="check" size={15} />
                Renewable utilisation and peak demand are evaluated together, not in isolation
              </li>
              <li>
                <Icon name="check" size={15} />
                Every decision is traceable to the forecast and constraints that produced it
              </li>
            </ul>
          </Reveal>

          <Reveal delay={80} className="split-panel">
            <Panel className="stack-panel">
              <PanelHead title="Integration layers" sub="Separation of data, decisions and presentation." />
              <div className="arch">
                <div className="arch-layer">
                  <span className="arch-tag">Layer 03</span>
                  <div>
                    <h4>Interface</h4>
                    <p>Dashboard components read a typed simulation contract. No business logic in the view.</p>
                  </div>
                  <span className="arch-status arch-status--built">built</span>
                </div>
                <div className="arch-layer">
                  <span className="arch-tag">Layer 02</span>
                  <div>
                    <h4>Decision layer</h4>
                    <p>Rule-based dispatch behind a pure function. Replaceable by a forecasting or optimisation model.</p>
                  </div>
                  <span className="arch-status arch-status--built">built</span>
                </div>
                <div className="arch-layer">
                  <span className="arch-tag">Layer 01</span>
                  <div>
                    <h4>Data adapters</h4>
                    <p>Seeded simulator now; weather, meter and inverter feeds later. Same output shape.</p>
                  </div>
                  <span className="arch-status">swap-in</span>
                </div>
              </div>
              <Note>
                GridMind does not currently run AI models. The dispatch logic is an
                explicit, documented heuristic so its behaviour can be inspected and
                compared. That is a deliberate choice, not a hidden limitation.
              </Note>
            </Panel>
          </Reveal>
        </div>
      </section>

      <section className="section section--line">
        <div className="container">
          <div className="table-wrap">
            <table className="data-table">
              <caption>
                Module contracts at a glance
                <span> — horizons shown as implemented in the simulation</span>
              </caption>
              <thead>
                <tr>
                  <th scope="col">Stage</th>
                  <th scope="col">Consumes</th>
                  <th scope="col">Produces</th>
                  <th scope="col">Horizon</th>
                </tr>
              </thead>
              <tbody>
                {SYSTEM_STEPS.map((step) => (
                  <tr key={step.key}>
                    <td>{step.title}</td>
                    <td className="table-muted">
                      {step.key === 'solar' && 'Weather, array model, history'}
                      {step.key === 'demand' && 'Load history, calendar patterns'}
                      {step.key === 'battery' && 'Forecasts, state of charge, tariffs'}
                      {step.key === 'grid' && 'Dispatch plan, exchange limits'}
                      {step.key === 'analysis' && 'Outcomes, baseline, metric definitions'}
                    </td>
                    <td className="table-muted">
                      {step.key === 'solar' && 'Expected generation profile'}
                      {step.key === 'demand' && 'Expected consumption profile'}
                      {step.key === 'battery' && 'Charge / discharge schedule'}
                      {step.key === 'grid' && 'Import / export setpoints'}
                      {step.key === 'analysis' && 'Metrics and feedback'}
                    </td>
                    <td className="mono-cell">
                      {step.key === 'analysis' ? 'rolling' : '24 h default'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="inline-cta">
            <p>See these contracts produce a working control room.</p>
            <Button to="/dashboard" size="sm">
              Open the dashboard
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
