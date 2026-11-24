import type { BatteryAction } from '../data/types';

/**
 * GridMind's decision layer.
 *
 * This is deliberately a transparent, rule-based dispatcher — not a trained
 * model. A forecasting or reinforcement-learning optimiser can later replace
 * `dispatchStep` behind the same input/output contract without touching the
 * data layer or the interface.
 */

export const BATTERY = {
  capacityKwh: 600,
  powerKw: 250,
  minSoc: 12,
  maxSoc: 95,
  efficiency: 0.96,
} as const;

export const TARIFF = {
  offPeak: 0.245,
  peak: 0.42,
  feedIn: 0.1,
  peakStart: 14,
  peakEnd: 22,
} as const;

/** Illustrative community battery reserve held back outside the evening peak. */
const OFF_PEAK_RESERVE = 26;
const ON_PEAK_RESERVE = 14;
/** Off-peak top-up so the battery starts the solar day with usable headroom. */
const TOP_UP_TARGET = 30;
const TOP_UP_POWER = 110;

export function priceAt(hour: number): number {
  return hour >= TARIFF.peakStart && hour < TARIFF.peakEnd
    ? TARIFF.peak
    : TARIFF.offPeak;
}

export interface DispatchInput {
  solar: number;
  demand: number;
  price: number;
  soc: number;
  dt: number;
  hour: number;
}

export interface DispatchOutput {
  batteryPower: number;
  soc: number;
  gridImport: number;
  gridExport: number;
  action: BatteryAction;
}

/** One control interval of the GridMind dispatch heuristic. */
export function dispatchStep(input: DispatchInput): DispatchOutput {
  const { solar, demand, price, dt, hour } = input;
  const usable = (BATTERY.capacityKwh * Math.max(0, input.soc)) / 100;
  let soc = input.soc;
  let batteryPower = 0;
  let gridImport = 0;
  let gridExport = 0;
  let action: BatteryAction = 'idle';

  const net = solar - demand;

  if (net >= 0) {
    const headroomKw =
      (Math.max(0, ((BATTERY.maxSoc - soc) / 100) * BATTERY.capacityKwh)) / dt;
    const charge = Math.max(0, Math.min(net, BATTERY.powerKw, headroomKw));
    if (charge > 0) {
      batteryPower = charge;
      soc += (charge * dt * BATTERY.efficiency * 100) / BATTERY.capacityKwh;
      action = 'charge-solar';
    }
    gridExport = Math.max(0, net - charge);
    if (charge <= 0 && gridExport > 0) action = 'export';
  } else {
    const deficit = -net;
    const reserve = price >= TARIFF.peak ? ON_PEAK_RESERVE : OFF_PEAK_RESERVE;
    const availableKw =
      (Math.max(0, ((soc - reserve) / 100) * BATTERY.capacityKwh)) / dt;
    const discharge = Math.max(
      0,
      Math.min(deficit, BATTERY.powerKw, availableKw),
    );
    if (discharge > 0) {
      batteryPower = -discharge;
      soc -= (discharge * dt * 100) / (BATTERY.capacityKwh * BATTERY.efficiency);
      action = 'discharge';
    }
    gridImport = deficit - discharge;

    // Cheapest hours: top the battery up from the grid only if it is low.
    if (hour >= 1 && hour < 5 && soc < TOP_UP_TARGET) {
      const headroomKw =
        (Math.max(0, ((BATTERY.maxSoc - soc) / 100) * BATTERY.capacityKwh)) / dt;
      const topUp = Math.max(0, Math.min(TOP_UP_POWER, headroomKw));
      if (topUp > 0) {
        batteryPower += topUp;
        soc += (topUp * dt * BATTERY.efficiency * 100) / BATTERY.capacityKwh;
        gridImport += topUp;
        action = 'charge-grid';
      }
    }
  }

  const clampedSoc = Math.min(BATTERY.maxSoc, Math.max(BATTERY.minSoc, soc));
  void usable;

  return {
    batteryPower,
    soc: clampedSoc,
    gridImport: Math.max(0, gridImport),
    gridExport: Math.max(0, gridExport),
    action,
  };
}

export interface EnergyTotals {
  solarKwh: number;
  demandKwh: number;
  importKwh: number;
  exportKwh: number;
  cost: number;
  peakImport: number;
  chargedKwh: number;
  dischargedKwh: number;
}

export function createTotals(): EnergyTotals {
  return {
    solarKwh: 0,
    demandKwh: 0,
    importKwh: 0,
    exportKwh: 0,
    cost: 0,
    peakImport: 0,
    chargedKwh: 0,
    dischargedKwh: 0,
  };
}

export function accumulate(
  totals: EnergyTotals,
  step: {
    solar: number;
    demand: number;
    gridImport: number;
    gridExport: number;
    price: number;
    batteryPower: number;
  },
  dt: number,
): EnergyTotals {
  totals.solarKwh += step.solar * dt;
  totals.demandKwh += step.demand * dt;
  totals.importKwh += step.gridImport * dt;
  totals.exportKwh += step.gridExport * dt;
  totals.cost +=
    step.gridImport * step.price * dt - step.gridExport * TARIFF.feedIn * dt;
  totals.peakImport = Math.max(totals.peakImport, step.gridImport);
  if (step.batteryPower > 0) totals.chargedKwh += step.batteryPower * dt;
  else totals.dischargedKwh += -step.batteryPower * dt;
  return totals;
}

export function summarise(totals: EnergyTotals) {
  const renewableUtilisation =
    totals.solarKwh > 0
      ? ((totals.solarKwh - totals.exportKwh) / totals.solarKwh) * 100
      : 0;
  const selfSufficiency =
    totals.demandKwh > 0
      ? ((totals.demandKwh - totals.importKwh) / totals.demandKwh) * 100
      : 0;
  const throughput = totals.chargedKwh + totals.dischargedKwh;

  return {
    cost: totals.cost,
    importKwh: totals.importKwh,
    exportKwh: totals.exportKwh,
    solarKwh: totals.solarKwh,
    demandKwh: totals.demandKwh,
    renewableUtilisation: Math.min(100, Math.max(0, renewableUtilisation)),
    selfSufficiency: Math.min(100, Math.max(0, selfSufficiency)),
    peakImport: totals.peakImport,
    batteryCycles: totals.chargedKwh / BATTERY.capacityKwh,
    batteryUtilisation:
      (throughput / (2 * BATTERY.capacityKwh)) * 100,
  };
}
