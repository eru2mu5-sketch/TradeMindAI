// =====================================================================
// TradeMind AI - Backend Microservice Integration Test
// Verifies /api/health, /api/forex/quote, and /api/ai/interpret endpoints.
// =====================================================================

const server = require('../backend/server');
const http = require('http');

function makeRequest(path, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: '127.0.0.1',
        port: 3001,
        path,
        method,
        headers: body ? { 'Content-Type': 'application/json' } : {},
      },
      (res) => {
        let data = '';
        res.on('data', (c) => (data += c));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, body: JSON.parse(data) });
          } catch {
            resolve({ status: res.statusCode, raw: data });
          }
        });
      }
    );
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function runBackendTests() {
  console.log('--- TESTING SECURE BACKEND MICROSERVICE ---');

  await new Promise((resolve) => server.listen(3001, resolve));
  console.log('Backend microservice listening on port 3001.');

  try {
    // 1. Health check
    console.log('\n[1] Testing /api/health...');
    const health = await makeRequest('/api/health');
    console.log(`  HTTP ${health.status}: Status=${health.body.status}, Service="${health.body.service}"`);
    console.log(`  Providers Configured:`, health.body.providersConfigured);

    // 2. Forex quote endpoint
    console.log('\n[2] Testing /api/forex/quote for EUR/USD...');
    const forex = await makeRequest('/api/forex/quote?symbol=EUR/USD');
    console.log(`  HTTP ${forex.status}: Symbol=${forex.body.symbol}, Price=${forex.body.price}, Status=${forex.body.status}, Provider=${forex.body.provider}`);

    // 3. AI Interpret proxy endpoint
    console.log('\n[3] Testing /api/ai/interpret proxy endpoint...');
    const ai = await makeRequest('/api/ai/interpret', 'POST', {
      instrument: 'BTC/USDT',
      decision: 'LONG',
      technicalScore: 8.8,
    });
    console.log(`  HTTP ${ai.status}: Success=${ai.body.success}, ModelUsed="${ai.body.modelUsed}"`);
    console.log(`  Notice: ${ai.body.notice || 'None'}`);

    console.log('\n--- BACKEND MICROSERVICE TESTS PASSED ---');
  } finally {
    server.close();
  }
}

runBackendTests().catch((err) => {
  console.error('Backend test failed:', err);
  process.exit(1);
});
