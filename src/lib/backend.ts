import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Platform } from './video';
export type Video = {
  id:string; user_id:string; title:string; url:string; platform:Platform; embed_url:string|null;
  current_views:number; target_views:number; updated_at?:string; created_at:string;
};
export type Profile = { id:string; plan:string; is_admin:boolean; stripe_customer_id:string|null };
export const configured = Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);
export const supabase: SupabaseClient | null = configured
  ? createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY)
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
