// =====================================================================
// TradeMind AI - Market Structure Domain Types
// =====================================================================

export interface SwingPoint {
  index: number;
  timestamp: number;
  price: number;
  type: 'SWING_HIGH' | 'SWING_LOW';
  isWickPenetrated: boolean;
  isConfirmedBreak: boolean; // Confirmed candle close beyond the level
}

export type TrendStructure = 'HIGHER_HIGHS_AND_LOWS' | 'LOWER_HIGHS_AND_LOWS' | 'RANGING' | 'EXPANDING';

export interface BreakOfStructure {
  timestamp: number;
  brokenLevel: number;
  breakType: 'BOS_BULLISH' | 'BOS_BEARISH';
  confirmationPrice: number;
  isConfirmedByClose: boolean; // Wick penetration is strictly separated from confirmed break
  candleIndex: number;
}

export interface ChangeOfCharacter {
  timestamp: number;
  previousTrend: 'BULLISH' | 'BEARISH';
  newDirection: 'BULLISH' | 'BEARISH';
  pivotPrice: number;
  isConfirmedByClose: boolean;
  candleIndex: number;
}

export interface SupportResistanceLevel {
  price: number;
  type: 'SUPPORT' | 'RESISTANCE' | 'PIVOT';
  touches: number;
  strength: 'WEAK' | 'MODERATE' | 'STRONG';
  lastTestedTimestamp: number;
}

export interface SupplyDemandZone {
  top: number;
  bottom: number;
  type: 'SUPPLY' | 'DEMAND';
  timeframe: string;
  isMitigated: boolean;
  touchCount: number;
}

export interface LiquiditySweep {
  timestamp: number;
  targetPrice: number; // The swing level swept
  sweepExtreme: number; // The wick peak/trough
  direction: 'BEARISH_SWEEP' | 'BULLISH_SWEEP'; // Bearish sweep = swept swing high and rejected down
  rejectionClose: number;
  rejectionWickRatio: number; // Wick size / total candle range
}

export interface EqualHighLow {
  type: 'EQUAL_HIGHS' | 'EQUAL_LOWS';
  price: number;
  pointCount: number;
  tolerancePct: number;
  timestamps: number[];
}

export interface FairValueGap {
  candle1Index: number;
  candle2Index: number;
  candle3Index: number;
  gapTop: number;
  gapBottom: number;
  type: 'BULLISH_FVG' | 'BEARISH_FVG';
  isFilled: boolean;
  isPartiallyMitigated: boolean;
  midpointConsequentEncroachment: number; // CE 50% level
}

export interface OrderBlock {
  candleIndex: number;
  timestamp: number;
  type: 'BULLISH_OB' | 'BEARISH_OB';
  zoneTop: number;
  zoneBottom: number;
  isMitigated: boolean;
  volumeStrength: number;
}

export interface RejectionCandle {
  timestamp: number;
  candleIndex: number;
  type: 'BULLISH_PINBAR' | 'BEARISH_PINBAR' | 'HAMMER' | 'SHOOTING_STAR';
  wickRatio: number;
  bodyRatio: number;
}

export interface DivergenceEvent {
  type: 'REGULAR_BULLISH' | 'REGULAR_BEARISH' | 'HIDDEN_BULLISH' | 'HIDDEN_BEARISH';
  indicator: 'RSI' | 'MACD';
  pricePointA: number;
  pricePointB: number;
  indicatorPointA: number;
  indicatorPointB: number;
  timestamp: number;
}

export interface MarketStructureSnapshot {
  timeframe: string;
  trendStructure: TrendStructure;
  recentSwingHighs: SwingPoint[];
  recentSwingLows: SwingPoint[];
  lastBOS?: BreakOfStructure;
  lastCHoCH?: ChangeOfCharacter;
  activeSupportLevels: SupportResistanceLevel[];
  activeResistanceLevels: SupportResistanceLevel[];
  supplyZones: SupplyDemandZone[];
  demandZones: SupplyDemandZone[];
  recentSweeps: LiquiditySweep[];
  equalHighsLows: EqualHighLow[];
  openFairValueGaps: FairValueGap[];
  activeOrderBlocks: OrderBlock[];
  recentRejections: RejectionCandle[];
  detectedDivergences: DivergenceEvent[];
}
