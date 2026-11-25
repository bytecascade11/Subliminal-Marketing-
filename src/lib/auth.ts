import type { AstroCookies } from 'astro';
import { supabaseAdmin, supabaseAnon } from './supabase';

const opts = { httpOnly: true, secure: true, sameSite: 'lax' as const, path: '/' };

export function setSession(cookies: AstroCookies, s: { access_token: string; refresh_token: string }) {
  cookies.set('sb-access', s.access_token, { ...opts, maxAge: 3600 });
  cookies.set('sb-refresh', s.refresh_token, { ...opts, maxAge: 60 * 60 * 24 * 30 });
}

export function clearSession(cookies: AstroCookies) {
  cookies.delete('sb-access', { path: '/' });
  cookies.delete('sb-refresh', { path: '/' });
}

export async function getSession(cookies: AstroCookies) {
  let userId: string | undefined;
  const access = cookies.get('sb-access')?.value;
  if (access) {
    const { data } = await supabaseAdmin.auth.getUser(access);
    userId = data.user?.id;
  }
  if (!userId) {
    const refresh = cookies.get('sb-refresh')?.value;
    if (!refresh) return null;
    const { data, error } = await supabaseAnon.auth.refreshSession({ refresh_token: refresh });
    if (error || !data.session) return null;
    setSession(cookies, data.session);
    userId = data.session.user.id;
  }
  const { data: profile } = await supabaseAdmin.from('profiles').select('*').eq('id', userId).single();
  return profile ? { userId, profile } : null;
}

export const json = (body: object, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
