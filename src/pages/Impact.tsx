import { getSimulation } from '../data/simulator';
import { Button, Note, Panel, PanelHead, SectionHead, SimBadge } from '../components/ui/Primitives';
import { Reveal } from '../components/ui/Reveal';
import { Icon, type IconName } from '../components/ui/Icon';
import { kw, kwh, nf, pct, rm } from '../lib/format';

const impactAreas: { icon: IconName; title: string; body: string }[] = [
  {
    icon: 'leaf',
    title: 'Better renewable utilisation',
    body: 'Surplus generation is stored and shifted into the evening instead of being exported at a low feed-in value. More of the energy a community produces is energy it actually uses.',
  },
  {
    icon: 'shield',
    title: 'Reduced external dependence',
    body: 'Peak-hour imports fall when stored energy covers the evening ramp. The community keeps a larger share of its energy decisions within its own boundary.',
  },
  {
    icon: 'battery',
    title: 'More efficient battery usage',
    body: 'Dispatch respects state-of-charge limits, power limits and round-trip efficiency. Storage is used where it creates value, not cycled for the sake of activity.',
  },
  {
    icon: 'cpu',
    title: 'Improved energy management',
    body: 'Every interval is evaluated against forecasts and constraints. Operators get a traceable decision record rather than a fixed timetable.',
  },
  {
    icon: 'bolt',
    title: 'Potential cost reduction',
    body: 'Shifting imports from peak to off-peak tariffs reduces the cost of delivering the same energy service. The exact saving depends on tariffs, weather and load.',
  },
  {
    icon: 'network',
    title: 'More sustainable communities',
    body: 'Better use of local generation is a practical pathway to lower-emission neighbourhoods — and a foundation for broader smart-city coordination.',
  },
];

const measurementRows = [
  ['Energy efficiency', 'Energy service delivered per unit of grid import', 'Model output'],
  ['Electricity cost', 'Net import cost minus export credit over the window', 'Model output'],
  ['Grid dependency', 'Imported energy divided by total demand', 'Model output'],
  ['Renewable utilisation', 'On-site solar use divided by total solar generation', 'Model output'],
  ['Peak demand', 'Highest grid import over the window', 'Model output'],
  ['Battery utilisation', 'Energy throughput relative to usable capacity', 'Model output'],
];

