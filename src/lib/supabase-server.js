import { createClient } from '@supabase/supabase-js';

let _client = null;

// Server-side client with service role key - bypasses RLS
export function getSupabaseAdmin() {
  if (!_client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key || url === 'your_supabase_url_here') {
      throw new Error('Supabase 未配置，请在 .env.local 中设置 NEXT_PUBLIC_SUPABASE_URL 和 SUPABASE_SERVICE_ROLE_KEY');
    }
    _client = createClient(url, key);
  }
  return _client;
}

// For backward compat - lazy proxy
export const supabaseAdmin = new Proxy({}, {
  get(_, prop) {
    return getSupabaseAdmin()[prop];
  }
});
