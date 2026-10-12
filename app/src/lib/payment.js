/* payment.js — the payment details of one artist (public rows in Supabase: bank, account, LAO QR) and the "I've donated" notice (the donation-notice Edge Function). */
import {supabase, supabaseReady} from './supabase.js';

/* → {bank, account_name, account_no, qrUrl} or null (no payment info: the donation dialog says so) */
export async function fetchPayment(artistId) {
  if (!supabaseReady) return null;
  try {
    const sb = supabase();
    const {data, error} = await sb.from('artist_payment').select('bank,account_name,account_no,qr_path').eq('artist_id', artistId).maybeSingle();
    if (error || !data || !(data.qr_path || data.account_no)) return null;
    return {...data, qrUrl: data.qr_path ? sb.storage.from('qr').getPublicUrl(data.qr_path).data.publicUrl : ''};
  } catch (e) { return null; }
}

/* a File → {type, data} with data = base64, shrunk first (a phone screenshot of a slip is several MB) */
export async function slipFromFile(file) {
  const {prepareImage} = await import('./image.js');
  const {blob} = await prepareImage(file, {max: 1400, limit: 1.5 * 1024 * 1024});
  const bytes = new Uint8Array(await blob.arrayBuffer());
  let bin = ''; for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return {type: blob.type, data: btoa(bin)};
}

/* body: {artist_id, position?, donor_name, donor_email, amount, currency?, message?, captcha, slip?} → {ok: true} or {error: code}. Codes: captcha, busy, rate, not_found, bad_field, net */
export async function sendDonation(body) {
  try {
    const {error} = await supabase().functions.invoke('donation-notice', {body});
    if (!error) return {ok: true};
    const j = error.context && typeof error.context.json === 'function' ? await error.context.json().catch(() => null) : null;
    return {error: (j && j.error) || 'net'};
  } catch (e) { return {error: 'net'}; }
}
