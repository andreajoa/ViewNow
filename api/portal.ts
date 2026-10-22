import Stripe from 'stripe';
import { authenticate, err } from './_lib/auth';
export async function POST(request:Request) {
  try {
    const {user,adminClient} = await authenticate(request);
    if (!process.env.STRIPE_SECRET_KEY) throw new Error('Stripe não configurada.');
    const { data, error } = await adminClient.from('profiles').select('stripe_customer_id').eq('id',user.id).single();
    if (error) throw error;
    if (!data.stripe_customer_id) throw new Error('Você ainda não tem uma assinatura.');
    const base = process.env.APP_URL?.replace(/\/+$/,'');
    if (!base || !base.startsWith('https://')) throw new Error('APP_URL HTTPS precisa ser configurada.');
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const portal = await stripe.billingPortal.sessions.create({
      customer:data.stripe_customer_id, return_url:base + '/app'
    });
    return Response.json({url:portal.url});
  } catch(e) {return err(e);}
}
