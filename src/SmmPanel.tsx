import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import {
  ArrowRight, BadgeCheck, Clock3, ClipboardList, ExternalLink, HelpCircle,
  Megaphone, Search, ShieldCheck, SlidersHorizontal, Wallet
} from 'lucide-react';
import { supabase } from './lib/backend';
import { parseVideoUrl, PLATFORM_NAMES, type Platform } from './lib/video';
import './smm.css';

export type CampaignTab = 'new-order' | 'orders' | 'services';
type Category = 'video_ads' | 'organic_distribution' | 'creative_review';
type Status = 'received' | 'reviewing' | 'awaiting_approval' | 'approved' | 'in_progress' | 'completed' | 'canceled';
type Service = { id: string; platform:Platform; category:Category; label:string; details:string; minBudget:number };
type Request = {
 id:string; user_id:string; platform:Platform; category:Category; service_key:string;
 video_url:string; target_views:number; proposed_budget_brl:number; notes:string;
 status:Status; admin_notes:string; created_at:string
};
const CATEGORIES:{id:Category;label:string}[] = [
 {id:'video_ads',label:'Campanhas de anúncios oficiais'},
 {id:'organic_distribution',label:'Distribuição orgânica'},
 {id:'creative_review',label:'Otimização e análise de vídeo'}
];
const SERVICES:Service[] = [
 {id:'ig-reels-ads',platform:'instagram',category:'video_ads',label:'Instagram | Anúncios para Reels (Meta Ads)',details:'Campanha de divulgação para espectadores reais, pelo Gerenciador de Anúncios da Meta.',minBudget:50},
 {id:'ig-story-ads',platform:'instagram',category:'video_ads',label:'Instagram | Anúncios para Stories (Meta Ads)',details:'Campanha com segmentação de audiência por público e orçamento.',minBudget:50},
 {id:'ig-organic',platform:'instagram',category:'organic_distribution',label:'Instagram | Plano de divulgação orgânica',details:'Estratégia de publicações, cortes, colaborações e distribuição editorial.',minBudget:0},
 {id:'ig-creative',platform:'instagram',category:'creative_review',label:'Instagram | Auditoria de Reels',details:'Avaliação de gancho, retenção, legendas e chamada para ação.',minBudget:0},
 {id:'fb-video-ads',platform:'facebook',category:'video_ads',label:'Facebook | Divulgação de vídeo (Meta Ads)',details:'Campanha oficial de anúncios, com métricas do Gerenciador da Meta.',minBudget:50},
 {id:'fb-organic',platform:'facebook',category:'organic_distribution',label:'Facebook | Plano de divulgação orgânica',details:'Estratégia de página, grupos pertinentes e calendário editorial.',minBudget:0},
 {id:'fb-creative',platform:'facebook',category:'creative_review',label:'Facebook | Revisão de conteúdo',details:'Melhorias para a apresentação e qualidade do vídeo.',minBudget:0},
 {id:'yt-ads',platform:'youtube',category:'video_ads',label:'YouTube | Anúncios em vídeo (Google Ads)',details:'Planejamento de campanhas oficiais para audiência real no YouTube.',minBudget:50},
 {id:'yt-shorts',platform:'youtube',category:'video_ads',label:'YouTube | Campanha de Shorts',details:'Planejamento de divulgação de Shorts com ferramentas de anúncios autorizadas.',minBudget:50},
 {id:'yt-organic',platform:'youtube',category:'organic_distribution',label:'YouTube | Estratégia de distribuição',details:'Títulos, miniaturas, listas, SEO e distribuição do canal.',minBudget:0},
 {id:'yt-creative',platform:'youtube',category:'creative_review',label:'YouTube | Auditoria de retenção',details:'Análise dos primeiros segundos, ritmo, estrutura e posicionamento.',minBudget:0},
 {id:'tt-ads',platform:'tiktok',category:'video_ads',label:'TikTok | Campanha TikTok Ads',details:'Planejamento de campanha usando o TikTok Ads Manager.',minBudget:50},
 {id:'tt-organic',platform:'tiktok',category:'organic_distribution',label:'TikTok | Estratégia orgânica',details:'Otimização de narrativa, formato, frequência e público.',minBudget:0},
 {id:'tt-creative',platform:'tiktok',category:'creative_review',label:'TikTok | Auditoria de vídeo',details:'Avaliação de retenção, hook, movimento e subtítulos.',minBudget:0}
];
const statusLabel:Record<Status,string> = {
 received:'Recebido',reviewing:'Em análise',awaiting_approval:'Aguardando aprovação',approved:'Aprovado',
 in_progress:'Em execução',completed:'Concluído',canceled:'Cancelado'
};
const platformList:Platform[] = ['instagram','facebook','youtube','tiktok'];
const money=(n:number)=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(n);
const demoKey='viewnow-demo-campaign-requests';
function readDemo():Request[]{ try{return JSON.parse(localStorage.getItem(demoKey)||'[]');}catch{return [];} }
function PlatformIcon({name}:{name:Platform}) {
 return <span className={'smm-p-icon '+name}>{name==='instagram'?'◎':name==='facebook'?'f':name==='youtube'?'▶':'♪'}</span>;
}
type Props={page:CampaignTab;session:Session|null;demo:boolean;isAdmin:boolean;notify:(msg:string)=>void};
export function SmmPanel({page,session,demo,isAdmin,notify}:Props) {
 const [platform,setPlatform]=useState<Platform>('instagram');
 const [category,setCategory]=useState<Category>('video_ads');
 const [serviceId,setServiceId]=useState('ig-reels-ads');
 const [link,setLink]=useState('');
 const [goal,setGoal]=useState('10000');
 const [budget,setBudget]=useState('100');
 const [notes,setNotes]=useState('');
 const [search,setSearch]=useState('');
 const [requests,setRequests]=useState<Request[]>([]);
 const [busy,setBusy]=useState(false);
 const [refreshing,setRefreshing]=useState(false);
 const selection=useMemo(()=>SERVICES.filter(s=>s.platform===platform&&s.category===category),[platform,category]);
 const selected=SERVICES.find(x=>x.id===serviceId)||selection[0];
 const requestCount=requests.length;

 const reload=useCallback(async()=>{
  if(demo){setRequests(readDemo());return;}
  if(!supabase||!session)return;
  setRefreshing(true);
  const {data,error}=await supabase.from('campaign_requests').select('*')
    .order('created_at',{ascending:false}).limit(250);
  if(error)notify('Não foi possível carregar as solicitações: '+error.message);
  else setRequests(data as Request[]||[]);
  setRefreshing(false);
 },[demo,session,notify]);
 useEffect(()=>{void reload();},[reload]);

 const changePlatform=(p:Platform)=>{
  setPlatform(p);
  const options=SERVICES.filter(x=>x.platform===p&&x.category===category);
  if(options.length)setServiceId(options[0].id);
  else{setCategory('video_ads');setServiceId(SERVICES.find(x=>x.platform===p&&x.category==='video_ads')!.id);}
 };
 const changeCategory=(c:Category)=>{setCategory(c);setServiceId(SERVICES.find(x=>x.platform===platform&&x.category===c)!.id);};

 const sendOrder=async(e:React.FormEvent)=>{
  e.preventDefault();
  if(!selected){notify('Selecione um serviço.');return;}
  const info=parseVideoUrl(link);
  if(!info||info.platform!==platform){notify('Use o link válido de um vídeo público da rede selecionada.');return;}
  const amount=Number(goal), cost=Number(budget);
  if(!Number.isSafeInteger(amount)||amount<100||amount>1000000000){notify('Informe uma meta válida entre 100 e 1 bilhão.');return;}
  if(!Number.isFinite(cost)||cost<selected.minBudget||cost>10000000){notify('Informe um orçamento de pelo menos '+money(selected.minBudget)+'.');return;}
  if(notes.length>1500){notify('As observações devem ter até 1.500 caracteres.');return;}
  setBusy(true);
  try{
   const payload={platform,category,service_key:selected.id,video_url:info.url,target_views:amount,
     proposed_budget_brl:cost,notes,status:'received' as const,admin_notes:''};
   if(demo){
    const next=[{...payload,id:crypto.randomUUID(),user_id:'demo',created_at:new Date().toISOString()},...readDemo()];
    localStorage.setItem(demoKey,JSON.stringify(next));setRequests(next);
   }else{
    if(!supabase||!session)throw Error('Entre em sua conta antes de enviar.');
    const {error}=await supabase.from('campaign_requests').insert({...payload,user_id:session.user.id});
    if(error)throw error;
    await reload();
   }
   notify('Solicitação registrada. Nenhuma cobrança nem visualização foi realizada.');
   setLink('');setNotes('');
  }catch(err){notify(err instanceof Error?err.message:'Erro ao registrar solicitação.');}
  finally{setBusy(false);}
 };
 const changeStatus=async(item:Request,status:Status)=>{
  if(demo){const updated=readDemo().map(r=>r.id===item.id?{...r,status}:r);localStorage.setItem(demoKey,JSON.stringify(updated));setRequests(updated);return;}
  if(!isAdmin||!supabase)return;
  const {error}=await supabase.from('campaign_requests').update({status,updated_at:new Date().toISOString()}).eq('id',item.id);
  if(error)notify(error.message);
  else {notify('Status interno atualizado.');void reload();}
 };
 const matched=SERVICES.filter(x=>(search.trim()===''||(x.label+' '+x.details).toLowerCase().includes(search.toLowerCase()))&&platform===x.platform);
 const platformChooser=<div className="smm-platforms">{platformList.map(p=><button type="button" key={p} onClick={()=>changePlatform(p)} className={'smm-network '+(platform===p?'is-active':'')}>
   <PlatformIcon name={p}/>{PLATFORM_NAMES[p]}
 </button>)}</div>;

 return <div className="smm-page">
  <div className="page-head"><div><span className="eyebrow">VIEWNOW · CENTRAL DE DIVULGAÇÃO</span><h1>{page==='new-order'?'Nova solicitação':page==='orders'?'Meus pedidos':'Catálogo de serviços'}<span className="dot">.</span></h1><p>{page==='new-order'?'Uma experiência simples para planejar campanhas para audiência real.':page==='orders'?'Acompanhe suas solicitações e o atendimento da equipe.':'Serviços de marketing digital e distribuição legítima de conteúdo.'}</p></div><span className="smm-tag"><ShieldCheck size={16}/> Sistema próprio</span></div>
  {page==='new-order'&&<div className="smm-workspace">
   <section className="smm-card smm-form-card">
     {platformChooser}
     <div className="smm-divider"/>
     <form onSubmit={sendOrder} className="smm-orderform">
       <div className="smm-field"><label htmlFor="smm-cat">Categoria</label><select id="smm-cat" value={category} onChange={e=>changeCategory(e.target.value as Category)}>{CATEGORIES.map(c=><option value={c.id} key={c.id}>{PLATFORM_NAMES[platform]} | {c.label}</option>)}</select></div>
       <div className="smm-field"><label htmlFor="smm-service">Serviço</label><select id="smm-service" value={selected?.id} onChange={e=>setServiceId(e.target.value)}>{selection.map(s=><option value={s.id} key={s.id}>{s.label}</option>)}</select></div>
       <div className="smm-service-details"><div className="smm-service-symbol"><Megaphone size={20}/></div><div><strong>{selected?.label}</strong><p>{selected?.details}</p><small>Orçamento mínimo sugerido: {money(selected?.minBudget||0)}</small></div></div>
       <div className="smm-field"><label htmlFor="smm-url">Link público do vídeo</label><input id="smm-url" required type="url" value={link} onChange={e=>setLink(e.target.value)} placeholder={'Cole o link do seu vídeo do '+PLATFORM_NAMES[platform]}/></div>
       <div className="smm-pair">
         <div className="smm-field"><label htmlFor="smm-goal">Meta de visualizações</label><input id="smm-goal" required type="number" min="100" max="1000000000" step="1" value={goal} onChange={e=>setGoal(e.target.value)}/></div>
         <div className="smm-field"><label htmlFor="smm-budget">Orçamento planejado (R$)</label><input id="smm-budget" required type="number" min={selected?.minBudget||0} max="10000000" step="0.01" value={budget} onChange={e=>setBudget(e.target.value)}/></div>
       </div>
       <div className="smm-field"><label htmlFor="smm-notes">Observações (opcional)</label><textarea id="smm-notes" rows={3} maxLength={1500} value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Público, região, objetivos e outras informações..."/></div>
       <div className="smm-quote"><div><Wallet size={19}/><span>Orçamento informado</span></div><strong>{Number.isFinite(Number(budget))?money(Number(budget)):money(0)}</strong><small>Não será cobrado agora. Valor sujeito à análise; não há garantia de quantidade de views.</small></div>
       <button className="btn btn-primary smm-submit" disabled={busy} type="submit">{busy?'Enviando...':'Enviar solicitação para análise'} <ArrowRight size={18}/></button>
     </form>
   </section>
   <aside className="smm-card smm-help">
      <div className="smm-help-title"><HelpCircle size={21}/><h2>Como funciona?</h2></div>
      <div className="smm-instruction"><b>1</b><p>Escolha a rede social, categoria e o serviço.</p></div>
      <div className="smm-instruction"><b>2</b><p>Cole um link público do vídeo e defina sua meta.</p></div>
      <div className="smm-instruction"><b>3</b><p>Informe quanto pretende investir na divulgação.</p></div>
      <div className="smm-instruction"><b>4</b><p>Envie para análise. O pedido ficará salvo na ViewNow.</p></div>
      <div className="smm-help-callout"><ShieldCheck size={19}/><div><strong>Divulgação transparente</strong><p>Somente campanhas de alcance legítimo podem ser planejadas. Nenhum pedido gera visualizações, curtidas ou seguidores automaticamente.</p></div></div>
      <div className="smm-infos"><h3>Sobre as métricas</h3><p><b>Meta:</b> objetivo desejado, não quantidade comprada.</p><p><b>Orçamento:</b> valor proposto, ainda não cobrado.</p><p><b>Status:</b> etapa de atendimento, não comprovação de views.</p></div>
      <div className="smm-help-footer"><BadgeCheck size={17}/> Pedido registrado na sua própria base Supabase</div>
   </aside>
  </div>}
  {page==='orders'&&<section className="smm-card smm-orders">
    <div className="smm-list-head"><div><h2>Histórico de solicitações</h2><p>{isAdmin?'Visão administrativa: solicitações de todos os usuários.':'Seus pedidos de planejamento e divulgação.'}</p></div><span className="smm-counter">{requestCount} pedidos</span></div>
    {refreshing&&<p className="smm-muted">Atualizando pedidos…</p>}
    {!refreshing&&requests.length===0?<div className="smm-empty"><ClipboardList size={42}/><h3>Nenhuma solicitação por enquanto</h3><p>Os pedidos enviados pelo formulário aparecerão aqui.</p></div>:<div className="smm-order-list">{requests.map(item=>{
      const svc=SERVICES.find(x=>x.id===item.service_key);
      return <article className="smm-order" key={item.id}>
       <div className="smm-order-top"><span className="smm-id">#{item.id.slice(0,8).toUpperCase()}</span><span className={'smm-status '+item.status}>{statusLabel[item.status]}</span><time>{new Date(item.created_at).toLocaleDateString('pt-BR')}</time></div>
       <div className="smm-order-mid"><PlatformIcon name={item.platform}/><div><strong>{svc?.label||item.service_key}</strong><a href={item.video_url} target="_blank" rel="noopener noreferrer">{item.video_url} <ExternalLink size={13}/></a></div></div>
       <div className="smm-order-data"><span><b>{Number(item.target_views).toLocaleString('pt-BR')}</b> meta de visualizações</span><span><b>{money(Number(item.proposed_budget_brl))}</b> orçamento planejado</span></div>
       {isAdmin&&<div className="smm-admin-bar"><label htmlFor={'status-'+item.id}>Status interno</label><select id={'status-'+item.id} value={item.status} onChange={e=>void changeStatus(item,e.target.value as Status)}>
         {(['received','reviewing','awaiting_approval','canceled'] as Status[]).map(x=><option key={x} value={x}>{statusLabel[x]}</option>)}
       </select></div>}
      </article>})}</div>}
    <p className="smm-bottom-note"><Clock3 size={15}/> Nenhum pedido é executado automaticamente. Acompanhamento de solicitações não comprova entrega de audiência.</p>
   </section>}
   {page==='services'&&<section className="smm-card smm-catalog">
     <div className="smm-list-head"><div><h2>Serviços disponíveis</h2><p>Estratégias de crescimento com pessoas reais e plataformas oficiais.</p></div><span className="smm-counter">{SERVICES.length} serviços</span></div>
     <div className="smm-search"><Search size={18}/><input type="search" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Pesquisar serviços de divulgação, anúncios ou auditoria..."/></div>
     <div className="smm-catalog-networks">{platformChooser}</div>
     <div className="smm-service-list">{matched.filter(x=>x.platform===platform).map(s=><div key={s.id} className="smm-catalog-item"><PlatformIcon name={s.platform}/><div><strong>{s.label}</strong><p>{s.details}</p></div><div className="smm-cat-budget">{s.minBudget?('A partir de '+money(s.minBudget)):'Sob análise'}<small>Orçamento, não preço por view</small></div></div>)}</div>
     <p className="smm-bottom-note"><SlidersHorizontal size={15}/> Os serviços são opções de solicitação. A execução depende de análise e configuração dos canais de publicidade.</p>
    </section>}
 </div>;
}
