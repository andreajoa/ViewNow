import { createClient } from '@supabase/supabase-js';
export function getClients() {
  const url = process.env.VITE_SUPABASE_URL;
  const anon = process.env.VITE_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !anon || !serviceKey) throw new Error('Supabase server não configurado.');
  return {
    publicClient: createClient(url, anon, { auth: { persistSession: false } }),
    adminClient: createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } })
  };
}
export async function authenticate(request: Request) {
  const header = request.headers.get('authorization') || '';
  if (!header.startsWith('Bearer ')) throw new Error('Sessão necessária.');
  const clients = getClients();
  const { data, error } = await clients.publicClient.auth.getUser(header.slice(7));
  if (error || !data.user) throw new Error('Sessão inválida.');
  return { user: data.user, adminClient: clients.adminClient };
}
export const err = (e: unknown) => Response.json(
  { error: e instanceof Error ? e.message : 'Erro inesperado.' }, { status: 400 }
);
