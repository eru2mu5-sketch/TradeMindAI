# TradeMind AI 🧠📈
### Professional AI-Powered Cryptocurrency & Forex Trading Analysis Platform

**TradeMind AI** is an institutional-grade mobile market analysis and trade-planning application built with **React Native**, **Expo**, **TypeScript**, and **Supabase**. Its central purpose is to analyse live cryptocurrency and forex markets across multiple timeframes and provide actionable **LONG**, **SHORT**, or **NO TRADE** analyses with calculated entry prices, structural stop losses, and take-profit targets adhering strictly to a minimum 1:2.0 Risk-to-Reward ratio.

---

## 🏛 Application Architecture & Features

### 1. Navigation & Modern Dark-Mode UI
- **Markets Dashboard**: Real-time ticker prices, 24h % change, market session pills (London, New York, Tokyo, Weekend), data provider status, and freshness indicators (`LIVE` vs `SIMULATED`).
- **AI Analysis Engine**: Deep multi-timeframe synthesis (4H, 1H, 15M, 5M) returning structured verdicts (**LONG**, **SHORT**, **NO TRADE**), setup status (**CONFIRMED**, **DEVELOPING**, **NO TRADE**), entry zones, stop losses with structural and ATR buffers, TP1 (1:2+ R:R), TP2 (1:3+ R:R), and optional TP3, technical score out of 10 with 5-pillar breakdown, fundamental bias, invalidation conditions, and AI reasoning.
- **Interactive TradingView Charts**: Candlestick charts with 4H, 1H, 15M, and 5M timeframe selection, zoom, pan navigation, and technical indicator overlays.
- **Trading Journal**: Complete trade log distinguishing hypothetical AI setups from actual user trades, tracking R-multiple outcomes (+2.2R, -1.0R), net PnL, notes, and search/filtering.
- **Performance Analytics**: Quantitative metrics including Win Rate %, Average R, Profit Factor, Expectancy in R, Maximum Drawdown %, Long vs Short performance, Crypto vs Forex performance, Cumulative Equity Curve, and R-distribution histogram.
- **Risk Calculator**: Interactive sizing engine calculating exact lot sizes for forex (pips, pip values, contract sizes) and units for crypto, enforcing 0.5% default risk, 1.5% max daily loss, and anti-martingale guardrails.
- **Settings & Configuration**: Secure storage of OpenAI API keys, Supabase credentials, Forex provider keys (TwelveData, Finnhub, ExchangeRate), and notification preferences.

---

