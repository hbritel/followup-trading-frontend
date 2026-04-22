import type { SpreadLegDto } from '@/types/dto';

const CONTRACT_MULTIPLIER = 100;

export interface PayoffPoint {
  readonly price: number;
  readonly pnl: number;
}

export interface PayoffStats {
  readonly minPrice: number;
  readonly maxPrice: number;
  readonly strikes: readonly number[];
}

function legPayoff(leg: SpreadLegDto, price: number): number {
  const premium = leg.premium ?? 0;
  const qty = leg.quantity;
  const strike = leg.strike;
  const mult = CONTRACT_MULTIPLIER;

  switch (leg.legType) {
    case 'LONG_CALL':
      return (Math.max(price - strike, 0) - premium) * qty * mult;
    case 'SHORT_CALL':
      return (premium - Math.max(price - strike, 0)) * qty * mult;
    case 'LONG_PUT':
      return (Math.max(strike - price, 0) - premium) * qty * mult;
    case 'SHORT_PUT':
      return (premium - Math.max(strike - price, 0)) * qty * mult;
    case 'STOCK':
      // Stock leg uses strike as proxy for entry price
      return (price - strike) * qty;
    default:
      return 0;
  }
}

export function totalPayoff(legs: readonly SpreadLegDto[], price: number): number {
  return legs.reduce((sum, leg) => sum + legPayoff(leg, price), 0);
}

export function payoffRange(legs: readonly SpreadLegDto[]): PayoffStats {
  const strikes = legs
    .filter((l) => l.legType !== 'STOCK')
    .map((l) => l.strike)
    .sort((a, b) => a - b);

  if (strikes.length === 0) {
    return { minPrice: 0, maxPrice: 100, strikes: [] };
  }

  const low = strikes[0];
  const high = strikes[strikes.length - 1];
  const span = Math.max(high - low, low * 0.1, 1);
  const pad = span * 0.75;

  return {
    minPrice: Math.max(0, low - pad),
    maxPrice: high + pad,
    strikes,
  };
}

export function buildPayoffCurve(
  legs: readonly SpreadLegDto[],
  steps = 120,
): PayoffPoint[] {
  const { minPrice, maxPrice, strikes } = payoffRange(legs);
  if (strikes.length === 0) return [];

  const keyPoints = new Set<number>([minPrice, maxPrice, ...strikes]);
  const step = (maxPrice - minPrice) / steps;
  for (let i = 0; i <= steps; i += 1) {
    keyPoints.add(minPrice + step * i);
  }

  const sorted = [...keyPoints].sort((a, b) => a - b);
  return sorted.map((price) => ({
    price,
    pnl: totalPayoff(legs, price),
  }));
}

export function findBreakevens(points: readonly PayoffPoint[]): number[] {
  const out: number[] = [];
  for (let i = 1; i < points.length; i += 1) {
    const prev = points[i - 1];
    const curr = points[i];
    if (prev.pnl === 0) {
      out.push(prev.price);
      continue;
    }
    if ((prev.pnl < 0 && curr.pnl > 0) || (prev.pnl > 0 && curr.pnl < 0)) {
      const ratio = Math.abs(prev.pnl) / (Math.abs(prev.pnl) + Math.abs(curr.pnl));
      out.push(prev.price + (curr.price - prev.price) * ratio);
    }
  }
  return out;
}
