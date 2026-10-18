/* DonationsPanel.jsx — "I've donated" notices from supporters. The artist checks their bank app, then confirms the donation or marks it as not received.
   Nothing is sold and no work changes state. Notices are created only by the donation-notice Edge Function (supabase/migrations/003_donations.sql). */
import {useCallback, useEffect, useState} from 'react';
import {useLang} from '../../lib/i18n.jsx';
import {useMt} from '../../lib/manageStrings.js';
import {supabase} from '../../lib/supabase.js';

const amount = n => (n.currency === 'USD' ? `$${Number(n.amount).toLocaleString('en-US')}` : `${Number(n.amount).toLocaleString('en-US')} ${n.currency}`);

export default function DonationsPanel({artist, onCount}) {
  const mt = useMt(), {lang} = useLang();
  const [rows, setRows] = useState(null), [fail, setFail] = useState(false), [sure, setSure] = useState(''), [msg, setMsg] = useState('');
  const load = useCallback(async () => {
    setFail(false);
    const {data, error} = await supabase().from('donation_notices').select('*, works(title,title_en,title_lo)').eq('artist_id', artist.id).order('created_at', {ascending: false});
    if (error) { setFail(true); return; }
    setRows(data); onCount(data.filter(r => r.status === 'pending').length);
  }, [artist.id, onCount]);
  useEffect(() => { load(); }, [load]);

  async function decide(n, status) {
    setMsg('');
    const {error} = await supabase().from('donation_notices').update({status}).eq('id', n.id);
    if (error) { setMsg('retry'); return; }
    await load();
  }
  async function slip(n) {
    const {data, error} = await supabase().storage.from('slips').createSignedUrl(n.slip_path, 120);
    if (error || !data) { setMsg('dn_slip_fail'); return; }
    window.open(data.signedUrl, '_blank', 'noopener');
  }

  if (fail) return <div className="mg-bad" role="alert">{mt('load_fail')} <button type="button" className="mg-mini" style={{width: 'auto', marginLeft: '.6rem'}} onClick={load}>{mt('reload')}</button></div>;
  if (!rows) return <p role="status" className="mg-status">{mt('loading')}</p>;
  const title = n => (n.works && ((lang === 'en' && n.works.title_en) || (lang === 'lo' && n.works.title_lo) || n.works.title)) || '';
  return <section className="mg-panel">
    <h2>{mt('dn_h')}</h2>
    <p className="mg-note">{mt('dn_note')}</p>
    {msg && <p className="mg-ok bad" role="alert">{mt(msg)}</p>}
    {rows.length === 0 ? <p className="mg-empty">{mt('dn_none')}</p> :
      <ul className="mg-orders">
        {rows.map(n => <li key={n.id} className={'mg-order ' + n.status}>
          <div className="mg-ohead"><b>{amount(n)}</b><span className={'mg-st ' + n.status}>{mt('dn_' + n.status)}</span></div>
          <p className="mg-ometa">{new Date(n.created_at).toLocaleString(lang === 'en' ? 'en-GB' : 'th-TH', {dateStyle: 'medium', timeStyle: 'short'})}{title(n) ? ` · ${mt('dn_for', {t: title(n)})}` : ''}</p>
          <p><span>{mt('dn_donor')}</span> {n.donor_name} · <a href={`mailto:${n.donor_email}`}>{n.donor_email}</a></p>
          {n.message && <p><span>{mt('dn_msg')}</span> {n.message}</p>}
          <div className="mg-acts">
            {n.slip_path && <button type="button" className="mg-mini" onClick={() => slip(n)}>{mt('dn_slip')}</button>}
            {n.status === 'pending' && <>
              <button type="button" className="mg-mini ok" onClick={() => decide(n, 'confirmed')}>{mt('dn_confirm')}</button>
              <button type="button" className="mg-mini del" data-sure={sure === n.id ? '' : undefined} onBlur={() => setSure('')}
                onClick={() => { if (sure === n.id) { setSure(''); decide(n, 'rejected'); } else setSure(n.id); }}>{sure === n.id ? mt('dn_reject_sure') : mt('dn_reject')}</button></>}
          </div>
        </li>)}
      </ul>}
  </section>;
}
