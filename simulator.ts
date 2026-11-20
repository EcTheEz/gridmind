import type { Period, Sample, Simulation } from '../data/types';
import {
  BATTERY,
  TARIFF,
  accumulate,
  createTotals,
  dispatchStep,
  priceAt,
  summarise,
} from '../lib/optimisation';

/**
 * Deterministic community-energy simulator.
 *
 * Every number the interface shows is produced here, so swapping this module
 * for a real data adapter (or a trained forecasting model) is the only change
 * required to connect GridMind to measured data later.
 */

export const SOLAR_CAPACITY_KW = 420;
const INITIAL_SOC = 45;

export const PERIOD_META: Record<
  Period,
  { hours: number; step: number; label: string; resolution: string }
> = {
  '24h': { hours: 24, step: 0.25, label: 'Last 24 hours', resolution: '15-minute resolution' },
  '7d': { hours: 168, step: 1, label: 'Last 7 days', resolution: 'Hourly resolution' },
  '30d': { hours: 720, step: 3, label: 'Last 30 days', resolution: '3-hour resolution' },
};

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Smooth, reproducible day-to-day weather factor (0.70 – 1.0). */
function weatherForDay(day: number): number {
  const rnd = mulberry32(9173 + day * 137);
  return 0.7 + rnd() * 0.3;
}

function cloudPhase(day: number): number {
  return mulberry32(5531 + day * 71)() * Math.PI * 2;
}

/** Rooftop + community array output, kW. */
export function solarAt(hour: number, day: number): number {
  if (hour < 6.6 || hour > 19.4) return 0;
  const phase = (hour - 6.6) / (19.4 - 6.6);
  const shape = Math.pow(Math.sin(Math.PI * phase), 1.28);
  const weather = weatherForDay(day);
  const p = cloudPhase(day);
  const cloud =
    0.86 +
    0.1 * Math.sin(hour * 1.55 + p) +
    0.06 * Math.sin(hour * 3.1 + p * 1.7);
  return SOLAR_CAPACITY_KW * shape * weather * cloud;
}

/** Community demand, kW — morning and evening peaks with weekend variation. */
export function demandAt(hour: number, day: number): number {
  const rnd = mulberry32(4242 + day * 53);
  const dayBase = 0.93 + rnd() * 0.14;
  const weekend = day % 7 >= 5 ? 0.9 : 1;
  const morning = 210 * Math.exp(-((hour - 8.2) ** 2) / (2 * 1.4 ** 2));
  const evening = 330 * Math.exp(-((hour - 19.9) ** 2) / (2 * 1.9 ** 2));
  const midday = 110 * Math.exp(-((hour - 13) ** 2) / (2 * 3.2 ** 2));
  const base =
    122 + morning + midday + evening + 26 * Math.sin((hour / 24) * Math.PI * 2 - 1);
  const jitter = 1 + 0.025 * Math.sin(hour * 7.3 + day * 1.7);
  return base * weekend * dayBase * jitter;
}

function makeLabels(period: Period, t: number) {
  const hour = Math.floor(t % 24);
  const minute = Math.round((t % 1) * 60);
  const day = Math.floor(t / 24);
  const time = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;

  if (period === '24h') {
    return { label: `${String(hour).padStart(2, '0')}:00`, fullLabel: time };
  }
  if (period === '7d') {
    return { label: DAY_NAMES[day % 7], fullLabel: `${DAY_NAMES[day % 7]} ${time}` };
  }
  return { label: `Day ${day + 1}`, fullLabel: `Day ${day + 1} · ${time}` };
}

function simulate(period: Period): Simulation {
  const meta = PERIOD_META[period];
  const steps = Math.round(meta.hours / meta.step);
  const dt = meta.step;

  const totals = createTotals();
  const baseline = createTotals();
  const samples: Sample[] = [];

  let soc = INITIAL_SOC;

  for (let i = 0; i < steps; i++) {
    const t = i * dt;
    const hour = t % 24;
    const day = Math.floor(t / 24);
    const solar = solarAt(hour, day);
    const demand = demandAt(hour, day);
    const price = priceAt(hour);

    const result = dispatchStep({ solar, demand, price, soc, dt, hour });
    soc = result.soc;

    accumulate(
      totals,
      {
        solar,
        demand,
        gridImport: result.gridImport,
        gridExport: result.gridExport,
        price,
        batteryPower: result.batteryPower,
      },
      dt,
    );

    // Conventional management: no storage, no dispatch — net load follows the grid.
    const net = solar - demand;
    accumulate(
      baseline,
      {
        solar,
        demand,
        gridImport: Math.max(0, -net),
        gridExport: Math.max(0, net),
        price,
        batteryPower: 0,
      },
      dt,
    );

    const { label, fullLabel } = makeLabels(period, t);
    samples.push({
      t,
      hour,
      day,
      label,
      fullLabel,
      solar: Math.round(solar * 10) / 10,
      demand: Math.round(demand * 10) / 10,
      price,
      batteryPower: Math.round(result.batteryPower * 10) / 10,
      soc: Math.round(result.soc * 10) / 10,
      gridImport: Math.round(result.gridImport * 10) / 10,
      gridExport: Math.round(result.gridExport * 10) / 10,
      action: result.action,
    });
  }

  return {
    period,
    samples,
    gridMind: summarise(totals),
    conventional: summarise(baseline),
    battery: {
      capacityKwh: BATTERY.capacityKwh,
      powerKw: BATTERY.powerKw,
      minSoc: BATTERY.minSoc,
      maxSoc: BATTERY.maxSoc,
    },
    tariff: { peak: TARIFF.peak, offPeak: TARIFF.offPeak, feedIn: TARIFF.feedIn },
    solarPeakKw: SOLAR_CAPACITY_KW,
    resolution: meta.resolution,
    windowLabel: meta.label,
  };
}

const cache = new Map<Period, Simulation>();

export function getSimulation(period: Period): Simulation {
  const cached = cache.get(period);
  if (cached) return cached;
  const sim = simulate(period);
  cache.set(period, sim);
  return sim;
}
