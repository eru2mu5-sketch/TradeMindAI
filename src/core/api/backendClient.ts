// =====================================================================
// TradeMind AI - Backend Client Connector
// Dispatches secret-dependent requests to the secure backend functions.
// Keeps all third-party private API keys strictly off the client.
// =====================================================================

export interface BackendHealthResponse {
  status: string;
  service: string;
  timestamp: number;
  providersConfigured: {
    openAi: boolean;
    twelveData: boolean;
    finnhub: boolean;
  };
}

export interface BackendAiInterpretResponse {
  success: boolean;
  modelUsed: string;
  narrative: string | null;
  notice?: string;
}

export class BackendClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:3001';
  }

  public setBaseUrl(url: string): void {
    this.baseUrl = url.replace(/\/$/, '');
  }

  public getBaseUrl(): string {
    return this.baseUrl;
  }

  /**
   * Checks health and active third-party integrations on the backend
   */
  public async checkHealth(): Promise<BackendHealthResponse | null> {
    try {
      const res = await fetch(`${this.baseUrl}/api/health`, { method: 'GET' });
      if (res.ok) {
        return await res.json();
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Dispatches quantitative payload to backend for OpenAI interpretation
   */
  public async requestAiInterpretation(payload: any): Promise<BackendAiInterpretResponse> {
    try {
      const res = await fetch(`${this.baseUrl}/api/ai/interpret`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        return await res.json();
      }
      return {
        success: false,
        modelUsed: 'TradeMind Quantitative Core v2.4 (Offline Fallback)',
        narrative: null,
        notice: `Backend returned status ${res.status}`,
      };
    } catch {
      return {
        success: false,
        modelUsed: 'TradeMind Quantitative Core v2.4 (Deterministic Fallback)',
        narrative: null,
        notice: 'Backend service unreachable; running on local quantitative engine.',
      };
    }
  }

  /**
   * Requests verified forex quote from backend proxy
   */
  public async getForexQuote(symbol: string): Promise<{
    price: number;
    bid: number;
    ask: number;
    change24h: number;
    timestamp: number;
    provider: string;
    isLive: boolean;
    status: 'LIVE' | 'SIMULATED' | 'UNAVAILABLE';
  }> {
    try {
      const res = await fetch(`${this.baseUrl}/api/forex/quote?symbol=${encodeURIComponent(symbol)}`);
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Return simulated fallback with transparent notice
    }

    const baseline = symbol.includes('JPY') ? 154.2 : 1.0845;
    return {
      price: baseline,
      bid: baseline - 0.0001,
      ask: baseline + 0.0001,
      change24h: 0.15,
      timestamp: Date.now(),
      provider: 'Local Engine (Backend Offline)',
      isLive: false,
      status: 'SIMULATED',
    };
  }
}

export const backendClient = new BackendClient();
