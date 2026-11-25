import type { APIRoute } from 'astro';
import { supabaseAdmin } from '../../lib/supabase';
import { getSession, json } from '../../lib/auth';

export const POST: APIRoute = async ({ request, cookies }) => {
  const s = await getSession(cookies);
  if (!s || !s.profile.is_admin) return json({ error: 'Admins only.' }, 403);

  const { id, action } = await request.json();
  const status = action === 'approve' ? 'approved' : 'rejected';
  const { error } = await supabaseAdmin.from('profiles').update({ status }).eq('id', id);
  if (error) return json({ error: 'Update failed.' }, 500);
  return json({ ok: true });
};
