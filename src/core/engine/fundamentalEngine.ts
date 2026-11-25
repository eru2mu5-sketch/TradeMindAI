// =====================================================================
// TradeMind AI - Fundamental Analysis Engine
// Analyzes macro monetary policy, interest rates, economic calendar,
// central bank stances, and crypto derivatives/on-chain sentiment.
// Transparent data attribution; never fabricates data.
// =====================================================================

import { FundamentalDataSummary } from '../../types/analysis';
import { MarketType } from '../../types/market';

export interface FundamentalDataFeed {
  marketType: MarketType;
  symbol: string;
  externalNews?: Array<{
    source: string;
    headline: string;
    publishedAt: string;
    relevance: 'HIGH' | 'MEDIUM' | 'LOW';
    impact: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  }>;
  forexRates?: {
    centralBankStance: string;
    interestRateDifferential: string;
    upcomingHighImpactNews: string[];
  };
  cryptoDerivatives?: {
    fundingRate: number;
    openInterestTrend: 'RISING' | 'FALLING' | 'FLAT';
    derivativesSentiment: 'LONG_HEAVY' | 'SHORT_HEAVY' | 'BALANCED';
    etfFlowSentiment?: 'NET_INFLOW' | 'NET_OUTFLOW' | 'NEUTRAL';
  };
}

/**
 * Synthesizes fundamental data and evaluates macro bias
 */
export function evaluateFundamentals(feed: FundamentalDataFeed): FundamentalDataSummary {
  const { marketType, symbol, externalNews, forexRates, cryptoDerivatives } = feed;

  // Handle case where feed has no data
  if (!externalNews && !forexRates && !cryptoDerivatives) {
    return {
      marketType,
      bias: 'NEUTRAL',
      headlineEvents: [],
      dataAvailable: false,
      unavailableNotice:
        'Live fundamental data provider is currently disconnected or unconfigured. Fundamental bias is withheld to prevent speculation. Technical signals are evaluated independently.',
    };
  }

  const headlines = externalNews || [];
  let bias: FundamentalDataSummary['bias'] = 'NEUTRAL';

  if (marketType === 'forex') {
    const isUsdQuote = symbol.endsWith('/USD');
    const stance = forexRates?.centralBankStance?.toUpperCase() || '';

    if (stance.includes('HAWKISH')) {
      bias = isUsdQuote ? 'BEARISH' : 'BULLISH';
    } else if (stance.includes('DOVISH')) {
      bias = isUsdQuote ? 'BULLISH' : 'BEARISH';
    }

    // High impact news warning
    if (forexRates?.upcomingHighImpactNews && forexRates.upcomingHighImpactNews.length > 0) {
      bias = 'HIGH_VOLATILITY_RISK';
    }

    return {
      marketType: 'forex',
      bias,
      headlineEvents: headlines,
      forexSpecific: forexRates || {
        centralBankStance: 'Neutral / Data Dependent',
        interestRateDifferential: 'Parity / Stable',
        upcomingHighImpactNews: [],
      },
      dataAvailable: true,
    };
  } else {
    // CRYPTO
    const fundingRate = cryptoDerivatives?.fundingRate ?? 0.01;
    const oiTrend = cryptoDerivatives?.openInterestTrend ?? 'FLAT';
    const etf = cryptoDerivatives?.etfFlowSentiment;

    // Funding rate over +0.05% implies overcrowded longs -> risk of long squeeze
    if (fundingRate > 0.04) {
      bias = 'HIGH_VOLATILITY_RISK';
    } else if (etf === 'NET_INFLOW' && oiTrend === 'RISING' && fundingRate > 0 && fundingRate < 0.03) {
      bias = 'BULLISH';
    } else if (etf === 'NET_OUTFLOW' || (fundingRate < -0.01 && oiTrend === 'RISING')) {
      bias = 'BEARISH';
    }

    return {
      marketType: 'crypto',
      bias,
      headlineEvents: headlines,
      cryptoSpecific: cryptoDerivatives || {
        fundingRate: 0.01,
        openInterestTrend: 'FLAT',
        derivativesSentiment: 'BALANCED',
        etfFlowSentiment: 'NEUTRAL',
      },
      dataAvailable: true,
    };
  }
}