## 📊 Technical Analysis Engine (Section 4 & 5)
Pure mathematical calculations computed directly from market candles:
- **Exponential Moving Averages**: EMA 20, EMA 50, EMA 200
- **Momentum Oscillators**: Relative Strength Index (RSI 14 using Wilder's smoothing), MACD (12, 26, 9), Stochastic RSI (14, 14, 3, 3)
- **Volatility & Volume**: Average True Range (ATR 14), Volume-Weighted Average Price (VWAP), Bollinger Bands (20, 2), Volume SMA 20, Candle Volatility %

### Market Structure & Order Flow
- **Swing Points**: Symmetric Swing High and Swing Low detection
- **Break of Structure (BOS)**: Strictly distinguishes wick penetration from confirmed candle close breaks
- **Change of Character (CHoCH)**: Detects macro and intermediate trend reversals
- **Fair Value Gaps (FVG)**: 3-candle imbalance detection with 50% Consequent Encroachment (CE) and mitigation tracking
- **Order Blocks (OB)**: Last opposing candle before aggressive displacement
- **Liquidity Sweeps**: Wick pierces beyond swing liquidity pools and closes back inside with long rejection wicks
- **Equal Highs / Equal Lows (EQH / EQL)**: Identifies liquidity magnets within tolerance
- **RSI Divergences**: Detects regular bullish and regular bearish divergences

### Multi-Timeframe Alignment (MTF)
- **4H**: Overall market direction, major S/R, EMA 20/50/200 structure
- **1H**: Market structure, BOS/CHoCH, liquidity pools, HTF trend alignment
- **15M**: Trading setup, pullbacks, FVG and Order Block context
- **5M**: Entry trigger candle, rejection confirmation, stop-loss placement, and invalidation

---

## 🎯 Technical Scoring (0 to 10 Points)
Heuristic quantitative alignment score across 5 distinct pillars (0–2 points each):
1. **Trend Alignment (0–2)**: 4H direction and EMA 20/50/200 alignment.
2. **Market Structure (0–2)**: Confirmed BOS/CHoCH, Demand/Supply zones, FVG context.
3. **Momentum (0–2)**: RSI expansion zone (45–65), MACD histogram expansion, RSI divergences.
4. **Volume & Volatility (0–2)**: Volume ratio (>= 1.2x 20-period avg), healthy ATR volatility.
5. **Entry Confirmation (0–2)**: Liquidity sweep, pin bar / rejection candle, FVG CE touch.

**Interpretation:**
- **8–10**: Strong technical alignment
- **6–7**: Moderate alignment; additional confirmation needed
- **0–5**: Weak setup; generally **NO TRADE**

---

## 📦 Project Directory Structure

```
TradeMindAI/
├── src/
│   ├── types/                  # Domain TypeScript types
│   │   ├── market.ts           # Candle, Instrument, MarketPriceSnapshot
│   │   ├── indicators.ts       # BollingerBands, MACD, StochRSI, TechnicalIndicatorSet
│   │   ├── structure.ts        # BOS, CHoCH, FVG, OrderBlock, LiquiditySweep, Swings
│   │   ├── analysis.ts         # Decision, SetupStatus, AIAnalysisResult, Levels
│   │   ├── risk.ts             # RiskCalculatorInputs, RiskCalculationResult
│   │   └── journal.ts          # JournalEntry, PerformanceAnalytics
│   ├── core/
│   │   ├── engine/             # Core Quantitative Engines
│   │   │   ├── technicalIndicators.ts  # EMA, RSI, MACD, StochRSI, ATR, BB, VWAP
│   │   │   ├── marketStructure.ts      # Swing detection, BOS, CHoCH, FVG, Sweeps
│   │   │   ├── multiTimeframe.ts       # 4H, 1H, 15M, 5M synthesis
│   │   │   ├── fundamentalEngine.ts    # Central banks, CPI, crypto derivatives
│   │   │   ├── technicalScoring.ts     # 0-10 score across 5 pillars
│   │   │   ├── tradePlanner.ts         # Structural Entry, SL, TP1/2/3, R:R >= 2.0
│   │   │   ├── riskCalculator.ts       # Position sizing, Forex lots, Crypto units
│   │   │   ├── aiAnalysisEngine.ts     # AI executor & strict schema validator
│   │   │   └── journalService.ts       # Journal CRUD & quantitative analytics
│   │   └── api/                # Market Data Abstraction Layer
│   │       ├── binanceClient.ts        # Binance public API connector
│   │       ├── forexClient.ts          # TwelveData / Finnhub / FX provider
│   │       └── marketDataService.ts    # Unified cache, snapshots, 4-TF klines
│   ├── components/             # Reusable Dark-Mode Components
│   │   ├── Header.tsx                  # App logo, session pill, live status
│   │   ├── VerdictBadge.tsx            # LONG, SHORT, NO TRADE badge with glow
│   │   ├── ScoreMeter.tsx              # 0-10 visual gauge with radar breakdown
│   │   ├── MultiTimeframeMatrix.tsx    # 4H, 1H, 15M, 5M matrix display
│   │   └── TradeLevelsCard.tsx         # Trade ladder: Entry, SL, TP1, TP2, TP3
│   ├── screens/                # Main Application Screens
│   │   ├── MarketsScreen.tsx           # Live Watchlists & Market Sessions
│   │   ├── AnalysisScreen.tsx          # Multi-Timeframe AI Analysis
│   │   ├── TradingViewScreen.tsx       # Interactive TradingView Charts
│   │   ├── JournalScreen.tsx           # Trading Journal with R-multiples
│   │   ├── PerformanceScreen.tsx       # Quantitative Analytics & Equity Curve
│   │   ├── RiskCalculatorScreen.tsx    # Position Sizing Calculator
│   │   └── SettingsScreen.tsx          # API Keys & Risk Settings
│   ├── theme/
│   │   └── colors.ts           # Dark charcoal, emerald bullish, crimson bearish
│   ├── services/
│   │   └── notifications.ts    # Expo notifications handler
│   └── navigation/
│       └── AppNavigator.tsx    # Bottom tab navigation (5 core tabs)
├── tests/
│   ├── runTests.js             # Comprehensive automated test harness
│   ├── technicalIndicators.test.ts
│   ├── marketStructure.test.ts
│   ├── riskCalculator.test.ts
│   ├── tradePlanner.test.ts
│   ├── aiResponseSchema.test.ts
│   └── index.ts
├── supabase/
│   ├── schema.sql              # Production SQL Schema with RLS & Triggers
│   └── README.md               # Supabase deployment instructions
├── App.tsx                     # Root App component
├── app.json                    # Expo project configuration
├── index.js                    # Entry point registration
├── package.json
├── tsconfig.json
└── .env.example                # Environment variables template
```

---

## 🚀 Installation & Setup Instructions

### Prerequisites
- Node.js LTS (v20+ recommended)
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/your-username/TradeMindAI.git
cd TradeMindAI
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Populate your credentials:
- `EXPO_PUBLIC_SUPABASE_URL`: Your Supabase Project URL
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase Anon Key
- `OPENAI_API_KEY`: OpenAI API Key (optional for natural language summaries)
- `TWELVE_DATA_API_KEY`: TwelveData API key for live forex quotes

### 3. Deploy Supabase Database
1. Go to your Supabase project dashboard.
2. Open the **SQL Editor**.
3. Paste the contents of `supabase/schema.sql` and execute the script.
4. Verify all 10 tables (`profiles`, `user_settings`, `notification_preferences`, `instruments`, `watchlists`, `market_analyses`, `technical_indicators`, `trade_plans`, `journal_entries`, `performance_metrics`) are created with Row Level Security enabled.

---

## 🧪 Automated Testing

Run the automated quantitative test suite:
```bash
node tests/runTests.js
```

### Test Coverage Highlights:
- **Technical Indicators**: EMA seed SMA correctness, Wilder's RSI smoothing (0 to 100), MACD histogram calculation, ATR true range volatility, Bollinger bands bandwidth, VWAP volume weighting.
- **Market Structure**: Swing detection, distinction of wick penetration from confirmed structural breaks (BOS), Fair Value Gap (FVG) detection and CE 50% midpoint, liquidity sweep recognition.
- **Risk Management**: Forex lot size and pip values, Crypto coin units, cash risk percentage rules, rejection of sub-2.0 R:R setups.
- **Trade Planner**: Structural stop loss with ATR buffer, TP1/TP2/TP3 target ladder, minimum 1:2.0 planned R:R enforcement.
- **AI Schema Validation**: Strict schema compliance, invalid decision rejection, score out-of-bounds rejection, inverted stop loss rejection.

**Test Results:**
```
======================================================================
TOTAL TESTS:   32
PASSED TESTS:  32
FAILED TESTS:  0
STATUS:        ALL QUANTITATIVE TESTS PASSED (100% SUCCESS)
======================================================================
```

---

## 📱 Running the Application

### Start the Expo Development Server
```bash
npm start
# or
npx expo start
```

### Testing on Physical Device:
1. Install **Expo Go** from Google Play Store or Apple App Store.
2. Scan the terminal QR code with your camera (iOS) or Expo Go app (Android).

### Testing on Web:
```bash
npm run web
```

---

## 🏗 Building Mobile Application Binaries

### Android Build (APK / AAB)
Using EAS (Expo Application Services):
```bash
npm install -g eas-cli
eas login
eas build:configure
eas build --platform android --profile preview
```

### iOS Build (IPA)
```bash
eas build --platform ios --profile preview
```

---

## 🔒 Security & Data Integrity Principles
1. **No Hardcoded Secrets**: All API keys and tokens are stored in environment variables or user device storage.
2. **Never Fabricate Data**: When market feeds or fundamental data are disconnected or stale, the application explicitly displays `SIMULATED` or `UNAVAILABLE` rather than generating false signals.
3. **Strict Risk Discipline**: The engine rejects setups with planned Risk/Reward ratios below 1:2.0 or with invalid geometry (stop loss on the wrong side of entry).
4. **Educational Transparency**: The application explicitly informs users that leverage does not decrease risk, but rather amplifies liquidation hazard.
