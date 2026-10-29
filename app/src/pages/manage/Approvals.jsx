/* Approvals.jsx — admins only: the buildings that asked (migration 009) and wait. Approve = artists.approved true; delete = the request and its works go.
   Also the payment accounts / QRs nobody has checked yet (migration 008): visitors see a QR only after an admin ticks it here. */
import {useCallback, useEffect, useState} from 'react';
import {useMt} from '../../lib/manageStrings.js';
import {supabase} from '../../lib/supabase.js';

const qrUrl = path => supabase().storage.from('qr').getPublicUrl(path).data.publicUrl;

export default function Approvals() {
  const mt = useMt();
  const [rows, setRows] = useState(null), [pays, setPays] = useState([]), [busy, setBusy] = useState(''), [fail, setFail] = useState(false);
  const load = useCallback(async () => {
    const sb = supabase();
    const [a, p] = await Promise.all([
      sb.from('artists').select('id, name, disc, city, created_at, artist_private(email, apply_note)').eq('approved', false).eq('demo', false).order('created_at'),
      sb.from('artist_payment').select('artist_id, bank, account_name, account_no, qr_path').eq('checked', false)]);
    setFail(!!(a.error || p.error)); setRows(a.error ? [] : a.data); setPays(p.error ? [] : p.data);
  }, []);
  useEffect(() => { load(); }, [load]);

  async function act(a, ok) {
    if (!ok && !window.confirm(mt('ad_no_q', {a: a.name}))) return;
    setBusy(a.id); setFail(false);
    const q = supabase().from('artists');
    const {error} = ok ? await q.update({approved: true}).eq('id', a.id) : await q.delete().eq('id', a.id);
    setBusy('');
    if (error) { setFail(true); return; }
    setRows(r => r.filter(x => x.id !== a.id));
  }

  async function check(p) {
    setBusy('pay:' + p.artist_id); setFail(false);
    const q = supabase().from('artist_payment').update({checked: true}).eq('artist_id', p.artist_id);   // only the QR the admin looked at: a newer one stays unchecked
    const {error} = await (p.qr_path ? q.eq('qr_path', p.qr_path) : q.is('qr_path', null));
    setBusy('');
    if (error) { setFail(true); return; }
    setPays(r => r.filter(x => x.artist_id !== p.artist_id));
  }

  if (!rows) return null;
  return <section className="mg-panel" aria-labelledby="ad-h" style={{marginBottom: '1.5rem'}}>
    <h2 id="ad-h" style={{marginTop: 0}}>{mt('ad_h')} ({rows.length})</h2>
    {fail && <p className="mg-bad" role="alert">{mt('ad_fail')}</p>}
    {!rows.length ? <p>{mt('ad_none')}</p> : <ul style={{listStyle: 'none', padding: 0, margin: 0}}>
      {rows.map(a => { const p = [].concat(a.artist_private)[0] || {};   // one-to-one: PostgREST may give an object or a one-item list
        return <li key={a.id} style={{borderTop: '3px solid #111', padding: '.8rem 0'}}>
          <b>{a.name}</b> · {a.disc} · {a.city} · <code>studio-{a.id}.html</code><br/>
          {p.email && <a href={'mailto:' + p.email}>{p.email}</a>}
          {p.apply_note && <p style={{margin: '.4rem 0', whiteSpace: 'pre-wrap', overflowWrap: 'anywhere'}}>{p.apply_note}</p>}
          <div style={{display: 'flex', gap: '.6rem', marginTop: '.5rem'}}>
            <button type="button" className="btn" disabled={busy === a.id} onClick={() => act(a, true)}>{mt('ad_ok')}</button>
            <button type="button" className="btn ghost" disabled={busy === a.id} onClick={() => act(a, false)}>{mt('ad_no')}</button>
          </div>
        </li>; })}
    </ul>}
    {pays.length > 0 && <>
      <h3 style={{margin: '1.2rem 0 .3rem'}}>{mt('ad_pay_h')} ({pays.length})</h3>
      <p style={{margin: '0 0 .4rem'}}>{mt('ad_pay_p')}</p>
      <ul style={{listStyle: 'none', padding: 0, margin: 0}}>
        {pays.map(p => <li key={p.artist_id} className="mg-pay" style={{borderTop: '3px solid #111', padding: '.8rem 0', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap'}}>
          {p.qr_path && <a href={qrUrl(p.qr_path)} target="_blank" rel="noopener"><img src={qrUrl(p.qr_path)} alt="QR" width="110" height="110" style={{objectFit: 'contain', border: '3px solid #111', background: '#fff'}}/></a>}
          <div>
            <b>{p.account_name || '—'}</b> · {p.bank} {p.account_no && <>· {p.account_no}</>}<br/>
            <code>studio-{p.artist_id}.html</code><br/>
            <button type="button" className="btn" style={{marginTop: '.5rem'}} disabled={busy === 'pay:' + p.artist_id} onClick={() => check(p)}>{mt('ad_pay_ok')}</button>
          </div>
        </li>)}
      </ul>
    </>}
  </section>;
}