export function Impact() {
  const sim = getSimulation('24h');
  const gm = sim.gridMind;
  const conv = sim.conventional;

  const costDelta = conv.cost > 0 ? ((conv.cost - gm.cost) / conv.cost) * 100 : 0;
  const importDelta =
    conv.importKwh > 0 ? ((conv.importKwh - gm.importKwh) / conv.importKwh) * 100 : 0;
  const peakDelta =
    conv.peakImport > 0 ? ((conv.peakImport - gm.peakImport) / conv.peakImport) * 100 : 0;
  const utilisationGain = gm.renewableUtilisation - conv.renewableUtilisation;

  const figures = [
    {
      label: 'Net electricity cost',
      value: costDelta > 0 ? `−${nf(costDelta, 1)}%` : '—',
      sub: `${rm(conv.cost)} → ${rm(gm.cost)} in the simulated day`,
      tone: 'green',
    },
    {
      label: 'Grid electricity imports',
      value: importDelta > 0 ? `−${nf(importDelta, 1)}%` : '—',
      sub: `${kwh(conv.importKwh)} → ${kwh(gm.importKwh)}`,
      tone: 'cyan',
    },
    {
      label: 'Peak grid import',
      value: peakDelta > 0 ? `−${nf(peakDelta, 1)}%` : '—',
      sub: `${kw(conv.peakImport)} → ${kw(gm.peakImport)}`,
      tone: 'blue',
    },
    {
      label: 'Renewable utilisation',
      value: utilisationGain > 0 ? `+${nf(utilisationGain, 1)} pts` : '—',
      sub: `${pct(conv.renewableUtilisation, 0)} → ${pct(gm.renewableUtilisation, 0)} of solar used on site`,
      tone: 'amber',
    },
  ];

  return (
    <>
      <section className="page-head">
        <div className="container">
          <p className="eyebrow">
            <span className="eyebrow-dash" aria-hidden="true" />
            Impact assessment
          </p>
          <h1>Why coordination matters.</h1>
          <p className="page-lead">
            GridMind targets the gap between the energy a community can generate and the
            energy it actually uses well. The economic and environmental case rests on
            three things: use more of what is generated locally, import less at peak, and
            cycle storage deliberately.
          </p>
          <div className="page-head-meta">
            <SimBadge label="Illustrative simulation results" />
            <span className="page-meta-item">24-hour window</span>
            <span className="page-meta-item">Not verified experimental data</span>
          </div>
        </div>
      </section>

      <section className="section section--flush">
        <div className="container">
          <Reveal>
            <div className="impact-figures">
              {figures.map((figure) => (
                <div className="impact-figure" data-tone={figure.tone} key={figure.label}>
                  <p className="impact-figure-label">{figure.label}</p>
                  <p className="impact-figure-value">{figure.value}</p>
                  <p className="impact-figure-sub">{figure.sub}</p>
                </div>
              ))}
            </div>
          </Reveal>
          <p className="section-footnote">
            <span aria-hidden="true">↳</span> Deltas compare GridMind dispatch with a
            no-storage conventional baseline over the same simulated 24 hours. They are
            illustrative model outputs, not measured savings.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <Reveal>
            <SectionHead
              eyebrow="Impact pathways"
              title="Six ways a coordinated community performs better."
              lead="These are the mechanisms GridMind is designed to improve. Each one is measured by the evaluation module rather than assumed."
            />
          </Reveal>
          <div className="grid grid-3 gap-lg">
            {impactAreas.map((area, index) => (
              <Reveal key={area.title} delay={index * 50}>
                <article className="impact-card">
                  <span className="impact-icon">
                    <Icon name={area.icon} size={19} />
                  </span>
                  <h3>{area.title}</h3>
                  <p>{area.body}</p>
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
              eyebrow="Why community scale"
              title="One household can optimise a battery. A neighbourhood can optimise a system."
              lead="Community-level coordination captures value that individual systems cannot, because the diversity of demand and the size of shared storage create more options."
            />
            <ol className="number-list">
              <li>
                <span>01</span>
                <div>
                  <h4>Demand diversity</h4>
                  <p>
                    Individual peaks do not align perfectly. A shared view can smooth the
                    aggregate and reduce the capacity needed to serve it.
                  </p>
                </div>
              </li>
              <li>
                <span>02</span>
                <div>
                  <h4>Shared storage</h4>
                  <p>
                    One larger battery serving many households has more usable headroom
                    and better utilisation than many small, separately controlled units.
                  </p>
                </div>
              </li>
              <li>
                <span>03</span>
                <div>
                  <h4>Grid-level value</h4>
                  <p>
                    A coordinated community can reduce its peak import and offer a more
                    predictable exchange profile to the upstream network.
                  </p>
                </div>
              </li>
            </ol>
          </Reveal>

          <Reveal delay={80} className="split-panel">
            <Panel>
              <PanelHead
                title="What is measured, not assumed"
                sub="The evaluation contract used by the performance module."
                right={<span className="mono-tag">6 metrics</span>}
              />
              <div className="metric-list">
                {measurementRows.map(([metric, definition, status]) => (
                  <div className="metric-row" key={metric}>
                    <div>
                      <p className="metric-row-title">{metric}</p>
                      <p className="metric-row-def">{definition}</p>
                    </div>
                    <span className="metric-row-status">{status}</span>
                  </div>
                ))}
              </div>
              <Note tone="amber">
                No verified experimental results are claimed on this page. The next step
                is a monitored pilot with measured generation, load and battery telemetry.
              </Note>
            </Panel>
          </Reveal>
        </div>
      </section>

      <section className="section section--line">
        <div className="container">
          <Reveal>
            <SectionHead
              eyebrow="Limitations"
              title="What this model does not prove."
              lead="Credibility depends on stating the boundaries of the demonstration as clearly as its capabilities."
            />
          </Reveal>
          <div className="grid grid-2 gap-lg">
            <Reveal>
              <div className="limitation">
                <h3>Simulation, not measurement</h3>
                <p>
                  Weather, demand and battery behaviour are simplified deterministic
                  models. Real systems include forecast error, sensor noise, outages and
                  behaviour that this simulation does not represent.
                </p>
              </div>
            </Reveal>
            <Reveal delay={60}>
              <div className="limitation">
                <h3>Tariffs are illustrative</h3>
                <p>
                  The cost comparison uses a fixed two-band tariff and feed-in rate.
                  Actual tariffs, network charges and export rules vary by market and
                  would change the result.
                </p>
              </div>
            </Reveal>
            <Reveal delay={120}>
              <div className="limitation">
                <h3>One community, one configuration</h3>
                <p>
                  Results depend on array size, battery capacity, load shape and climate.
                  A different neighbourhood would require its own parameterisation.
                </p>
              </div>
            </Reveal>
            <Reveal delay={180}>
              <div className="limitation">
                <h3>No upstream grid model</h3>
                <p>
                  Grid import and export are treated as available at the stated tariff.
                  Voltage limits, congestion, protection settings and network constraints
                  are outside the current scope.
                </p>
              </div>
            </Reveal>
          </div>

          <div className="inline-cta">
            <p>Read the project context and the team behind the prototype.</p>
            <Button to="/about" size="sm">
              About GridMind
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
