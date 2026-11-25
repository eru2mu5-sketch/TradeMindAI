// =====================================================================
// TradeMind AI - Binance Market Data Client
// Fetches real-time prices, server time, and historical klines from Binance.
// Implements rate-limiting, round-trip tracking, and timestamp audit features.
// =====================================================================

import { Candle, Timeframe } from '../../types/market';

const BINANCE_BASE_URL = 'https://api.binance.com/api/v3';

// Map TradeMind timeframes to Binance kline intervals
const TIMEFRAME_TO_BINANCE: Record<Timeframe, string> = {
  '4h': '4h',
  '1h': '1h',
  '15m': '15m',
  '5m': '5m',
};

export interface BinanceServerTimeResult {
  serverTime: number;
  localTimeBefore: number;
  localTimeAfter: number;
  roundTripMs: number;
  estimatedClockSkewMs: number; // positive = exchange ahead of local, negative = exchange behind
}

export interface BinanceTickerResult {
  price: number;
  change24h: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  timestamp: number; // Exchange closeTime
  localTimeBefore: number;
  localTimeAfter: number;
  roundTripMs: number;
  dataAgeMs: number;
}

export class BinanceClient {
  private lastRequestTime = 0;
  private minIntervalMs = 200; // Rate limit protection (5 req/sec max)

  private async throttle(): Promise<void> {
    const now = Date.now();
    const elapsed = now - this.lastRequestTime;
    if (elapsed < this.minIntervalMs) {
      await new Promise((resolve) => setTimeout(resolve, this.minIntervalMs - elapsed));
    }
    this.lastRequestTime = Date.now();
  }

  /**
   * Normalizes symbol like 'BTC/USDT' -> 'BTCUSDT'
   */
  private formatSymbol(symbol: string): string {
    return symbol.replace('/', '').toUpperCase();
  }

  /**
   * Retrieves Binance official exchange server time with latency audit
   */
  public async getServerTime(): Promise<BinanceServerTimeResult> {
    await this.throttle();
    const localTimeBefore = Date.now();
    const res = await fetch(`${BINANCE_BASE_URL}/time`);
    const localTimeAfter = Date.now();

    if (!res.ok) {
      throw new Error(`Binance server-time error (${res.status}): ${await res.text()}`);
    }

    const data = await res.json();
    const serverTime = Number(data.serverTime);
    const roundTripMs = localTimeAfter - localTimeBefore;
    const midpoint = localTimeBefore + roundTripMs / 2;
    const estimatedClockSkewMs = Math.round(serverTime - midpoint);

    return {
      serverTime,
      localTimeBefore,
      localTimeAfter,
      roundTripMs,
      estimatedClockSkewMs,
    };
  }

  /**
   * Fetches latest 24hr ticker price and stats with latency and timestamp tracking
   */
  public async get24HrTicker(symbol: string): Promise<BinanceTickerResult> {
    await this.throttle();
    const binanceSymbol = this.formatSymbol(symbol);
    const url = `${BINANCE_BASE_URL}/ticker/24hr?symbol=${binanceSymbol}`;

    const localTimeBefore = Date.now();
    const res = await fetch(url);
    const localTimeAfter = Date.now();

    if (!res.ok) {
      throw new Error(`Binance API error (${res.status}): ${await res.text()}`);
    }

    const data = await res.json();
    const exchangeTimestamp = Number(data.closeTime);
    const roundTripMs = localTimeAfter - localTimeBefore;
    // Data age calculated relative to when response was received locally
    const rawDelta = localTimeAfter - exchangeTimestamp;
    const dataAgeMs = Math.max(0, rawDelta);

    return {
      price: parseFloat(data.lastPrice),
      change24h: parseFloat(data.priceChangePercent),
      high24h: parseFloat(data.highPrice),
      low24h: parseFloat(data.lowPrice),
      volume24h: parseFloat(data.volume),
      timestamp: exchangeTimestamp,
      localTimeBefore,
      localTimeAfter,
      roundTripMs,
      dataAgeMs,
    };
  }

  /**
   * Fetches historical klines (candlesticks).
   * Distinguishes between open (currently forming) candles and completed candles.
   */
  public async getKlines(
    symbol: string,
    timeframe: Timeframe,
    limit: number = 100
  ): Promise<Candle[]> {
    await this.throttle();
    const binanceSymbol = this.formatSymbol(symbol);
    const interval = TIMEFRAME_TO_BINANCE[timeframe];
    const url = `${BINANCE_BASE_URL}/klines?symbol=${binanceSymbol}&interval=${interval}&limit=${limit}`;

    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Binance klines error (${res.status}): ${await res.text()}`);
    }

    const rawKlines = await res.json();
    if (!Array.isArray(rawKlines) || rawKlines.length === 0) {
      throw new Error(`Empty klines response from Binance for ${symbol} on ${timeframe}`);
    }

    const now = Date.now();

    return rawKlines.map((item: any) => {
      const openTime = Number(item[0]);
      const closeTime = Number(item[6]);
      const isClosed = now >= closeTime;

      return {
        timestamp: openTime, // Actual start time of candle
        closeTime, // Scheduled completion time
        open: parseFloat(item[1]),
        high: parseFloat(item[2]),
        low: parseFloat(item[3]),
        close: parseFloat(item[4]),
        volume: parseFloat(item[5]),
        isClosed,
      };
    });
  }
}

export const binanceClient = new BinanceClient();
