// =====================================================================
// TradeMind AI - Technical Indicator Types
// =====================================================================

export interface BollingerBandsResult {
  upper: number;
  middle: number;
  lower: number;
  bandwidth: number;
  percentB: number;
}

export interface MACDResult {
  macd: number;
  signal: number;
  histogram: number;
}

export interface StochRSIResult {
  k: number;
  d: number;
}

export interface TechnicalIndicatorSet {
  // Moving averages
  ema20: number;
  ema50: number;
  ema200: number;

  // Momentum oscillators
  rsi14: number;
  macd: MACDResult;
  stochRsi: StochRSIResult;

  // Volatility & Volume
  vwap: number;
  atr14: number;
  bollingerBands: BollingerBandsResult;
  volume24h: number;
  volumeSma20: number;
  volumeRatio: number; // current candle volume / volumeSma20

  // Derived metrics
  momentumScore: number; // -100 to +100
  annualizedVolatility: number; // percentage
  candleVolatilityPct: number; // ATR / current price * 100
}
