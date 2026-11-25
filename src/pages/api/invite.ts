import type { APIRoute } from 'astro';
import { supabaseAdmin } from '../../lib/supabase';
import { getSession, json } from '../../lib/auth';

export const POST: APIRoute = async ({ cookies }) => {
  const s = await getSession(cookies);
  if (!s || s.profile.status !== 'approved') return json({ error: 'Not allowed.' }, 403);

  const { count } = await supabaseAdmin
    .from('invites')
    .select('code', { count: 'exact', head: true })
    .eq('created_by', s.userId)
    .is('used_at', null);
  if ((count ?? 0) >= 3) return json({ error: 'You already have 3 unused codes.' }, 400);

  const code = 'AJO-' + crypto.randomUUID().replace(/-/g, '').slice(0, 8).toUpperCase();
  const { error } = await supabaseAdmin.from('invites').insert({ code, created_by: s.userId });
  if (error) return json({ error: 'Could not create code.' }, 500);
  return json({ code });
};
