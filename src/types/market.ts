// =====================================================================
// TradeMind AI - Market & Candle Domain Types
// =====================================================================

export type MarketType = 'crypto' | 'forex';

export type Timeframe = '4h' | '1h' | '15m' | '5m';

export interface Instrument {
  id: string;
  symbol: string; // e.g., 'BTC/USDT', 'EUR/USD'
  displayName: string;
  marketType: MarketType;
  baseAsset: string;
  quoteAsset: string;
  pipOrTickSize: number;
  lotOrContractSize: number;
  isActive: boolean;
  precision: number;
}

export interface Candle {
  timestamp: number; // Unix timestamp in ms (candle open time)
  closeTime?: number; // Scheduled close timestamp in ms (openTime + intervalMs - 1)
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  isClosed?: boolean; // True if candle has finalized, false if currently forming
}

export const TIMEFRAME_INTERVAL_MS: Record<Timeframe, number> = {
  '5m': 5 * 60 * 1000,
  '15m': 15 * 60 * 1000,
  '1h': 60 * 60 * 1000,
  '4h': 4 * 60 * 60 * 1000,
};

export type TrendDirection = 'BULLISH' | 'BEARISH' | 'NEUTRAL';

export interface MarketPriceSnapshot {
  symbol: string;
  price: number;
  bid?: number;
  ask?: number;
  change24h: number; // Percentage change, e.g., +2.45 or -1.15
  high24h: number;
  low24h: number;
  volume24h: number;
  trend: TrendDirection;
  session: 'London' | 'New York' | 'Tokyo' | 'Sydney' | 'Weekend' | 'Closed';
  lastUpdated: number; // Unix timestamp in ms
  dataProvider: 'Binance API' | 'TwelveData' | 'Finnhub' | 'ExchangeRate' | 'AlphaVantage' | 'Simulated Engine';
  isLive: boolean;
  status?: 'LIVE' | 'SIMULATED' | 'UNAVAILABLE';
}

export interface WatchlistItem {
  instrument: Instrument;
  snapshot: MarketPriceSnapshot;
}
