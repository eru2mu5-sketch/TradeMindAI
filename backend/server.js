// =====================================================================
// TradeMind AI - Secure Backend Microservice
// Proxies secret API keys (OpenAI, TwelveData) server-to-server.
// Private API keys are strictly kept on the server and never exposed to the client.
// =====================================================================

const http = require('http');
const url = require('url');

const PORT = process.env.PORT || 3001;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const TWELVE_DATA_API_KEY = process.env.TWELVE_DATA_API_KEY || '';
const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY || '';

function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

const server = http.createServer(async (req, res) => {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  // 1. Health check endpoint
  if (req.method === 'GET' && pathname === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        status: 'ONLINE',
        service: 'TradeMind AI Secure Backend',
        timestamp: Date.now(),
        providersConfigured: {
          openAi: !!OPENAI_API_KEY && OPENAI_API_KEY.length > 5,
          twelveData: !!TWELVE_DATA_API_KEY && TWELVE_DATA_API_KEY.length > 5,
          finnhub: !!FINNHUB_API_KEY && FINNHUB_API_KEY.length > 5,
        },
      })
    );
    return;
  }

  // 2. Secure OpenAI Interpretation Endpoint (Keeps OPENAI_API_KEY off the device)
  if (req.method === 'POST' && pathname === '/api/ai/interpret') {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });

    req.on('end', async () => {
      try {
        const payload = JSON.parse(body);

        if (!OPENAI_API_KEY || OPENAI_API_KEY.trim().length === 0) {
          // Transparent response when key is not configured on server
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(
            JSON.stringify({
              success: false,
              modelUsed: 'TradeMind Quantitative Core v2.4 (Deterministic Server Fallback)',
              narrative: null,
              notice:
                'OpenAI API key is not configured in backend environment variables. Returning core quantitative engine evaluation.',
            })
          );
          return;
        }

        // Call OpenAI API server-to-server
        const openAiRes = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: 'gpt-4o',
            messages: [
              {
                role: 'system',
                content:
                  'You are an expert quantitative trading engine analyst. Provide a concise, 2-paragraph professional trader rationale strictly adhering to the calculated facts. Do not invent levels or indicator values.',
              },
              {
                role: 'user',
                content: `Summarize this quantitative setup into a professional trader rationale:\n${JSON.stringify(payload)}`,
              },
            ],
            max_tokens: 350,
            temperature: 0.2,
          }),
        });

        if (!openAiRes.ok) {
          const errText = await openAiRes.text();
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(
            JSON.stringify({
              success: false,
              modelUsed: 'TradeMind Quantitative Core v2.4',
              narrative: null,
              notice: `OpenAI upstream error (${openAiRes.status}): ${errText}`,
            })
          );
          return;
        }

        const aiData = await openAiRes.json();
        const narrative = aiData.choices?.[0]?.message?.content || null;

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            success: true,
            modelUsed: 'GPT-4o (Server Proxy)',
            narrative,
          })
        );
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message || 'Server error processing AI interpretation' }));
      }
    });
    return;
  }

  // 3. Secure Forex Quote Endpoint (Keeps TWELVE_DATA_API_KEY off the device)
  if (req.method === 'GET' && pathname === '/api/forex/quote') {
    const symbol = parsedUrl.query.symbol || 'EUR/USD';

    if (TWELVE_DATA_API_KEY && TWELVE_DATA_API_KEY.length > 5) {
      try {
        const upstreamUrl = `https://api.twelvedata.com/price?symbol=${encodeURIComponent(symbol)}&apikey=${TWELVE_DATA_API_KEY}`;
        const upstreamRes = await fetch(upstreamUrl);
        if (upstreamRes.ok) {
          const data = await upstreamRes.json();
          if (data.price) {
            const price = parseFloat(data.price);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(
              JSON.stringify({
                symbol,
                price,
                bid: price - 0.0001,
                ask: price + 0.0001,
                change24h: 0.12,
                timestamp: Date.now(),
                provider: 'TwelveData (Server Verified)',
                isLive: true,
                status: 'LIVE',
              })
            );
            return;
          }
        }
      } catch {
        // Fall through to fallback
      }
    }

    // Baseline fallback quote when no server key is configured
    const baselinePrices = {
      'EUR/USD': 1.0845,
      'GBP/USD': 1.293,
      'USD/JPY': 154.2,
      'GBP/JPY': 199.35,
    };
    const base = baselinePrices[symbol] || 1.0;
    const jitter = Math.sin(Date.now() / 10000) * 0.0004;
    const price = Number((base + jitter).toFixed(symbol.includes('JPY') ? 3 : 5));

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        symbol,
        price,
        bid: Number((price - 0.0001).toFixed(5)),
        ask: Number((price + 0.0001).toFixed(5)),
        change24h: 0.18,
        timestamp: Date.now(),
        provider: 'Simulated Engine (No Server Key)',
        isLive: false,
        status: 'SIMULATED',
      })
    );
    return;
  }

  // 404 handler
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Endpoint not found' }));
});

if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`[TradeMind AI] Secure Backend Service listening on port ${PORT}`);
    console.log(`[TradeMind AI] OpenAI Key Configured: ${!!OPENAI_API_KEY}`);
    console.log(`[TradeMind AI] TwelveData Key Configured: ${!!TWELVE_DATA_API_KEY}`);
  });
}

module.exports = server;
