import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Platform } from './video';
export type Video = {
  id:string; user_id:string; title:string; url:string; platform:Platform; embed_url:string|null;
  current_views:number; target_views:number; updated_at?:string; created_at:string;
};
export type Profile = { id:string; plan:string; is_admin:boolean; stripe_customer_id:string|null };
// The fallback uses ONLY Supabase's browser-safe publishable key, never a secret/service key.
// Production deployments may override both values in Vercel environment settings.
const publicUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ctzjczesrsxwbiemnquf.supabase.co';
const publicKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_B1bDlSa49bvOGKsPB4Jfug_p-cKn_tb';
export const configured = Boolean(publicUrl && publicKey);
export const supabase: SupabaseClient | null = configured
  ? createClient(publicUrl, publicKey)
  : null;
const KEY = 'viewnow-demo-videos';
export function demoVideos(): Video[] {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]') as Video[]; } catch { return []; }
}
export function saveDemoVideos(items: Video[]) { localStorage.setItem(KEY, JSON.stringify(items)); }
export async function apiPost(path:string, body:Record<string,unknown>) {
  const token = (await supabase?.auth.getSession())?.data.session?.access_token;
  const res = await fetch(path, { method:'POST', headers:{ 'Content-Type':'application/json', ...(token ? { Authorization:'Bearer ' + token } : {}) }, body:JSON.stringify(body) });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Não foi possível concluir a operação.');
  return data;
}
