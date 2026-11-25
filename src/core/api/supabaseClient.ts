// =====================================================================
// TradeMind AI - Supabase Client & Connection Manager
// Enforces client-safe authentication: ONLY public anon key is permitted.
// Service-role key is strictly prohibited and rejected on the client.
// =====================================================================

import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

/**
 * Checks whether a key is a privileged service_role key by inspecting
 * raw text and decoding the JWT payload if applicable.
 */
export function isServiceRoleKey(key: string): boolean {
  if (!key || typeof key !== 'string') return false;
  if (key.toLowerCase().includes('service_role')) return true;

  try {
    const parts = key.split('.');
    if (parts.length >= 2) {
      const payloadBase64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const decoded =
        typeof atob === 'function'
          ? atob(payloadBase64)
          : Buffer.from(payloadBase64, 'base64').toString('utf8');
      if (decoded.includes('"role":"service_role"') || decoded.toLowerCase().includes('service_role')) {
        return true;
      }
    }
  } catch {
    // If parsing fails, key is not a decodable service_role JWT
  }
  return false;
}

class SupabaseService {
  private client: SupabaseClient | null = null;
  private isKeyValid: boolean = false;

  constructor() {
    this.initialize();
  }

  private initialize(): void {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      this.client = null;
      this.isKeyValid = false;
      return;
    }

    // Security Gate: Ensure no service_role key is ever embedded on the client
    if (isServiceRoleKey(SUPABASE_ANON_KEY)) {
      console.error(
        '[TradeMind AI Security Alert] CRITICAL: Service-role key detected in client environment. Supabase client initialization BLOCKED. Use public anon key only.'
      );
      this.client = null;
      this.isKeyValid = false;
      return;
    }

    try {
      this.client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: false,
        },
      });
      this.isKeyValid = true;
    } catch (err) {
      console.warn('[TradeMind AI] Supabase client initialization failed:', err);
      this.client = null;
      this.isKeyValid = false;
    }
  }

  public isConfigured(): boolean {
    return this.client !== null && this.isKeyValid;
  }

  public getClient(): SupabaseClient | null {
    return this.client;
  }

  public async testConnection(): Promise<{
    connected: boolean;
    error?: string;
  }> {
    if (!this.client) {
      return {
        connected: false,
        error: 'Supabase credentials not configured or placeholder values detected.',
      };
    }

    try {
      // Query public instruments table
      const { data, error } = await this.client.from('instruments').select('count', { count: 'exact', head: true });
      if (error) {
        return { connected: false, error: error.message };
      }
      return { connected: true };
    } catch (err: any) {
      return { connected: false, error: err.message || 'Network error connecting to Supabase' };
    }
  }
}

export const supabaseService = new SupabaseService();
