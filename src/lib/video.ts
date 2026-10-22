export type Platform = 'youtube' | 'instagram' | 'tiktok' | 'facebook';
export type VideoInfo = { platform: Platform; url: string; embedUrl: string | null; id: string | null };
export function parseVideoUrl(input: string): VideoInfo | null {
  try {
    const u = new URL(input.trim());
    if (u.protocol !== 'https:' && u.protocol !== 'http:') return null;
    const host = u.hostname.toLowerCase().replace(/^www\./, '').replace(/^m\./, '');
    const parts = u.pathname.split('/').filter(Boolean);
    if (['youtube.com', 'youtu.be', 'youtube-nocookie.com'].includes(host)) {
      const id = host === 'youtu.be' ? parts[0] : parts[0] === 'shorts' || parts[0] === 'live' || parts[0] === 'embed' ? parts[1] : u.searchParams.get('v');
      if (!id || !/^[\w-]{11}$/.test(id)) return null;
      return { platform: 'youtube', url: 'https://www.youtube.com/watch?v=' + encodeURIComponent(id), embedUrl: 'https://www.youtube-nocookie.com/embed/' + encodeURIComponent(id), id };
    }
    if (host === 'instagram.com' || host === 'instagr.am') {
      if (!['reel', 'p', 'tv'].includes(parts[0]) || !/^[A-Za-z0-9_-]+$/.test(parts[1] || '')) return null;
      return { platform: 'instagram', url: 'https://www.instagram.com/' + parts[0] + '/' + parts[1] + '/', embedUrl: 'https://www.instagram.com/' + parts[0] + '/' + parts[1] + '/embed/', id: parts[1] };
    }
    if (host === 'tiktok.com' || host === 'vm.tiktok.com' || host === 'vt.tiktok.com') {
      const id = parts.includes('video') ? parts[parts.indexOf('video') + 1] : null;
      if (!id || !/^\d{10,24}$/.test(id)) return null;
      return { platform: 'tiktok', url: 'https://www.tiktok.com/@' + (parts[0] || '').replace(/^@/, '@') + '/video/' + id, embedUrl: 'https://www.tiktok.com/embed/v2/' + id, id };
    }
    if (['facebook.com', 'fb.watch', 'fb.com'].includes(host)) {
      if (host === 'fb.watch' && !parts[0]) return null;
      if (host !== 'fb.watch' && !parts.length && !u.searchParams.get('v')) return null;
      const clean = u.origin + u.pathname + (u.searchParams.has('v') ? '?v=' + encodeURIComponent(u.searchParams.get('v') || '') : '');
      return { platform: 'facebook', url: clean, embedUrl: null, id: u.searchParams.get('v') };
    }
    return null;
  } catch { return null; }
}
export function formatCount(n: number) { return new Intl.NumberFormat('pt-BR').format(Math.max(0, n || 0)); }
export const PLATFORM_NAMES: Record<Platform, string> = { youtube:'YouTube', instagram:'Instagram', tiktok:'TikTok', facebook:'Facebook' };
