export async function GET() {
  return Response.json({
    product:'ViewNow',service:'online',
    features:['video-library','goals','shared-video-pages','outbound-click-analytics','subscriptions'],
    viewGeneration:false, publicViewCountModification:false,
    description:'Gestão e divulgação legítima de vídeos. Nenhuma visualização é criada pela API.'
  });
}
