import Stripe from 'stripe';
import { getClients } from './_lib/auth';
export async function POST(request: Request) {
  const secret = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret || !webhookSecret) return Response.json({error:'Stripe não configurada'}, {status:503});
  const sig = request.headers.get('stripe-signature');
  if (!sig) return Response.json({error:'Assinatura ausente'},{status:400});
  const stripe = new Stripe(secret);
  let event:Stripe.Event;
  try { event = stripe.webhooks.constructEvent(await request.text(),sig,webhookSecret); }
  catch { return Response.json({error:'Assinatura inválida'},{status:400}); }
  try {
    const {adminClient} = getClients();
    const sync = async (sub:Stripe.Subscription, userId?:string) => {
      let id = userId || sub.metadata.user_id;
      if (!id) {
        const {data} = await adminClient.from('profiles').select('id').eq('stripe_customer_id',String(sub.customer)).maybeSingle();
        id = data?.id;
      }
      if (!id) return;
      const active = ['active','trialing'].includes(sub.status);
      const plan = active && ['starter','growth','scale'].includes(sub.metadata.plan) ? sub.metadata.plan : 'free';
      const {error} = await adminClient.from('profiles').update({plan, stripe_customer_id:String(sub.customer)}).eq('id',id);
      if (error) throw error;
    };
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      if (typeof session.subscription === 'string') {
        const sub = await stripe.subscriptions.retrieve(session.subscription);
        await sync(sub,session.client_reference_id || undefined);
      }
    } else if (event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.deleted' || event.type === 'customer.subscription.created') {
      const subEvent = event.data.object as Stripe.Subscription;
      // Fetch the current status to avoid stale/out-of-order webhook updates.
      const sub = subEvent.status === 'canceled' ? subEvent : await stripe.subscriptions.retrieve(subEvent.id);
      await sync(sub);
    }
    return Response.json({received:true});
  } catch(e) {
    console.error('Stripe event failed:',event.id,e);
    return Response.json({error:'Falha na sincronização'},{status:500});
  }
}
