export const SYSTEM_STEPS = [
  {
    key: 'solar',
    title: 'Solar forecasting',
    summary:
      'Estimates renewable generation from solar geometry, weather conditions and array characteristics.',
    io: 'Weather + irradiance → expected PV output',
  },
  {
    key: 'demand',
    title: 'Demand forecasting',
    summary:
      'Estimates community consumption from historical load shape, time of day and weekday patterns.',
    io: 'Load history + calendar → expected demand',
  },
  {
    key: 'battery',
    title: 'Battery optimisation',
    summary:
      'Decides when storage should charge, discharge or hold energy based on surplus and price signals.',
    io: 'Forecasts + state of charge → dispatch plan',
  },
  {
    key: 'grid',
    title: 'Grid management',
    summary:
      'Schedules imports and exports to balance the community while limiting peak grid dependency.',
    io: 'Dispatch plan + limits → import / export setpoints',
  },
  {
    key: 'analysis',
    title: 'Performance analysis',
    summary:
      'Scores outcomes on cost, efficiency, renewables used and grid reliance, then feeds the next cycle.',
    io: 'Measured outcomes → metrics + next-cycle inputs',
  },
];

export function Pipeline() {
  return (
    <div className="pipeline">
      <div className="pipeline-track">
        {SYSTEM_STEPS.map((step, index) => (
          <div className="pipeline-item" key={step.key}>
            <div className="pipeline-step">
              <span className="pipeline-index">{String(index + 1).padStart(2, '0')}</span>
              <h3>{step.title}</h3>
              <p>{step.summary}</p>
              <p className="pipeline-io">{step.io}</p>
            </div>
            {index < SYSTEM_STEPS.length - 1 && (
              <span className="pipeline-arrow" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6">
                  <path d="M5 12h14m0 0-5-5m5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            )}
          </div>
        ))}
      </div>
      <p className="pipeline-feedback">
        <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
          <path d="M20 12a8 8 0 1 1-2.3-5.6M20 4v5h-5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Closed loop — performance analysis returns measured outcomes to the forecasting stage
        for the next control cycle.
      </p>
    </div>
  );
}
