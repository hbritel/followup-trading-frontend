import type { OptionSpreadDto } from '@/types/dto';

/**
 * Mock dataset for the Options Spreads page.
 *
 * The dataset is intentionally diverse: it covers every SpreadType
 * supported by the UI and spreads values across OPEN / CLOSED / EXPIRED
 * statuses so the tab filters are meaningful during visual review.
 *
 * Numbers are computed as if each leg represents 1 standard option
 * contract (multiplier 100). Premiums are per-share; netPremium,
 * maxProfit, maxLoss and realizedPnl are expressed as dollar amounts
 * at the full-contract level, matching what the backend emits.
 */
export const mockOptionSpreads: OptionSpreadDto[] = [
  // 1. AAPL Bull Call Vertical — OPEN (debit)
  {
    id: 'spread-001',
    spreadType: 'VERTICAL_CALL',
    underlying: 'AAPL',
    expirationDate: '2026-05-16',
    netPremium: -380,
    maxProfit: 620,
    maxLoss: -380,
    breakevenLow: 183.8,
    breakevenHigh: null,
    realizedPnl: null,
    status: 'OPEN',
    detectedAt: '2026-04-15T10:30:00Z',
    legs: [
      { id: 'leg-001a', tradeId: 't-001a', legType: 'LONG_CALL',  strike: 180, quantity: 1, premium: 6.20, sortOrder: 0 },
      { id: 'leg-001b', tradeId: 't-001b', legType: 'SHORT_CALL', strike: 190, quantity: 1, premium: 2.40, sortOrder: 1 },
    ],
  },

  // 2. MSFT Bull Put Credit Spread — OPEN (credit)
  {
    id: 'spread-002',
    spreadType: 'VERTICAL_PUT',
    underlying: 'MSFT',
    expirationDate: '2026-05-23',
    netPremium: 140,
    maxProfit: 140,
    maxLoss: -860,
    breakevenLow: 408.6,
    breakevenHigh: null,
    realizedPnl: null,
    status: 'OPEN',
    detectedAt: '2026-04-17T14:05:00Z',
    legs: [
      { id: 'leg-002a', tradeId: 't-002a', legType: 'SHORT_PUT', strike: 410, quantity: 1, premium: 2.80, sortOrder: 0 },
      { id: 'leg-002b', tradeId: 't-002b', legType: 'LONG_PUT',  strike: 400, quantity: 1, premium: 1.40, sortOrder: 1 },
    ],
  },

  // 3. SPY Iron Condor — OPEN
  {
    id: 'spread-003',
    spreadType: 'IRON_CONDOR',
    underlying: 'SPY',
    expirationDate: '2026-06-20',
    netPremium: 210,
    maxProfit: 210,
    maxLoss: -790,
    breakevenLow: 507.9,
    breakevenHigh: 542.1,
    realizedPnl: null,
    status: 'OPEN',
    detectedAt: '2026-04-10T09:45:00Z',
    legs: [
      { id: 'leg-003a', tradeId: 't-003a', legType: 'LONG_PUT',   strike: 500, quantity: 1, premium: 1.20, sortOrder: 0 },
      { id: 'leg-003b', tradeId: 't-003b', legType: 'SHORT_PUT',  strike: 510, quantity: 1, premium: 2.30, sortOrder: 1 },
      { id: 'leg-003c', tradeId: 't-003c', legType: 'SHORT_CALL', strike: 540, quantity: 1, premium: 2.20, sortOrder: 2 },
      { id: 'leg-003d', tradeId: 't-003d', legType: 'LONG_CALL',  strike: 550, quantity: 1, premium: 1.10, sortOrder: 3 },
    ],
  },

  // 4. NVDA Long Straddle — OPEN (earnings play)
  {
    id: 'spread-004',
    spreadType: 'STRADDLE',
    underlying: 'NVDA',
    expirationDate: '2026-05-02',
    netPremium: -4700,
    maxProfit: null,
    maxLoss: -4700,
    breakevenLow: 853,
    breakevenHigh: 947,
    realizedPnl: null,
    status: 'OPEN',
    detectedAt: '2026-04-18T15:12:00Z',
    legs: [
      { id: 'leg-004a', tradeId: 't-004a', legType: 'LONG_CALL', strike: 900, quantity: 1, premium: 25.00, sortOrder: 0 },
      { id: 'leg-004b', tradeId: 't-004b', legType: 'LONG_PUT',  strike: 900, quantity: 1, premium: 22.00, sortOrder: 1 },
    ],
  },

  // 5. TSLA Long Strangle — OPEN
  {
    id: 'spread-005',
    spreadType: 'STRANGLE',
    underlying: 'TSLA',
    expirationDate: '2026-05-30',
    netPremium: -1500,
    maxProfit: null,
    maxLoss: -1500,
    breakevenLow: 245,
    breakevenHigh: 295,
    realizedPnl: null,
    status: 'OPEN',
    detectedAt: '2026-04-19T11:20:00Z',
    legs: [
      { id: 'leg-005a', tradeId: 't-005a', legType: 'LONG_CALL', strike: 280, quantity: 1, premium: 8.00, sortOrder: 0 },
      { id: 'leg-005b', tradeId: 't-005b', legType: 'LONG_PUT',  strike: 260, quantity: 1, premium: 7.00, sortOrder: 1 },
    ],
  },

  // 6. QQQ Long Butterfly (Call) — CLOSED at profit
  {
    id: 'spread-006',
    spreadType: 'BUTTERFLY_CALL',
    underlying: 'QQQ',
    expirationDate: '2026-04-11',
    netPremium: -200,
    maxProfit: 800,
    maxLoss: -200,
    breakevenLow: 462,
    breakevenHigh: 478,
    realizedPnl: 650,
    status: 'CLOSED',
    detectedAt: '2026-03-28T13:00:00Z',
    legs: [
      { id: 'leg-006a', tradeId: 't-006a', legType: 'LONG_CALL',  strike: 460, quantity: 1, premium: 4.50, sortOrder: 0 },
      { id: 'leg-006b', tradeId: 't-006b', legType: 'SHORT_CALL', strike: 470, quantity: 2, premium: 2.10, sortOrder: 1 },
      { id: 'leg-006c', tradeId: 't-006c', legType: 'LONG_CALL',  strike: 480, quantity: 1, premium: 1.70, sortOrder: 2 },
    ],
  },

  // 7. GOOGL Covered Call — OPEN
  {
    id: 'spread-007',
    spreadType: 'COVERED_CALL',
    underlying: 'GOOGL',
    expirationDate: '2026-05-16',
    netPremium: 220,
    maxProfit: 1220,
    maxLoss: -15580,
    breakevenLow: 157.8,
    breakevenHigh: null,
    realizedPnl: null,
    status: 'OPEN',
    detectedAt: '2026-04-02T09:10:00Z',
    legs: [
      { id: 'leg-007a', tradeId: 't-007a', legType: 'STOCK',      strike: 160, quantity: 100, premium: null, sortOrder: 0 },
      { id: 'leg-007b', tradeId: 't-007b', legType: 'SHORT_CALL', strike: 170, quantity: 1,   premium: 2.20, sortOrder: 1 },
    ],
  },

  // 8. AMZN Protective Put — OPEN
  {
    id: 'spread-008',
    spreadType: 'PROTECTIVE_PUT',
    underlying: 'AMZN',
    expirationDate: '2026-06-20',
    netPremium: -350,
    maxProfit: null,
    maxLoss: -1250,
    breakevenLow: null,
    breakevenHigh: 188.5,
    realizedPnl: null,
    status: 'OPEN',
    detectedAt: '2026-04-08T16:40:00Z',
    legs: [
      { id: 'leg-008a', tradeId: 't-008a', legType: 'STOCK',    strike: 185, quantity: 100, premium: null, sortOrder: 0 },
      { id: 'leg-008b', tradeId: 't-008b', legType: 'LONG_PUT', strike: 180, quantity: 1,   premium: 3.50, sortOrder: 1 },
    ],
  },

  // 9. META Collar — OPEN (protective put funded by short call)
  {
    id: 'spread-009',
    spreadType: 'COLLAR',
    underlying: 'META',
    expirationDate: '2026-05-23',
    netPremium: 40,
    maxProfit: 2040,
    maxLoss: -1960,
    breakevenLow: 499.6,
    breakevenHigh: null,
    realizedPnl: null,
    status: 'OPEN',
    detectedAt: '2026-04-11T10:05:00Z',
    legs: [
      { id: 'leg-009a', tradeId: 't-009a', legType: 'STOCK',      strike: 500, quantity: 100, premium: null, sortOrder: 0 },
      { id: 'leg-009b', tradeId: 't-009b', legType: 'LONG_PUT',   strike: 480, quantity: 1,   premium: 4.20, sortOrder: 1 },
      { id: 'leg-009c', tradeId: 't-009c', legType: 'SHORT_CALL', strike: 520, quantity: 1,   premium: 4.60, sortOrder: 2 },
    ],
  },

  // 10. SPY Calendar — CLOSED at profit
  {
    id: 'spread-010',
    spreadType: 'CALENDAR',
    underlying: 'SPY',
    expirationDate: '2026-03-21',
    netPremium: -320,
    maxProfit: 480,
    maxLoss: -320,
    breakevenLow: 516,
    breakevenHigh: 524,
    realizedPnl: 180,
    status: 'CLOSED',
    detectedAt: '2026-02-12T09:30:00Z',
    legs: [
      { id: 'leg-010a', tradeId: 't-010a', legType: 'SHORT_CALL', strike: 520, quantity: 1, premium: 1.80, sortOrder: 0 },
      { id: 'leg-010b', tradeId: 't-010b', legType: 'LONG_CALL',  strike: 520, quantity: 1, premium: 5.00, sortOrder: 1 },
    ],
  },

  // 11. TSLA Diagonal — OPEN
  {
    id: 'spread-011',
    spreadType: 'DIAGONAL',
    underlying: 'TSLA',
    expirationDate: '2026-06-20',
    netPremium: -450,
    maxProfit: 550,
    maxLoss: -450,
    breakevenLow: 284.5,
    breakevenHigh: null,
    realizedPnl: null,
    status: 'OPEN',
    detectedAt: '2026-04-14T14:55:00Z',
    legs: [
      { id: 'leg-011a', tradeId: 't-011a', legType: 'SHORT_CALL', strike: 280, quantity: 1, premium: 3.20, sortOrder: 0 },
      { id: 'leg-011b', tradeId: 't-011b', legType: 'LONG_CALL',  strike: 290, quantity: 1, premium: 7.70, sortOrder: 1 },
    ],
  },

  // 12. IWM Iron Butterfly — EXPIRED (closed at loss)
  {
    id: 'spread-012',
    spreadType: 'IRON_BUTTERFLY',
    underlying: 'IWM',
    expirationDate: '2026-04-18',
    netPremium: 520,
    maxProfit: 520,
    maxLoss: -480,
    breakevenLow: 204.8,
    breakevenHigh: 215.2,
    realizedPnl: -230,
    status: 'EXPIRED',
    detectedAt: '2026-03-20T15:10:00Z',
    legs: [
      { id: 'leg-012a', tradeId: 't-012a', legType: 'LONG_PUT',   strike: 200, quantity: 1, premium: 1.40, sortOrder: 0 },
      { id: 'leg-012b', tradeId: 't-012b', legType: 'SHORT_PUT',  strike: 210, quantity: 1, premium: 3.60, sortOrder: 1 },
      { id: 'leg-012c', tradeId: 't-012c', legType: 'SHORT_CALL', strike: 210, quantity: 1, premium: 3.40, sortOrder: 2 },
      { id: 'leg-012d', tradeId: 't-012d', legType: 'LONG_CALL',  strike: 220, quantity: 1, premium: 1.20, sortOrder: 3 },
    ],
  },
];
