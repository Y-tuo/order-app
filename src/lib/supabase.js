import { createClient } from '@supabase/supabase-js';

let _client = null;

export function getSupabase() {
  if (!_client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key || url === 'your_supabase_url_here') {
      // Return a dummy client during build
      return createClient('https://placeholder.supabase.co', 'placeholder');
    }
    _client = createClient(url, key);
  }
  return _client;
}

export const supabase = new Proxy({}, {
  get(_, prop) {
    return getSupabase()[prop];
  }
});
