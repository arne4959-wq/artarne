// donation-notice — receives "I've donated" from the site's donation dialog. Deploy:  supabase functions deploy donation-notice --no-verify-jwt
// (--no-verify-jwt: visitors are anonymous; this function does its own check, a Turnstile CAPTCHA.)
// Secrets (supabase secrets set …): TURNSTILE_SECRET (required), RESEND_API_KEY + MAIL_FROM (optional: e-mail the artist), ALLOWED_ORIGIN (optional, e.g. https://circles.example).
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are provided by the platform. The service role key never leaves this function.
import {createClient} from 'jsr:@supabase/supabase-js@2';
import {parseDonation, artistBlock, rateBlock, donationEmail} from './logic.js';

const env = (k: string) => Deno.env.get(k) || '';
const cors = {'Access-Control-Allow-Origin': env('ALLOWED_ORIGIN') || '*', 'Access-Control-Allow-Headers': 'content-type, authorization, apikey, x-client-info', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Vary': 'Origin'};
const reply = (status: number, body: unknown) => new Response(JSON.stringify(body), {status, headers: {...cors, 'Content-Type': 'application/json'}});

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, {status: 204, headers: cors});
  if (req.method !== 'POST') return reply(405, {error: 'method'});
  if (!env('TURNSTILE_SECRET')) return reply(500, {error: 'not_configured'});   // never accept a notice nobody could verify

  let body: unknown;
  try { body = await req.json(); } catch { return reply(400, {error: 'bad_body'}); }
  const parsed = parseDonation(body);
  if (!parsed.value) return reply(400, parsed);
  const n = parsed.value;

  // 1. CAPTCHA
  const ip = req.headers.get('cf-connecting-ip') || req.headers.get('x-forwarded-for')?.split(',')[0] || '';
  const v = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {method: 'POST', body: new URLSearchParams({secret: env('TURNSTILE_SECRET'), response: n.captcha, ...(ip ? {remoteip: ip} : {})})})
    .then(r => r.json()).catch(() => ({success: false}));
  if (!v.success) return reply(400, {error: 'captcha'});

  const sb = createClient(env('SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'), {auth: {persistSession: false}});

  // 2. the artist must exist and be approved; a named work must belong to them; rate limits (per e-mail and per artist)
  const {data: artist} = await sb.from('artists').select('id,name,approved').eq('id', n.artist_id).maybeSingle();
  let work: {id: string; title: string} | null = null;
  if (n.position !== null) { const w = await sb.from('works').select('id,title').eq('artist_id', n.artist_id).eq('position', n.position).maybeSingle(); work = w.data; }
  const pending = await sb.from('donation_notices').select('id', {count: 'exact', head: true}).eq('artist_id', n.artist_id).eq('status', 'pending');
  const block = artistBlock(artist, n.position !== null, work, pending.count || 0);
  if (block) return reply(block === 'not_found' ? 404 : 409, {error: block});
  const since = new Date(Date.now() - 3600_000).toISOString();
  const byEmail = await sb.from('donation_notices').select('id', {count: 'exact', head: true}).eq('donor_email', n.donor_email).gte('created_at', since);
  const byArtist = await sb.from('donation_notices').select('id', {count: 'exact', head: true}).eq('artist_id', n.artist_id).gte('created_at', since);
  if (rateBlock(byEmail.count || 0, byArtist.count || 0)) return reply(429, {error: 'rate'});

  // 3. save the notice (no price, no work status: only the amount the donor says they gave)
  const {data: row, error} = await sb.from('donation_notices').insert({artist_id: n.artist_id, work_id: work ? work.id : null, donor_name: n.donor_name, donor_email: n.donor_email,
    amount: n.amount, currency: n.currency, message: n.message}).select('id').single();
  if (error || !row) return reply(500, {error: 'save'});

  // 4. the slip (optional): a private object under <artist_id>/
  if (n.slip) {
    const bytes = Uint8Array.from(atob(n.slip.data), c => c.charCodeAt(0)), path = `${n.artist_id}/${row.id}.${n.slip.ext}`;
    const up = await sb.storage.from('slips').upload(path, bytes, {contentType: n.slip.type, upsert: false});
    if (!up.error) await sb.from('donation_notices').update({slip_path: path}).eq('id', row.id);
  }

  // 5. tell the artist (optional; the dashboard shows the notice either way)
  if (env('RESEND_API_KEY') && env('MAIL_FROM')) {
    try {
      const {data: priv} = await sb.from('artist_private').select('email').eq('artist_id', n.artist_id).maybeSingle();
      if (priv?.email) {
        const m = donationEmail({artistName: artist.name, title: work ? work.title : '', n});
        await fetch('https://api.resend.com/emails', {method: 'POST', headers: {Authorization: `Bearer ${env('RESEND_API_KEY')}`, 'Content-Type': 'application/json'},
          body: JSON.stringify({from: env('MAIL_FROM'), to: [priv.email], reply_to: m.replyTo, subject: m.subject, text: m.text})});
      }
    } catch { /* the notice is saved; a failed e-mail must not undo it */ }
  }
  return reply(200, {ok: true, id: row.id});
});
