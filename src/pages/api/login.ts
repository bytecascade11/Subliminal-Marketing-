import type { APIRoute } from 'astro';
import { supabaseAnon } from '../../lib/supabase';
import { setSession, json } from '../../lib/auth';

export const POST: APIRoute = async ({ request, cookies }) => {
  const { email, password } = await request.json();
  const { data, error } = await supabaseAnon.auth.signInWithPassword({ email, password });
  if (error || !data.session) return json({ error: 'Wrong email or password.' }, 401);
  setSession(cookies, data.session);
  return json({ ok: true });
};
