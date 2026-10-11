// payment-notice — receives "I have paid" from the buy page. Deploy:  supabase functions deploy payment-notice --no-verify-jwt
// (--no-verify-jwt: visitors are anonymous; this function does its own check, a Turnstile CAPTCHA.)
// Secrets (supabase secrets set …): TURNSTILE_SECRET (required), RESEND_API_KEY + MAIL_FROM (optional: e-mail the artist), ALLOWED_ORIGIN (optional, e.g. https://circles.example).
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are provided by the platform. The service role key never leaves this function.
import {createClient} from 'jsr:@supabase/supabase-js@2';
import {parseNotice, workBlock, rateBlock, holdStatus, noticeEmail} from './logic.js';

const env = (k: string) => Deno.env.get(k) || '';
const cors = {'Access-Control-Allow-Origin': env('ALLOWED_ORIGIN') || '*', 'Access-Control-Allow-Headers': 'content-type, authorization, apikey, x-client-info', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Vary': 'Origin'};
const reply = (status: number, body: unknown) => new Response(JSON.stringify(body), {status, headers: {...cors, 'Content-Type': 'application/json'}});

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, {status: 204, headers: cors});
  if (req.method !== 'POST') return reply(405, {error: 'method'});
  if (!env('TURNSTILE_SECRET')) return reply(500, {error: 'not_configured'});   // never accept a notice nobody could verify

  let body: unknown;
  try { body = await req.json(); } catch { return reply(400, {error: 'bad_body'}); }
  const parsed = parseNotice(body);
  if (!parsed.value) return reply(400, parsed);
  const n = parsed.value;

  // 1. CAPTCHA
  const ip = req.headers.get('cf-connecting-ip') || req.headers.get('x-forwarded-for')?.split(',')[0] || '';
  const v = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {method: 'POST', body: new URLSearchParams({secret: env('TURNSTILE_SECRET'), response: n.captcha, ...(ip ? {remoteip: ip} : {})})})
    .then(r => r.json()).catch(() => ({success: false}));
  if (!v.success) return reply(400, {error: 'captcha'});

  const sb = createClient(env('SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'), {auth: {persistSession: false}});

  // 2. the work must exist, belong to an approved artist and not be sold; rate limits
  const {data: artist} = await sb.from('artists').select('id,name,approved').eq('id', n.artist_id).maybeSingle();
  const {data: work} = await sb.from('works').select('id,title,status,price_usd,price_lak').eq('artist_id', n.artist_id).eq('position', n.position).maybeSingle();
  if (!work || !artist) return reply(404, {error: 'not_found'});
  const open = await sb.from('payment_notices').select('id', {count: 'exact', head: true}).eq('work_id', work.id).eq('status', 'new');
  const block = workBlock(work, artist, open.count || 0);
  if (block) return reply(block === 'not_found' ? 404 : 409, {error: block});
  const since = new Date(Date.now() - 3600_000).toISOString();
  const recent = await sb.from('payment_notices').select('id', {count: 'exact', head: true}).eq('buyer_email', n.buyer_email).gte('created_at', since);
  if (rateBlock(recent.count || 0)) return reply(429, {error: 'rate'});

  // 3. save the notice, keep the price the buyer saw
  const {data: row, error} = await sb.from('payment_notices').insert({artist_id: n.artist_id, work_id: work.id, buyer_name: n.buyer_name, buyer_email: n.buyer_email,
    ship_to: n.ship_to, message: n.message, price_usd: work.price_usd, price_lak: work.price_lak}).select('id').single();
  if (error || !row) return reply(500, {error: 'save'});

  // 4. the slip (optional): a private object under <artist_id>/
  if (n.slip) {
    const bytes = Uint8Array.from(atob(n.slip.data), c => c.charCodeAt(0)), path = `${n.artist_id}/${row.id}.${n.slip.ext}`;
    const up = await sb.storage.from('slips').upload(path, bytes, {contentType: n.slip.type, upsert: false});
    if (!up.error) await sb.from('payment_notices').update({slip_path: path}).eq('id', row.id);
  }

  // 5. the work goes on hold while the artist checks the bank
  const hold = holdStatus(work.status);
  if (hold !== work.status) await sb.from('works').update({status: hold}).eq('id', work.id);

  // 6. tell the artist (optional; the dashboard shows the notice either way)
  if (env('RESEND_API_KEY') && env('MAIL_FROM')) {
    try {
      const {data: priv} = await sb.from('artist_private').select('email').eq('artist_id', n.artist_id).maybeSingle();
      if (priv?.email) {
        const m = noticeEmail({artistName: artist.name, title: work.title, priceUsd: work.price_usd, priceLak: work.price_lak, n});
        await fetch('https://api.resend.com/emails', {method: 'POST', headers: {Authorization: `Bearer ${env('RESEND_API_KEY')}`, 'Content-Type': 'application/json'},
          body: JSON.stringify({from: env('MAIL_FROM'), to: [priv.email], reply_to: m.replyTo, subject: m.subject, text: m.text})});
      }
    } catch { /* the notice is saved; a failed e-mail must not undo it */ }
  }
  return reply(200, {ok: true, id: row.id});
});
