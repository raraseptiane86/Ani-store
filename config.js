/* Public project URL and publishable/anon key ONLY. Never put service_role or secret keys in browser files. */
const SUPABASE_URL = 'PASTE_SUPABASE_PROJECT_URL';
const SUPABASE_ANON_KEY = 'PASTE_SUPABASE_PUBLISHABLE_OR_ANON_KEY';
window.aspDb = (SUPABASE_URL.startsWith('https://') && !SUPABASE_ANON_KEY.startsWith('PASTE_')) ? supabase.createClient(SUPABASE_URL,SUPABASE_ANON_KEY) : null;
