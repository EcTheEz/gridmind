import { Link } from 'react-router-dom';
import { Button, SimBadge } from '../components/ui/Primitives';
import { SectionHead } from '../components/ui/Primitives';
import { Reveal } from '../components/ui/Reveal';
import { EnergyNetwork } from '../components/visuals/EnergyNetwork';
import { Pipeline } from '../components/visuals/Pipeline';
import { SeriesChart } from '../components/charts/SeriesChart';
import { getSimulation } from '../data/simulator';
import { kw, kwh, pct } from '../lib/format';

const stats = [
  { value: '05', label: 'Coordinated modules', note: 'one control loop' },
  { value: '03', label: 'Analysis horizons', note: '24 h · 7 d · 30 d' },
  { value: '04', label: 'Energy assets modelled', note: 'solar · load · battery · grid' },
  { value: '100%', label: 'Labelled simulation', note: 'no live grid connection' },
];

export function Home() {
  const sim = getSimulation('24h');
  const labels = sim.samples.map((sample) => sample.label);
  const fullLabels = sim.samples.map((sample) => sample.fullLabel);

  const solarPeak = Math.max(...sim.samples.map((sample) => sample.solar));
  const demandPeak = Math.max(...sim.samples.map((sample) => sample.demand));
  const conv = sim.conventional;
  const costReduction =
    conv.cost > 0 ? ((conv.cost - sim.gridMind.cost) / conv.cost) * 100 : 0;
  const importReduction =
    conv.importKwh > 0
      ? ((conv.importKwh - sim.gridMind.importKwh) / conv.importKwh) * 100
      : 0;
  const peakReduction =
    conv.peakImport > 0
      ? ((conv.peakImport - sim.gridMind.peakImport) / conv.peakImport) * 100
      : 0;

  return (
    <>
      <section className="hero">
        <div className="container hero-grid">
          <div className="hero-copy">
            <p className="eyebrow">
              <span className="eyebrow-dash" aria-hidden="true" />
              UTM · Intelligent community energy
            </p>
            <h1>
              Powering <span className="grad-text">Smarter</span> Communities.
            </h1>
            <p className="hero-lead">
              GridMind is an intelligent community energy optimisation platform that
              coordinates renewable generation, energy storage and electricity demand to
              create a more efficient and resilient energy ecosystem.
            </p>
            <div className="hero-actions">
              <Button to="/how-it-works">Explore GridMind</Button>
              <Button to="/dashboard" variant="ghost">
                View Live Dashboard
              </Button>
            </div>
            <div className="hero-meta">
              <span className="status-pill">
                <span className="status-dot" aria-hidden="true" />
                Simulation model running
              </span>
              <span className="hero-meta-note">
                Demonstration only — not connected to electrical infrastructure.
              </span>
            </div>
          </div>

          <div className="hero-visual">
            <EnergyNetwork />
          </div>
        </div>

        <div className="container">
          <dl className="stat-strip">
            {stats.map((stat) => (
              <div className="stat" key={stat.label}>
                <dt className="stat-label">{stat.label}</dt>
                <dd className="stat-value">{stat.value}</dd>
                <dd className="stat-note">{stat.note}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <Reveal>
            <SectionHead
              eyebrow="The coordination problem"
              title="Clean energy is not the bottleneck. Coordination is."
              lead="A neighbourhood can have abundant solar, a capable battery and a stable grid connection, yet still waste energy and pay peak prices. The missing layer is the one that decides how these assets work together."
              meta={<SimBadge label="Conceptual overview" />}
            />
          </Reveal>

          <div className="grid grid-3 gap-lg">
            <Reveal delay={60}>
              <article className="problem-card">
                <span className="problem-index">01</span>
                <h3>Generation and demand disagree</h3>
                <p>
                  Solar output peaks around midday, while household demand peaks after
                  sunset. Uncoordinated, the community exports cheap midday energy and
                  imports expensive evening energy.
                </p>
                <div className="problem-visual" aria-hidden="true">
                  <span className="problem-bar problem-bar--solar" />
                  <span className="problem-bar problem-bar--demand" />
                </div>
              </article>
            </Reveal>

            <Reveal delay={120}>
              <article className="problem-card">
                <span className="problem-index">02</span>
                <h3>Storage without a strategy is hardware</h3>
                <p>
                  A battery only creates value when charge and discharge decisions are
                  tied to expected generation, expected load and price signals — not to
                  fixed schedules.
                </p>
                <div className="problem-visual" aria-hidden="true">
                  <span className="problem-bar problem-bar--battery" />
                  <span className="problem-bar problem-bar--battery problem-bar--short" />
                </div>
              </article>
            </Reveal>

            <Reveal delay={180}>
              <article className="problem-card">
                <span className="problem-index">03</span>
                <h3>Peak imports carry the cost</h3>
                <p>
                  The few hours of highest demand often set both the energy bill and the
                  stress on upstream infrastructure. Shaving that peak is where
                  community-scale coordination pays back.
                </p>
                <div className="problem-visual" aria-hidden="true">
                  <span className="problem-bar problem-bar--peak" />
                  <span className="problem-bar problem-bar--peak problem-bar--short" />
                </div>
              </article>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="section section--line">
        <div className="container">
          <Reveal>
            <SectionHead
              eyebrow="One control loop"
              title="Five modules that reason together."
              lead="GridMind is not a list of features. Each module consumes the output of the previous stage, and performance analysis closes the loop by feeding measured outcomes back into forecasting."
              meta={
                <Button to="/how-it-works" variant="ghost" size="sm">
                  How it works
                </Button>
              }
            />
          </Reveal>
          <Reveal delay={80}>
            <div className="panel panel--flush">
              <Pipeline />
            </div>
          </Reveal>
        </div>
      </section>

      <section className="section section--line">
        <div className="container split split--wide">
          <Reveal className="split-copy">
            <p className="eyebrow">
              <span className="eyebrow-dash" aria-hidden="true" />
              Demonstration
            </p>
            <h2 className="section-title">See the system operate.</h2>
            <p className="section-lead">
              The dashboard steps through a simulated 24-hour window and shows how
              generation, demand, storage and grid exchange interact. Switch horizons,
              pause the clock and inspect the curves. Every number is model output,
              clearly labelled.
            </p>
            <ul className="feature-list">
              <li>Live sample clock across a 15-minute resolution day</li>
              <li>Battery state of charge, grid import and export in one view</li>
              <li>24-hour, 7-day and 30-day analysis windows</li>
              <li>Illustrative comparison against conventional management</li>
            </ul>
            <div className="hero-actions">
              <Button to="/dashboard">Open the dashboard</Button>
              <Button to="/optimisation" variant="ghost">
                Read the decision logic
              </Button>
            </div>
          </Reveal>

          <Reveal delay={100} className="split-panel">
            <div className="preview-panel">
              <div className="preview-head">
                <div>
                  <p className="preview-eyebrow">SIMULATED · 24 HOURS</p>
                  <h3>Community energy profile</h3>
                </div>
                <SimBadge />
              </div>

              <SeriesChart
                labels={labels}
                fullLabels={fullLabels}
                height={228}
                leftUnit="kW"
                ariaLabel="Simulated 24-hour solar generation and community demand profile"
                series={[
                  {
                    key: 'solar',
                    name: 'Solar generation',
                    color: '#35f0a4',
                    values: sim.samples.map((sample) => sample.solar),
                    kind: 'area',
                    format: (value) => kw(value),
                  },
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

              <div className="preview-stats">
                <div>
                  <span>Solar peak</span>
                  <strong>{kw(solarPeak)}</strong>
                </div>
                <div>
                  <span>Demand peak</span>
                  <strong>{kw(demandPeak)}</strong>
                </div>
                <div>
                  <span>On-site solar use</span>
                  <strong>{pct(sim.gridMind.renewableUtilisation, 0)}</strong>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="section section--line">
        <div className="container">
          <Reveal>
            <SectionHead
              eyebrow="Evaluation"
              title="Designed to be measured, not just demonstrated."
              lead="The final module scores every simulated window on cost, grid dependency, peak demand, battery cycling and renewable utilisation. The same evaluation contract can be pointed at real telemetry when a pilot is available."
            />
          </Reveal>
          <div className="grid grid-4 gap">
            {[
              {
                label: 'Electricity cost',
                value: costReduction > 0 ? `−${pct(costReduction, 0)}` : '—',
                note: 'modelled vs no-storage baseline, 24 h',
              },
              {
                label: 'Grid import',
                value: importReduction > 0 ? `−${pct(importReduction, 0)}` : '—',
                note: 'modelled vs no-storage baseline, 24 h',
              },
              {
                label: 'Renewable use',
                value: pct(sim.gridMind.renewableUtilisation, 0),
                note: 'on-site solar utilisation',
              },
              {
                label: 'Peak demand',
                value: peakReduction > 0 ? `−${pct(peakReduction, 0)}` : '—',
                note: 'modelled peak import reduction',
              },
            ].map((item, index) => (
              <Reveal key={item.label} delay={index * 60}>
                <div className="metric-tile">
                  <p className="metric-label">{item.label}</p>
                  <p className="metric-value">{item.value}</p>
                  <p className="metric-note">{item.note}</p>
                </div>
              </Reveal>
            ))}
          </div>
          <p className="section-footnote">
            <span aria-hidden="true">↳</span> The figures above are illustrative targets
            from a simulation, not verified experimental results. Actual outcomes depend
            on battery sizing, tariffs, weather and load behaviour.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <Reveal>
            <div className="cta-band">
              <div>
                <p className="eyebrow">
                  <span className="eyebrow-dash" aria-hidden="true" />
                  GridMind · UTM
                </p>
                <h2>Built for communities. Designed for scrutiny.</h2>
                <p>
                  Explore the full system model, the dispatch logic behind it, and the
                  way performance is evaluated.
                </p>
              </div>
              <div className="cta-actions">
                <Button to="/dashboard">View Live Dashboard</Button>
                <Button to="/about" variant="ghost">
                  About the project
                </Button>
              </div>
            </div>
          </Reveal>
          <p className="home-note">
            <Link to="/impact">Read the impact assessment</Link> ·{' '}
            <Link to="/how-it-works">Inspect the architecture</Link> ·{' '}
            <span>{kwh(sim.gridMind.solarKwh)} of simulated solar in the current window</span>
          </p>
        </div>
      </section>
    </>
  );
}
