import { authenticate, err } from './_lib/auth';
export async function POST(request: Request) {
  try {
    const { user, adminClient } = await authenticate(request);
    const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    if (!email || user.email?.toLowerCase() !== email) return Response.json({ error: 'Acesso negado.' }, { status: 403 });
    const { error } = await adminClient.from('profiles').update({ is_admin:true }).eq('id',user.id);
    if (error) throw error;
    return Response.json({ ok:true, role:'admin' });
  } catch (e) { return err(e); }
}
