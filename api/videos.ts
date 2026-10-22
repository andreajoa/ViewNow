import { authenticate, err } from './_lib/auth';
import { parseVideoUrl } from '../src/lib/video';
const validInt = (n:unknown, min:number, max:number) =>
  typeof n === 'number' && Number.isSafeInteger(n) && n >= min && n <= max;
export async function GET(request:Request) {
  try {
    const {user, adminClient}=await authenticate(request);
    const {data,error}=await adminClient.from('videos').select('id,title,url,platform,embed_url,current_views,target_views,created_at,updated_at')
      .eq('user_id',user.id).order('created_at',{ascending:false}).limit(501);
    if(error)throw error;
    return Response.json({data});
  } catch(e) {return err(e);}
}
export async function POST(request:Request) {
  try {
    const {user,adminClient}=await authenticate(request);
    const body=await request.json();
    const info=typeof body.url==='string'?parseVideoUrl(body.url):null;
    if(!info)throw new Error('URL de vídeo inválida.');
    if(typeof body.title!=='string'||!body.title.trim()||body.title.length>160)throw new Error('Título inválido.');
    if(!validInt(body.current_views,0,1e12)||!validInt(body.target_views,1,1e12))throw new Error('Números inválidos.');
    // Enforce paid video limits here as well, because server-side service keys bypass RLS and triggers still run.
    const {data,error}=await adminClient.from('videos').insert({
      user_id:user.id,title:body.title.trim(),url:info.url,platform:info.platform,embed_url:info.embedUrl,
      current_views:body.current_views,target_views:body.target_views
    }).select('id,title,url,platform,current_views,target_views,created_at').single();
    if(error)throw error;
    return Response.json({data},{status:201});
  }catch(e){return err(e);}
}
