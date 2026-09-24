// ─────────────────────────────────────────────────────────────
// Supabase project credentials.
// Get these from: Supabase Dashboard → Project Settings → API
// The "anon" key is safe to expose in client-side code — it only
// works within the permissions set by your Row Level Security
// policies (see README.md for the SQL to set those up).
// ─────────────────────────────────────────────────────────────

const SUPABASE_URL = "https://rxjawzcvbgpnjvsnlepb.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_2e4ia7O5mt2wkJBSwSduPA_4HX2kx0X";

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);