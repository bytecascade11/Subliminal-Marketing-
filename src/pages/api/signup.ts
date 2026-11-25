import type { APIRoute } from 'astro';
import { supabaseAdmin } from '../../lib/supabase';

export const POST: APIRoute = async ({ request }) => {
  const { code, name, email, password } = await request.json();

  if (!code || !name || !email || !password || password.length < 8) {
    return new Response(JSON.stringify({ error: 'Fill all fields. Password must be 8+ characters.' }), { status: 400 });
  }

  // 1. Claim the code atomically so it can only be used once
  const { data: invite } = await supabaseAdmin
    .from('invites')
    .update({ used_at: new Date().toISOString() })
    .eq('code', code.trim())
    .is('used_at', null)
    .select()
    .single();

  if (!invite) {
    return new Response(JSON.stringify({ error: 'Invalid or already used invite code.' }), { status: 400 });
  }

  // 2. Create the account
  const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (error || !created.user) {
    // release the code so it isn't wasted
    await supabaseAdmin.from('invites').update({ used_at: null }).eq('code', invite.code);
    return new Response(JSON.stringify({ error: error?.message ?? 'Could not create account.' }), { status: 400 });
  }

  // 3. Save profile as pending, record who referred them
  await supabaseAdmin.from('profiles').insert({
    id: created.user.id,
    full_name: name,
    referred_by: invite.created_by,
    status: 'pending',
  });
  await supabaseAdmin.from('invites').update({ used_by: created.user.id }).eq('code', invite.code);

  return new Response(JSON.stringify({ ok: true }), { status: 200 });
};
