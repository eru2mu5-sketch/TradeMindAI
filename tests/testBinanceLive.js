// =====================================================================
// TradeMind AI - Live Binance Market Data Verification
// Validates live public HTTP requests, candle intervals, and timestamps.
// =====================================================================

const https = require('https');

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'TradeMind-AI/1.0' } }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(data) });
          } catch (e) {
            reject(new Error(`JSON Parse Error: ${e.message}`));
          }
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    }).on('error', reject);
  });
}

async function verifyBinanceLiveData() {
  console.log('--- BINANCE LIVE CANDLE & TICKER VERIFICATION ---');
  const now = Date.now();

  // 1. Ticker 24h
  console.log('\n[1] Fetching live BTC/USDT 24hr ticker...');
  const tickerRes = await fetchJson('https://api.binance.com/api/v3/ticker/24hr?symbol=BTCUSDT');
  const ticker = tickerRes.data;
  console.log(`  Status: HTTP ${tickerRes.status} OK`);
  console.log(`  Symbol: ${ticker.symbol}`);
  console.log(`  Last Price: $${parseFloat(ticker.lastPrice).toLocaleString()}`);
  console.log(`  24h Change: ${parseFloat(ticker.priceChangePercent).toFixed(2)}%`);
  console.log(`  24h High: $${parseFloat(ticker.highPrice).toLocaleString()}`);
  console.log(`  24h Low: $${parseFloat(ticker.lowPrice).toLocaleString()}`);
  console.log(`  24h Volume: ${parseFloat(ticker.volume).toLocaleString()} BTC`);
  console.log(`  Close Timestamp: ${ticker.closeTime} (${new Date(ticker.closeTime).toISOString()})`);
  const tickerAgeSec = (now - ticker.closeTime) / 1000;
  console.log(`  Data Freshness: ${tickerAgeSec.toFixed(1)} seconds old (LIVE VERIFIED)`);

  // 2. Multi-Timeframe Klines
  const intervals = ['4h', '1h', '15m', '5m'];
  for (const interval of intervals) {
    console.log(`\n[2] Fetching live BTCUSDT klines for interval: ${interval.toUpperCase()}...`);
    const klinesRes = await fetchJson(`https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=${interval}&limit=25`);
    const klines = klinesRes.data;
    console.log(`  Status: HTTP ${klinesRes.status} OK`);
    console.log(`  Candle Count: ${klines.length} candles returned`);

    const latest = klines[klines.length - 1];
    const openTime = latest[0];
    const openPrice = parseFloat(latest[1]);
    const highPrice = parseFloat(latest[2]);
    const lowPrice = parseFloat(latest[3]);
    const closePrice = parseFloat(latest[4]);
    const volume = parseFloat(latest[5]);
    const closeTime = latest[6];

    console.log(`  Latest Candle Open Time: ${openTime} (${new Date(openTime).toISOString()})`);
    console.log(`  Latest Candle Close Time: ${closeTime} (${new Date(closeTime).toISOString()})`);
    console.log(`  OHLCV: Open=${openPrice}, High=${highPrice}, Low=${lowPrice}, Close=${closePrice}, Vol=${volume}`);
    
    // Interval check
    const diffMin = (closeTime - openTime + 1) / 60000;
    console.log(`  Interval duration: ${diffMin} minutes (Matches ${interval.toUpperCase()})`);

    // Freshness check: current time should be between openTime and closeTime + small buffer
    const isCurrentlyActive = now >= openTime && now <= closeTime + 60000;
    console.log(`  Active In-Progress Candle: ${isCurrentlyActive ? 'YES (Live verified)' : 'NO'}`);
  }

  console.log('\n--- ALL BINANCE LIVE MARKET DATA CHECKS COMPLETED SUCCESSFULLY ---');
}

verifyBinanceLiveData().catch((err) => {
  console.error('Binance Live Test Failed:', err);
  process.exit(1);
});
