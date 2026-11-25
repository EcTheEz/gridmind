export type Period = '24h' | '7d' | '30d';

/** One simulation step at the selected resolution. */
export interface Sample {
  /** Hours elapsed since the start of the simulated window. */
  t: number;
  /** Hour of day, 0–24. */
  hour: number;
  day: number;
  label: string;
  fullLabel: string;
  /** Solar generation, kW. */
  solar: number;
  /** Community electricity demand, kW. */
  demand: number;
  /** Import tariff at this instant, RM/kWh. */
  price: number;
  /** Battery power, kW. Positive = charging, negative = discharging. */
  batteryPower: number;
  /** Battery state of charge, %. */
  soc: number;
  gridImport: number;
  gridExport: number;
  action: BatteryAction;
}

export type BatteryAction =
  | 'charge-solar'
  | 'charge-grid'
  | 'discharge'
  | 'export'
  | 'idle';

export interface Metrics {
  /** Net electricity cost over the window, RM. */
  cost: number;
  importKwh: number;
  exportKwh: number;
  solarKwh: number;
  demandKwh: number;
  /** Share of generated solar used on site (not exported), %. */
  renewableUtilisation: number;
  /** Share of demand served without grid imports, %. */
  selfSufficiency: number;
  /** Highest grid import over the window, kW. */
  peakImport: number;
  /** Equivalent full battery cycles over the window. */
  batteryCycles: number;
  /** Battery energy throughput as a share of usable capacity, %. */
  batteryUtilisation: number;
}

export interface Simulation {
  period: Period;
  samples: Sample[];
  gridMind: Metrics;
  conventional: Metrics;
  battery: { capacityKwh: number; powerKw: number; minSoc: number; maxSoc: number };
  tariff: { peak: number; offPeak: number; feedIn: number };
  solarPeakKw: number;
  resolution: string;
  windowLabel: string;
}
