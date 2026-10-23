import Stripe from 'stripe';
import { authenticate, err } from './_lib/auth';
export async function POST(request: Request) {
  try {
    const { user, adminClient } = await authenticate(request);
    if (!process.env.STRIPE_SECRET_KEY) throw new Error('Stripe não configurada.');
    const body = await request.json();
    const plan = String(body.plan || '');
    const prices: Record<string,string|undefined> = {
      starter: process.env.STRIPE_PRICE_STARTER,
      growth: process.env.STRIPE_PRICE_GROWTH,
      scale: process.env.STRIPE_PRICE_SCALE
    };
    if (!prices[plan]) throw new Error('Plano indisponível ou sem preço configurado.');
    const base = process.env.APP_URL?.replace(/\/+$/, '');
    if (!base || !base.startsWith('https://')) throw new Error('APP_URL HTTPS precisa ser configurada.');
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const { data: profile, error } = await adminClient.from('profiles').select('stripe_customer_id,is_admin').eq('id', user.id).single();
    if (error) throw error;
    // Administrators never enter paid checkout, even if called directly via the API.
    if (profile.is_admin) return Response.json({error:'Administradores usam a ViewNow gratuitamente e não precisam contratar um plano.'}, {status:403});
    let customerId = profile.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({ email:user.email, metadata:{ user_id:user.id } });
      customerId = customer.id;
      const { error: e } = await adminClient.from('profiles').update({stripe_customer_id:customerId}).eq('id',user.id);
      if (e) throw e;
    }
    const session = await stripe.checkout.sessions.create({
      mode:'subscription', customer:customerId,
      line_items:[{ price:prices[plan], quantity:1 }],
      client_reference_id:user.id,
      metadata:{ user_id:user.id, plan },
      subscription_data:{metadata:{user_id:user.id,plan}},
      success_url:base + '/app?billing=success',
      cancel_url:base + '/app?billing=cancel'
    });
    return Response.json({ url:session.url });
  } catch (e) { return err(e); }
}
