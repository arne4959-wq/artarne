/* OrdersPanel.jsx — "I have paid" notices from buyers. The artist checks their bank app, then confirms (the work becomes sold) or says no
   (the work goes back on sale if no one else is waiting on it). Notices are created only by the payment-notice Edge Function. */
import {useCallback, useEffect, useState} from 'react';
import {useLang} from '../../lib/i18n.jsx';
import {useMt} from '../../lib/manageStrings.js';
import {supabase} from '../../lib/supabase.js';

const money = (n, lang) => (n.price_lak ? `${Number(n.price_lak).toLocaleString('en-US')} ₭ · ` : '') + `$${Number(n.price_usd).toLocaleString('en-US')}`;

export default function OrdersPanel({artist, onCount}) {
  const mt = useMt(), {lang} = useLang();
  const [rows, setRows] = useState(null), [fail, setFail] = useState(false), [sure, setSure] = useState(''), [msg, setMsg] = useState('');
  const load = useCallback(async () => {
    setFail(false);
    const {data, error} = await supabase().from('payment_notices').select('*, works(title,title_en,title_lo,status)').eq('artist_id', artist.id).order('created_at', {ascending: false});
    if (error) { setFail(true); return; }
    setRows(data); onCount(data.filter(r => r.status === 'new').length);
  }, [artist.id, onCount]);
  useEffect(() => { load(); }, [load]);

  async function decide(n, status) {
    setMsg('');
    const sb = supabase();
    const a = await sb.from('payment_notices').update({status}).eq('id', n.id);
    if (a.error) { setMsg('retry'); return; }
    if (status === 'confirmed') {
      const b = await sb.from('works').update({status: 'sold'}).eq('id', n.work_id);
      if (b.error) { setMsg('retry'); await load(); return; }
    } else {
      const others = rows.some(r => r.id !== n.id && r.work_id === n.work_id && r.status === 'new');
      if (!others && n.works && n.works.status === 'reserved') await sb.from('works').update({status: ''}).eq('id', n.work_id);   // nobody else is waiting: back on sale
    }
    await load();
  }
  async function slip(n) {
    const {data, error} = await supabase().storage.from('slips').createSignedUrl(n.slip_path, 120);
    if (error || !data) { setMsg('o_slip_fail'); return; }
    window.open(data.signedUrl, '_blank', 'noopener');
  }

  if (fail) return <div className="mg-bad" role="alert">{mt('load_fail')} <button type="button" className="mg-mini" style={{width: 'auto', marginLeft: '.6rem'}} onClick={load}>{mt('reload')}</button></div>;
  if (!rows) return <p role="status" className="mg-status">{mt('loading')}</p>;
  const title = n => (n.works && ((lang === 'en' && n.works.title_en) || (lang === 'lo' && n.works.title_lo) || n.works.title)) || '';
  return <section className="mg-panel">
    <h2>{mt('o_h')}</h2>
    <p className="mg-note">{mt('o_note')}</p>
    {msg && <p className="mg-ok bad" role="alert">{mt(msg)}</p>}
    {rows.length === 0 ? <p className="mg-empty">{mt('o_none')}</p> :
      <ul className="mg-orders">
        {rows.map(n => <li key={n.id} className={'mg-order ' + n.status}>
          <div className="mg-ohead"><b>{title(n)}</b><span className={'mg-st ' + n.status}>{mt('o_' + n.status)}</span></div>
          <p className="mg-ometa">{money(n, lang)} · {new Date(n.created_at).toLocaleString(lang === 'en' ? 'en-GB' : 'th-TH', {dateStyle: 'medium', timeStyle: 'short'})}</p>
          <p><span>{mt('o_buyer')}</span> {n.buyer_name} · <a href={`mailto:${n.buyer_email}`}>{n.buyer_email}</a></p>
          {n.ship_to && <p><span>{mt('o_ship')}</span> {n.ship_to}</p>}
          {n.message && <p><span>{mt('o_msg')}</span> {n.message}</p>}
          <div className="mg-acts">
            {n.slip_path && <button type="button" className="mg-mini" onClick={() => slip(n)}>{mt('o_slip')}</button>}
            {n.status === 'new' && <>
              <button type="button" className="mg-mini ok" onClick={() => decide(n, 'confirmed')}>{mt('o_paid')}</button>
              <button type="button" className="mg-mini del" data-sure={sure === n.id ? '' : undefined} onBlur={() => setSure('')}
                onClick={() => { if (sure === n.id) { setSure(''); decide(n, 'rejected'); } else setSure(n.id); }}>{sure === n.id ? mt('o_reject_sure') : mt('o_reject')}</button></>}
          </div>
        </li>)}
      </ul>}
  </section>;
}
