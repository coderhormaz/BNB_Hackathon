import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

console.log('🔗 Connecting to Supabase:', supabaseUrl);

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
    // Reduce auth timeout to prevent hanging
    flowType: 'pkce'
  },
  global: {
    headers: {
      'X-Client-Info': 'opbnb-ai-assistant@1.0.0',
      'Cache-Control': 'no-cache',
    },
    fetch: (url, options = {}) => {
      return fetch(url, {
        ...options,
        // Set reasonable timeout for all requests
        signal: AbortSignal.timeout(30000), // 30 seconds max
      });
    },
  },
  db: {
    schema: 'public',
  },
  // Add realtime options for better connection handling
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// Connection health checker
export const testConnection = async (): Promise<{ success: boolean; latency: number; error?: string }> => {
  const startTime = Date.now();
  try {
    // Try a simple query to test connection
    const { error } = await supabase
      .from('user_wallets')
      .select('count')
      .limit(1);
    
    const latency = Date.now() - startTime;
    
    if (error) {
      return { success: false, latency, error: error.message };
    }
    
    return { success: true, latency };
  } catch (error) {
    const latency = Date.now() - startTime;
    return { 
      success: false, 
      latency, 
      error: error instanceof Error ? error.message : 'Connection failed' 
    };
  }
};

// Database types
export interface UserWallet {
  id: string;
  user_id: string;
  wallet_address: string;
  encrypted_private_key: string;
  created_at: string;
  updated_at: string;
}
