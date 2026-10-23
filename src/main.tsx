import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import type { Session } from '@supabase/supabase-js';
import {
  ArrowRight, ArrowUpRight, BarChart3, CheckCircle2, ChevronRight, CircleHelp, Clapperboard,
  Copy, Crown, ExternalLink, Eye, Film, Instagram, LayoutDashboard, Link2, Loader2, LogOut, Menu,
  MousePointerClick, Play, Plus, Settings2, ShieldCheck, Sparkles, Target, Trash2, TrendingUp, Video as VideoIcon, Wallet,
  X, Youtube, Zap
} from 'lucide-react';
import { apiPost, configured, demoVideos, saveDemoVideos, supabase, type Profile, type Video } from './lib/backend';
import { formatCount, parseVideoUrl, PLATFORM_NAMES, type Platform } from './lib/video';
import './style.css';

type Tab = 'overview' | 'videos' | 'plans' | 'settings';
const PLAN_CAPS:Record<string,number> = {free:3,starter:20,growth:100,scale:500};
const PLANS = [
  {key:'starter',name:'Starter',price:'39',limit:'20 vídeos',description:'Para começar a organizar seus conteúdos.',items:['Links e metas por vídeo','Página para compartilhar','Relatórios de cliques']},
  {key:'growth',name:'Growth',price:'99',limit:'100 vídeos',description:'Para criadores em crescimento.',items:['Tudo do Starter','Mais vídeos e campanhas','Gestão centralizada']},
  {key:'scale',name:'Scale',price:'249',limit:'500 vídeos',description:'Para agências e múltiplas contas.',items:['Tudo do Growth','Capacidade ampliada','Organização de grandes bibliotecas']}
];
const channels:Platform[]=['instagram','youtube','tiktok','facebook'];
const fmtDate=(v:string)=>new Date(v).toLocaleDateString('pt-BR',{day:'2-digit',month:'short',year:'numeric'});
const roundPct=(a:number,b:number)=>Math.max(0,Math.min(100,Math.round((a/Math.max(1,b))*100)));
function PlatformMark({type,size=19}:{type:Platform;size?:number}) {
  if(type==='instagram') return <Instagram size={size}/>;
  if(type==='youtube') return <Youtube size={size}/>;
  if(type==='tiktok') return <span className="tiktok-icon" style={{fontSize:size-1}}>♪</span>;
  return <span className="fb-icon" style={{fontSize:size-4}}>f</span>;
}
function Brand({large=false}:{large?:boolean}) {return <span className={'brand '+(large?'brand-large':'')}><span className="brand-mark"><Play size={17} fill="currentColor"/></span><span>View<span className="accent">Now</span></span></span>;}
function IconBadge({platform}:{platform:Platform}) {return <span className={'platform-badge '+platform}><PlatformMark type={platform}/></span>;}
function Alert({value,onClose}:{value:string;onClose:()=>void}) {return value?<div className="toast"><CheckCircle2 size={18}/><span>{value}</span><button aria-label="Fechar" onClick={onClose}><X size={15}/></button></div>:null;}
function Modal({children,onClose,title}:{children:React.ReactNode;onClose:()=>void;title:string}) {
  useEffect(()=>{const fn=(e:KeyboardEvent)=>{if(e.key==='Escape')onClose();};document.addEventListener('keydown',fn);return()=>document.removeEventListener('keydown',fn);},[onClose]);
  return <div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)onClose();}}>
    <div className="modal" role="dialog" aria-modal="true" aria-label={title}>
      <div className="modal-top"><div><span className="eyebrow">VIEWNOW STUDIO</span><h2>{title}</h2></div><button className="icon-button" onClick={onClose} aria-label="Fechar"><X/></button></div>
      {children}
    </div>
  </div>;
}
function VideoPreview({video,compact=false}:{video:Pick<Video,'url'|'platform'|'embed_url'|'title'>;compact?:boolean}) {
  const canEmbed = Boolean(video.embed_url && ['youtube','tiktok','instagram'].includes(video.platform));
  return <div className={'video-frame '+(compact?'compact':'')}>
    {canEmbed
      ? <iframe src={video.embed_url||''} title={'Prévia: '+video.title} loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen/>
      : <div className="video-fallback"><span className="video-fallback-icon"><PlatformMark type={video.platform} size={34}/></span><strong>Prévia indisponível</strong><p>Esta plataforma pode exigir que o vídeo seja aberto no site original.</p><a className="btn btn-outline" href={video.url} target="_blank" rel="noopener noreferrer">Abrir vídeo <ExternalLink size={15}/></a></div>}
  </div>;
}
function Landing({onEnter}:{onEnter:()=>void}) {
  return <div className="landing">
    <header className="landing-header shell"><Brand/><nav><a href="#como-funciona">Como funciona</a><a href="#recursos">Recursos</a><a href="#precos">Preços</a></nav><button onClick={onEnter} className="btn btn-white btn-small">Acessar painel <ArrowRight size={16}/></button></header>
    <main>
      <section className="hero shell">
        <div className="halo halo-one"/><div className="halo halo-two"/>
        <div className="hero-content">
          <span className="announcement"><Sparkles size={14}/> SEU CONTEÚDO, SUA PRÓXIMA CONQUISTA <ChevronRight size={15}/></span>
          <h1>Seus vídeos merecem <span>ir mais longe.</span></h1>
          <p>Organize links, defina metas de visualizações reais e compartilhe seus conteúdos em um só lugar. Simples, visual e feito para criadores.</p>
          <div className="hero-buttons"><button className="btn btn-primary btn-large" onClick={onEnter}>Começar agora <ArrowRight size={19}/></button><a className="btn btn-outline btn-large" href="#como-funciona">Descobrir a ViewNow <Play size={17}/></a></div>
          <div className="hero-platforms"><span>PARA QUEM CRIA NO</span>{channels.map(c=><span key={c} title={PLATFORM_NAMES[c]} className="small-platform"><PlatformMark type={c}/></span>)}</div>
        </div>
        <div className="hero-preview">
          <div className="mock-window"><div className="mock-top"><div className="mock-dots"><i/><i/><i/></div><span>app.viewnow</span><ShieldCheck size={14}/></div>
            <div className="mock-sidebar"><Brand/><span className="mock-active"><LayoutDashboard size={15}/> Visão geral</span><span><VideoIcon size={15}/> Meus vídeos</span><span><Target size={15}/> Minhas metas</span><span><Wallet size={15}/> Planos</span></div>
            <div className="mock-body"><span className="mock-label">BEM-VINDO DE VOLTA</span><h3>Seu conteúdo, em movimento.</h3><div className="mock-stats"><div><span>Vídeos salvos</span><b>12</b><small><ArrowUpRight size={13}/> Organizados</small></div><div><span>Metas definidas</span><b>8</b><small><Target size={13}/> Acompanhe tudo</small></div></div><div className="mock-charts"><div><span className="mock-line"/><span className="mock-line short"/><span className="mock-progress"><i/></span></div><div><span className="mock-line"/><span className="mock-line short"/><span className="mock-progress lavender"><i/></span></div></div><div className="mock-caption">Exemplo ilustrativo do painel</div></div>
          </div>
          <span className="float-pill top"><Zap size={15}/> Um link. Um objetivo.</span><span className="float-pill bottom"><CheckCircle2 size={17}/> Tudo organizado!</span>
        </div>
      </section>
      <section className="how-section" id="como-funciona"><div className="shell">
        <div className="section-head"><span className="eyebrow">FÁCIL DE COMEÇAR</span><h2>Três passos para organizar <br/>sua presença digital.</h2><p>Menos planilhas, mais clareza sobre seus conteúdos.</p></div>
        <div className="steps-grid">
          <div className="step-card"><span className="step-number">01</span><span className="feature-icon"><Link2/></span><h3>Cole seu link</h3><p>Adicione vídeos do Instagram, TikTok, Facebook ou YouTube.</p></div>
          <div className="step-card"><span className="step-number">02</span><span className="feature-icon"><Target/></span><h3>Defina uma meta</h3><p>Estabeleça uma meta de audiência e registre os números públicos.</p></div>
          <div className="step-card"><span className="step-number">03</span><span className="feature-icon"><TrendingUp/></span><h3>Compartilhe e acompanhe</h3><p>Divulgue para pessoas reais e monitore a evolução dos seus vídeos.</p></div>
        </div>
      </div></section>
      <section className="features-section shell" id="recursos"><div className="features-copy"><span className="eyebrow">UM ESPAÇO PARA CADA IDEIA</span><h2>Tudo o que você publica, <span>num só painel.</span></h2><p>Economize tempo acompanhando seu conteúdo em um espaço pensado para criadores, social medias e agências.</p><div className="feature-list"><div><CheckCircle2/> Links de quatro plataformas</div><div><CheckCircle2/> Metas personalizadas por vídeo</div><div><CheckCircle2/> Links de divulgação compartilháveis</div><div><CheckCircle2/> Dados identificados por origem</div></div><button className="btn btn-primary" onClick={onEnter}>Abrir meu painel <ArrowRight size={17}/></button></div><div className="feature-art"><div className="art-glow"/><div className="art-card art-card-a"><IconBadge platform="instagram"/><span><strong>Seu novo Reel</strong><small>Meta definida</small></span><Target size={18}/></div><div className="art-card art-card-b"><IconBadge platform="youtube"/><span><strong>Vídeo da semana</strong><small>Link pronto para divulgar</small></span><ExternalLink size={18}/></div><div className="art-center"><BarChart3 size={40}/><strong>Crescimento com clareza</strong><span>Uma visão de todos os conteúdos</span></div></div></section>
      <section className="pricing-section" id="precos"><div className="shell"><div className="section-head"><span className="eyebrow">PLANOS QUE CRESCEM COM VOCÊ</span><h2>O próximo passo começa aqui.</h2><p>Preços sugeridos para configuração posterior na Stripe. Nenhum pagamento é processado na demonstração.</p></div><div className="price-grid">{PLANS.map((p,i)=><div key={p.key} className={'price-card '+(i===1?'featured':'')}>{i===1&&<span className="popular">MAIS ESCOLHIDO</span>}<h3>{p.name}</h3><p>{p.description}</p><div className="price"><small>R$</small>{p.price}<span>/mês</span></div><strong className="plan-limit">{p.limit} para acompanhar</strong><button onClick={onEnter} className={'btn '+(i===1?'btn-primary':'btn-outline')}>Conhecer o plano <ArrowRight size={16}/></button><ul>{p.items.map(t=><li key={t}><CheckCircle2 size={17}/>{t}</li>)}</ul></div>)}</div><p className="legal-note">A ViewNow não gera visualizações artificiais nem altera os contadores públicos das redes sociais.</p></div></section>
    </main><footer className="shell landing-footer"><Brand/><span>© {new Date().getFullYear()} ViewNow · Conteúdo com propósito.</span><span>Feito para a evolução real do seu conteúdo.</span></footer>
  </div>;
}
function Auth({onDemo}:{onDemo:()=>void}) {
  const [mode,setMode]=useState<'login'|'signup'>('login');
  const [email,setEmail]=useState('');const [password,setPassword]=useState('');const [busy,setBusy]=useState(false);const [message,setMessage]=useState('');
  const submit=async(e:React.FormEvent)=>{e.preventDefault();setMessage('');
    if(!supabase){setMessage('Configure as variáveis do Supabase para entrar com sua conta.');return;}
    setBusy(true);
    try{
      const result=mode==='signup' ? await supabase.auth.signUp({email,password}) : await supabase.auth.signInWithPassword({email,password});
      if(result.error)throw result.error;
      if(mode==='signup'&&!result.data.session)setMessage('Cadastro realizado. Confirme seu e-mail para acessar o painel.');
    }catch(e){setMessage(e instanceof Error?e.message:'Não foi possível entrar.');}finally{setBusy(false);}
  };
  return <div className="auth-page"><div className="auth-back"><button onClick={()=>location.assign('/')}><ArrowRight size={16} className="flip"/> Voltar ao início</button></div><div className="auth-box"><Brand large/><div className="auth-heading"><span className="eyebrow">SUA ÁREA CRIATIVA</span><h1>{mode==='login'?'Bom ter você aqui.':'Crie seu espaço.'}</h1><p>{mode==='login'?'Entre para acompanhar seus vídeos.':'Seu próximo capítulo começa com um cadastro.'}</p></div>
    {configured?<form onSubmit={submit} className="auth-form"><label>E-mail<input required type="email" autoComplete="email" placeholder="seu@email.com" value={email} onChange={e=>setEmail(e.target.value)}/></label><label>Senha<input required minLength={6} type="password" autoComplete={mode==='login'?'current-password':'new-password'} placeholder="Mínimo de 6 caracteres" value={password} onChange={e=>setPassword(e.target.value)}/></label>{message&&<div className="form-note">{message}</div>}<button disabled={busy} className="btn btn-primary btn-large" type="submit">{busy?<Loader2 className="spin" size={18}/>:<ArrowRight size={18}/>} {mode==='login'?'Entrar na conta':'Criar minha conta'}</button></form>:<div className="form-note">O banco de dados ainda não foi conectado. Explore a demonstração abaixo ou configure o Supabase.</div>}
    {configured&&<p className="switch-mode">{mode==='login'?'Ainda não tem conta?':'Já tem uma conta?'} <button onClick={()=>{setMode(mode==='login'?'signup':'login');setMessage('');}}>{mode==='login'?'Cadastre-se':'Entrar'}</button></p>}
    <div className="or-line"><span>ou</span></div><button className="btn btn-outline demo-button" onClick={onDemo}><Sparkles size={18}/> Explorar demonstração</button><small className="auth-disclaimer">A demonstração salva apenas neste navegador e não sincroniza dados entre dispositivos.</small>
    </div><div className="auth-side"><span className="auth-orbit"><Play size={65} fill="currentColor"/></span><h2>Transforme links em <span>possibilidades.</span></h2><p>Sua biblioteca de vídeos, metas e divulgação, conectada em um só lugar.</p></div></div>;
}
function WatchPage() {
  const id=new URLSearchParams(location.search).get('id')||'';
  const [video,setVideo]=useState<Video|null>(null);const [loading,setLoading]=useState(true);
  useEffect(()=>{let live=true;(async()=>{
    if(!id){setLoading(false);return;}
    if(supabase){const {data}=await supabase.from('videos').select('*').eq('id',id).eq('is_public',true).maybeSingle();if(live)setVideo(data);}
    else if(live)setVideo(demoVideos().find(v=>v.id===id)||null);
    if(live)setLoading(false);
  })();return()=>{live=false};},[id]);
  const open=async()=>{if(!video)return;
    if(supabase){
      // Tracks outbound clicks inside ViewNow only. Never counts as a platform view.
      const k='viewnow-click-'+video.id;
      try{if(sessionStorage.getItem(k)!=='1'){await supabase.from('video_clicks').insert({video_id:video.id});sessionStorage.setItem(k,'1');}}catch{ /* external link should always work */ }
    }
    window.open(video.url,'_blank','noopener,noreferrer');
  };
  return <div className="watch-page"><header className="shell watch-header"><a href="/"><Brand/></a><a href="/" className="watch-home">Conheça a ViewNow <ArrowUpRight size={16}/></a></header><main className="watch-main shell"><span className="eyebrow">CONTEÚDO COMPARTILHADO</span>{loading?<div className="watch-loading"><Loader2 className="spin"/> Carregando vídeo…</div>:video?<><h1>{video.title}</h1><div className="watch-platform"><IconBadge platform={video.platform}/> Veja este conteúdo no {PLATFORM_NAMES[video.platform]}</div><VideoPreview video={video}/><button onClick={open} className="btn btn-primary btn-large">Assistir no {PLATFORM_NAMES[video.platform]} <ExternalLink size={17}/></button><p className="watch-disclaimer">O acesso a esta página e os cliques no link não equivalem a visualizações contabilizadas pela plataforma.</p></>:<div className="empty-state"><Film size={48}/><h2>Vídeo não encontrado</h2><p>O link pode estar incorreto, privado ou indisponível.</p><a href="/" className="btn btn-primary">Voltar para o início</a></div>}</main></div>;
}
function Studio({session,demo,onLogout}:{session:Session|null;demo:boolean;onLogout:()=>void}) {
  const [tab,setTab]=useState<Tab>('overview');
  const [videos,setVideos]=useState<Video[]>([]);
  const [profile,setProfile]=useState<Profile|null>(null);
  const [clicks,setClicks]=useState<Record<string,number>>({});
  const [loading,setLoading]=useState(false);
  const [notice,setNotice]=useState('');
  const [modal,setModal]=useState<'add'|'edit'|null>(null);
  const [editing,setEditing]=useState<Video|null>(null);
  const [link,setLink]=useState('');const [title,setTitle]=useState('');
  const [views,setViews]=useState('0');const [target,setTarget]=useState('10000');
  const [busy,setBusy]=useState(false);
  const [mobileMenu,setMobileMenu]=useState(false);
  const [filter,setFilter]=useState<'all'|Platform>('all');
  const isAdmin=demo || Boolean(profile?.is_admin);
  const currentPlan=demo?'admin':profile?.plan||'free';
  const cap=isAdmin?Infinity:PLAN_CAPS[currentPlan]||3;
  const remaining=isAdmin?Infinity:Math.max(0,cap-videos.length);
  const totalViews=videos.reduce((sum,v)=>sum+Number(v.current_views||0),0);
  const totalTargets=videos.reduce((sum,v)=>sum+Number(v.target_views||0),0);
  const totalClicks=Object.values(clicks).reduce((a,b)=>a+b,0);
  const refresh=useCallback(async()=>{
    if(demo){setVideos(demoVideos());setProfile({id:'demo',plan:'scale',is_admin:true,stripe_customer_id:null});return;}
    if(!session || !supabase)return;
    setLoading(true);
    try{
      // Server checks the email against ADMIN_EMAIL and grants admin privileges only after token verification.
      try{await apiPost('/api/admin',{});}catch{ /* standard subscribers are not administrators */ }
      const [profileRes,videoRes]=await Promise.all([
        supabase.from('profiles').select('*').eq('id',session.user.id).single(),
        supabase.from('videos').select('*').eq('user_id',session.user.id).order('created_at',{ascending:false})
      ]);
      if(profileRes.error)throw profileRes.error;
      if(videoRes.error)throw videoRes.error;
      setProfile(profileRes.data as Profile);
      setVideos((videoRes.data||[]) as Video[]);
      if(videoRes.data?.length){
        const ids=videoRes.data.map(v=>v.id);
        const {data:events}=await supabase.from('video_clicks').select('video_id').in('video_id',ids);
        const values:Record<string,number>={};
        (events||[]).forEach((e:{video_id:string})=>{values[e.video_id]=(values[e.video_id]||0)+1;});
        setClicks(values);
      } else setClicks({});
    }catch(e){setNotice(e instanceof Error?e.message:'Falha ao atualizar dados.');}
    finally{setLoading(false);}
  },[demo,session]);
  useEffect(()=>{void refresh();},[refresh]);
  useEffect(()=>{if(new URLSearchParams(location.search).get('billing')==='success'){setNotice('Retorno da Stripe recebido. O plano será atualizado após confirmação pelo webhook.');history.replaceState({},'', '/app');}},[]);
  const openAdd=()=>{setLink('');setTitle('');setViews('0');setTarget('10000');setEditing(null);setModal('add');};
  const openEdit=(v:Video)=>{setEditing(v);setLink(v.url);setTitle(v.title);setViews(String(v.current_views));setTarget(String(v.target_views));setModal('edit');};
  const commit=async(e:React.FormEvent)=>{e.preventDefault();
    const parsed=parseVideoUrl(link);
    if(!parsed){setNotice('Use um link público válido do Instagram, Facebook, TikTok ou YouTube.');return;}
    const current=Number(views),goal=Number(target);
    if(!Number.isSafeInteger(current)||current<0||!Number.isSafeInteger(goal)||goal<1||current>1e12||goal>1e12){setNotice('Informe números válidos para as visualizações e a meta.');return;}
    if(!title.trim()||title.trim().length>160){setNotice('Informe um título com até 160 caracteres.');return;}
    if(modal==='add'&&remaining<=0){setNotice('Você atingiu o limite de vídeos deste plano.');setTab('plans');setModal(null);return;}
    setBusy(true);
    try{
      const payload={title:title.trim(),url:parsed.url,platform:parsed.platform,embed_url:parsed.embedUrl,current_views:current,target_views:goal};
      if(demo){
        const saved=demoVideos();
        const updated=modal==='edit'&&editing?saved.map(v=>v.id===editing.id?{...v,...payload,updated_at:new Date().toISOString()}:v):
          [{id:crypto.randomUUID(),user_id:'demo',created_at:new Date().toISOString(),...payload},...saved];
        saveDemoVideos(updated);setVideos(updated);
      }else{
        if(!supabase||!session)throw new Error('Entre em sua conta para salvar.');
        if(modal==='edit'&&editing){
          const {error}=await supabase.from('videos').update(payload).eq('id',editing.id).eq('user_id',session.user.id);
          if(error)throw error;
        } else {
          const {error}=await supabase.from('videos').insert({...payload,user_id:session.user.id});
          if(error)throw error;
        }
        await refresh();
      }
      setModal(null);setNotice(modal==='edit'?'Vídeo atualizado com sucesso.':'Vídeo adicionado à biblioteca.');
    }catch(e){setNotice(e instanceof Error?e.message:'Erro ao salvar vídeo.');}
    finally{setBusy(false);}
  };
  const remove=async(v:Video)=>{
    if(!confirm('Excluir "'+v.title+'"? Esta ação não poderá ser desfeita.'))return;
    try{if(demo){const next=demoVideos().filter(x=>x.id!==v.id);saveDemoVideos(next);setVideos(next);}
      else{const {error}=await supabase!.from('videos').delete().eq('id',v.id).eq('user_id',session!.user.id);if(error)throw error;await refresh();}
      setNotice('Vídeo removido.');
    }catch(e){setNotice(e instanceof Error?e.message:'Não foi possível excluir.');}
  };
  const copy=async(v:Video)=>{
    const publicUrl=location.origin+'/watch?id='+encodeURIComponent(v.id);
    try{await navigator.clipboard.writeText(publicUrl);setNotice(demo?'Link copiado. No modo demonstração, ele funciona apenas neste navegador.':'Link de divulgação copiado.');}
    catch{setNotice('Não foi possível copiar. Link: '+publicUrl);}
  };
  const subscribe=async(plan:string)=>{
    if(demo){setNotice('Pagamentos não são realizados no modo demonstração. Configure o Supabase e a Stripe.');return;}
    setBusy(true);
    try{const {url}=await apiPost('/api/checkout',{plan});if(url)location.assign(url);}
    catch(e){setNotice(e instanceof Error?e.message:'Falha ao iniciar assinatura.');}
    finally{setBusy(false);}
  };
  const manageBilling=async()=>{
    if(demo){setNotice('Esta função requer a sua conta conectada e uma assinatura.');return;}
    setBusy(true);try{const {url}=await apiPost('/api/portal',{});if(url)location.assign(url);}
    catch(e){setNotice(e instanceof Error?e.message:'Não foi possível abrir a área de cobrança.');}finally{setBusy(false);}
  };
  const choose=(next:Tab)=>{setTab(next);setMobileMenu(false);};
  const filtered=useMemo(()=>filter==='all'?videos:videos.filter(v=>v.platform===filter),[videos,filter]);
  const row=(v:Video)=> <div className="video-row" key={v.id}>
    <div className="video-title-cell"><IconBadge platform={v.platform}/><div><strong>{v.title}</strong><span>{PLATFORM_NAMES[v.platform]} · Adicionado em {fmtDate(v.created_at)}</span></div></div>
    <div className="video-metric"><strong>{formatCount(v.current_views)}</strong><span>Registradas manualmente</span></div>
    <div className="video-progress"><div><strong>{formatCount(v.target_views)}</strong><span>{roundPct(v.current_views,v.target_views)}%</span></div><div className="progress-track"><span style={{width:roundPct(v.current_views,v.target_views)+'%'}}/></div></div>
    <div className="video-actions"><button title="Compartilhar página" aria-label="Copiar link para compartilhar" onClick={()=>copy(v)}><Copy size={17}/></button><a title="Ver na plataforma" aria-label="Abrir vídeo original" href={v.url} target="_blank" rel="noopener noreferrer"><ExternalLink size={17}/></a><button title="Editar" aria-label="Editar vídeo" onClick={()=>openEdit(v)}><Settings2 size={17}/></button><button title="Excluir" aria-label="Excluir vídeo" onClick={()=>remove(v)}><Trash2 size={17}/></button></div>
  </div>;
  return <div className="studio">
    <aside className={'sidebar '+(mobileMenu?'sidebar-open':'')}>
      <a href="/" className="sidebar-brand"><Brand/></a>
      <div className="workspace-switch"><span className="workspace-avatar">VN</span><div><strong>Meu workspace</strong><small>{demo?'Demonstração':isAdmin?'Admin · Grátis':currentPlan.toUpperCase()}</small></div><ChevronRight size={17}/></div>
      <div className="nav-group"><span className="nav-label">MENU PRINCIPAL</span>
        {([['overview',LayoutDashboard,'Visão geral'],['videos',Clapperboard,'Meus vídeos'],['plans',Crown,'Planos e assinatura'],['settings',Settings2,'Configurações']] as const).map(([key,I,label])=><button key={key} className={'nav-item '+(tab===key?'active':'')} onClick={()=>choose(key)}><I size={19}/>{label}{key==='videos'&&<span className="nav-counter">{videos.length}</span>}</button>)}
      </div>
      <div className="sidebar-bottom"><div className="side-upgrade"><span className="side-up-icon"><Sparkles size={19}/></span><strong>Pronto para crescer?</strong><p>Gerencie tudo em um único painel, sem perder o foco.</p><button onClick={()=>choose('plans')}>Ver planos <ArrowRight size={15}/></button></div>
        <button className="sidebar-logout" onClick={onLogout}><LogOut size={18}/> {demo?'Sair da demonstração':'Sair da conta'}</button>
      </div>
    </aside>
    {mobileMenu&&<div className="mobile-overlay" onClick={()=>setMobileMenu(false)}/>}
    <div className="studio-main">
      <header className="studio-header"><button className="mobile-toggle icon-button" onClick={()=>setMobileMenu(true)}><Menu/></button><div className="breadcrumbs">Workspace <ChevronRight size={14}/> <strong>{tab==='overview'?'Visão geral':tab==='videos'?'Meus vídeos':tab==='plans'?'Planos e assinatura':'Configurações'}</strong></div><div className="header-right"><span className="header-live"><span/> {demo?'Modo demo':'Área segura'}</span><span className="user-initial">{(session?.user.email||'V').slice(0,1).toUpperCase()}</span></div></header>
      <div className="studio-content">
        {demo&&<div className="demo-banner"><Sparkles size={18}/><span><strong>Modo demonstração:</strong> dados salvos apenas neste navegador. Não há pagamentos, reprodução automatizada ou integração com os contadores das redes.</span></div>}
        {tab==='overview'&&<><div className="page-head"><div><span className="eyebrow">PAINEL DE CONTROLE</span><h1>Seu conteúdo em um só lugar<span className="dot">.</span></h1><p>Bem-vindo à sua central para organizar vídeos e acompanhar metas.</p></div><button className="btn btn-primary" onClick={openAdd}><Plus size={19}/> Adicionar vídeo</button></div>
          <div className="stats-grid"><div className="stat-card"><div className="stat-head"><span>Vídeos na biblioteca</span><span className="stat-icon lilac"><Clapperboard size={20}/></span></div><strong>{formatCount(videos.length)}</strong><small>{isAdmin?'Capacidade ilimitada':formatCount(remaining)+' espaços disponíveis'}</small></div><div className="stat-card"><div className="stat-head"><span>Visualizações informadas</span><span className="stat-icon blue"><Eye size={20}/></span></div><strong>{formatCount(totalViews)}</strong><small>Dados inseridos por você, não verificados</small></div><div className="stat-card"><div className="stat-head"><span>Metas somadas</span><span className="stat-icon peach"><Target size={20}/></span></div><strong>{formatCount(totalTargets)}</strong><small>Objetivos dos vídeos cadastrados</small></div><div className="stat-card"><div className="stat-head"><span>Cliques em links</span><span className="stat-icon mint"><MousePointerClick size={20}/></span></div><strong>{demo?'—':formatCount(totalClicks)}</strong><small>Cliques registrados pela ViewNow</small></div></div>
          <div className="dashboard-grid"><div className="panel panel-main"><div className="panel-heading"><div><h2>Seus vídeos recentes</h2><p>Gerencie os conteúdos adicionados.</p></div><button className="subtle-link" onClick={()=>choose('videos')}>Ver todos <ArrowRight size={16}/></button></div>{videos.length?<div className="recent-list">{videos.slice(0,5).map(v=><div key={v.id} className="recent-item"><IconBadge platform={v.platform}/><div className="recent-title"><strong>{v.title}</strong><span>{PLATFORM_NAMES[v.platform]} · {fmtDate(v.created_at)}</span></div><div className="recent-value"><strong>{formatCount(v.current_views)}</strong><span>Informadas</span></div><button onClick={()=>openEdit(v)} aria-label="Editar"><ArrowUpRight size={18}/></button></div>)}</div>:<div className="empty-state small"><span className="empty-icon"><Film size={27}/></span><h3>Seus vídeos começam aqui</h3><p>Adicione seu primeiro link e tenha tudo organizado.</p><button className="btn btn-primary" onClick={openAdd}><Plus size={17}/> Adicionar primeiro vídeo</button></div>}</div>
            <div className="panel panel-guide"><span className="guide-stars"><Sparkles size={23}/></span><span className="eyebrow">DICA DA VIEWNOW</span><h2>Uma meta clara é o primeiro passo.</h2><p>Escolha seu conteúdo, acompanhe o alcance público e compartilhe com sua audiência para conquistar visualizações reais.</p><div className="guide-platforms">{channels.map(c=><span key={c}><PlatformMark type={c}/></span>)}</div><button onClick={openAdd}>Cadastrar um novo vídeo <ArrowRight size={17}/></button></div></div>
          <div className="info-strip"><CircleHelp size={18}/><span>As visualizações públicas não são alteradas pela ViewNow. Os números deste painel são informados por você; os cliques são eventos internos de divulgação.</span></div>
        </>}
        {tab==='videos'&&<><div className="page-head"><div><span className="eyebrow">BIBLIOTECA DE CONTEÚDO</span><h1>Meus vídeos<span className="dot">.</span></h1><p>Organize vídeos, defina metas e crie links para compartilhar.</p></div><button className="btn btn-primary" onClick={openAdd}><Plus size={19}/> Novo vídeo</button></div>
          <div className="panel video-panel"><div className="video-toolbar"><div><h2>Biblioteca <span>{videos.length}</span></h2><p>{isAdmin?'Acesso administrativo sem limite de vídeos.':videos.length+' de '+cap+' vídeos do plano '+currentPlan+'.'}</p></div><div className="filter-tabs"><button className={filter==='all'?'selected':''} onClick={()=>setFilter('all')}>Todos</button>{channels.map(c=><button key={c} title={PLATFORM_NAMES[c]} className={filter===c?'selected':''} onClick={()=>setFilter(c)}><PlatformMark type={c} size={17}/></button>)}</div></div>{filtered.length?<div className="video-list">{filtered.map(row)}</div>:<div className="empty-state"><span className="empty-icon"><Clapperboard size={29}/></span><h3>{videos.length?'Nenhum vídeo nesse filtro':'Sua biblioteca está vazia'}</h3><p>Adicione um link público para começar a organizar seus conteúdos.</p><button onClick={openAdd} className="btn btn-primary"><Plus size={17}/> Adicionar vídeo</button></div>}</div>
          <div className="info-strip"><CircleHelp size={18}/> A coluna "visualizações informadas" não é sincronizada automaticamente com as plataformas. Edite-a ao consultar os dados reais do seu vídeo.</div>
        </>}
        {tab==='plans'&&<><div className="page-head"><div><span className="eyebrow">ASSINATURA E ACESSO</span><h1>Um plano para cada fase<span className="dot">.</span></h1><p>Organize mais vídeos à medida que o seu projeto cresce.</p></div><div className="current-plan"><Crown size={17}/> {isAdmin?'Administrador · Grátis · Ilimitado':'Plano '+currentPlan.toUpperCase()}</div></div><div className="studio-pricing">{PLANS.map((p,i)=><div key={p.key} className={'price-card '+(i===1?'featured':'')}><div className="price-tag">{i===1?'MAIS POPULAR':'PARA CRIADORES'}</div><h3>{p.name}</h3><p>{p.description}</p><div className="price"><small>R$</small>{p.price}<span>/mês*</span></div><strong className="plan-limit">{p.limit}</strong><button className={'btn '+(i===1?'btn-primary':'btn-outline')} disabled={busy||isAdmin||currentPlan===p.key} onClick={()=>subscribe(p.key)}>{isAdmin?'Acesso de administrador':currentPlan===p.key?'Seu plano atual':'Assinar '+p.name} <ArrowRight size={17}/></button><ul>{p.items.map(t=><li key={t}><CheckCircle2 size={17}/>{t}</li>)}</ul></div>)}</div><div className="billing-box"><Wallet size={22}/><div><h3>Gerenciar assinatura</h3><p>Acompanhe faturas, atualize o cartão ou cancele pelo portal seguro da Stripe.</p></div><button className="btn btn-outline" disabled={busy||demo||!profile?.stripe_customer_id} onClick={manageBilling}>Abrir portal <ExternalLink size={17}/></button></div><p className="legal-note">*Valores indicativos. Para cobrar esses valores, crie preços recorrentes correspondentes na Stripe e configure os IDs nas variáveis de ambiente.</p></>}
        {tab==='settings'&&<><div className="page-head"><div><span className="eyebrow">SUA CONTA</span><h1>Configurações<span className="dot">.</span></h1><p>Detalhes do seu espaço de trabalho.</p></div></div><div className="settings-grid"><div className="panel settings-panel"><div className="settings-avatar">{(session?.user.email||'VN').slice(0,1).toUpperCase()}</div><h2>{demo?'Conta de demonstração':session?.user.email}</h2><p>Perfil {isAdmin?'administrativo':'de criador'} na ViewNow</p><div className="settings-item"><span>Plano ativo</span><strong>{isAdmin?'Admin · Grátis · Ilimitado':currentPlan}</strong></div><div className="settings-item"><span>Vídeos cadastrados</span><strong>{videos.length} {isAdmin?'(sem limite)':'/ '+cap}</strong></div><div className="settings-item"><span>Armazenamento</span><strong>{demo?'Navegador':'Supabase (acesso privado)'}</strong></div><button className="btn btn-outline" onClick={onLogout}><LogOut size={17}/> Sair da conta</button></div><div className="panel settings-panel"><h2>Transparência das métricas</h2><p>Entenda o que o painel mostra.</p><div className="settings-info"><Eye size={20}/><div><strong>Visualizações registradas</strong><p>Você informa manualmente o número exibido na rede social.</p></div></div><div className="settings-info"><MousePointerClick size={20}/><div><strong>Cliques de divulgação</strong><p>Eventos de clique no botão "Assistir" da página compartilhada, quando conectado ao Supabase.</p></div></div><div className="settings-info"><ShieldCheck size={20}/><div><strong>Sem manipulação de métricas</strong><p>A ferramenta não gera visualizações falsas e não modifica números públicos.</p></div></div></div></div></>}
      </div><footer className="studio-footer">ViewNow © {new Date().getFullYear()} <span>Seus conteúdos. Suas metas. Seus resultados.</span></footer>
    </div>
    {modal&&<Modal onClose={()=>setModal(null)} title={modal==='add'?'Adicionar novo vídeo':'Editar vídeo'}><form className="edit-form" onSubmit={commit}><label>Link do vídeo <span className="required">*</span><div className="input-with-icon"><Link2 size={17}/><input autoFocus required type="url" value={link} onChange={e=>setLink(e.target.value)} placeholder="https://www.instagram.com/reel/..." /></div></label><p className="field-hint"><span><Instagram size={15}/></span><span><Youtube size={16}/></span><span>♪</span><span>f</span> Instagram, YouTube, TikTok ou Facebook. Links públicos.</p><label>Nome para identificar <span className="required">*</span><input required maxLength={160} value={title} onChange={e=>setTitle(e.target.value)} placeholder="Ex.: Meu Reels de lançamento"/></label><div className="form-columns"><label>Visualizações atuais (manual)<input type="number" min="0" max="1000000000000" step="1" required value={views} onChange={e=>setViews(e.target.value)}/></label><label>Meta de visualizações<input type="number" min="1" max="1000000000000" step="1" required value={target} onChange={e=>setTarget(e.target.value)}/></label></div><div className="form-caution"><CircleHelp size={18}/><p>A ViewNow registra seus objetivos. Não adiciona visualizações aos vídeos nem altera os contadores públicos.</p></div><div className="form-buttons"><button type="button" className="btn btn-outline" onClick={()=>setModal(null)}>Cancelar</button><button className="btn btn-primary" disabled={busy} type="submit">{busy?<Loader2 className="spin" size={17}/>:<CheckCircle2 size={17}/>} {modal==='edit'?'Salvar alterações':'Cadastrar vídeo'}</button></div></form></Modal>}
    <Alert value={notice} onClose={()=>setNotice('')}/>
    {loading&&<span className="loading-pill"><Loader2 size={15} className="spin"/> Atualizando</span>}
  </div>;
}
function Root() {
  const [session,setSession]=useState<Session|null>(null);
  const [ready,setReady]=useState(!configured);
  const [demo,setDemo]=useState(false);
  const [entered,setEntered]=useState(location.pathname==='/app');
  useEffect(()=>{if(!supabase)return;let alive=true;supabase.auth.getSession().then(({data})=>{if(alive){setSession(data.session);setReady(true);}});
    const {data:{subscription}}=supabase.auth.onAuthStateChange((_event,next)=>{setSession(next);setReady(true);});
    return()=>{alive=false;subscription.unsubscribe();};
  },[]);
  const logout=async()=>{if(!demo)await supabase?.auth.signOut();setDemo(false);setEntered(false);history.pushState({},'', '/');};
  if(location.pathname==='/watch')return <WatchPage/>;
  if(!ready)return <div className="app-loader"><Brand large/><Loader2 className="spin"/></div>;
  if((session||demo)&&entered)return <Studio session={session} demo={demo} onLogout={logout}/>;
  if(entered)return <Auth onDemo={()=>setDemo(true)}/>;
  return <Landing onEnter={()=>{setEntered(true);history.pushState({},'', '/app');}}/>;
}
createRoot(document.getElementById('root')!).render(<React.StrictMode><Root/></React.StrictMode>);
