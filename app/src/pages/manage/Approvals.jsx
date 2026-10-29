/* Approvals.jsx — admins only: the buildings that asked (migration 009) and wait. Approve = artists.approved true; delete = the request and its works go. */
import {useCallback, useEffect, useState} from 'react';
import {useMt} from '../../lib/manageStrings.js';
import {supabase} from '../../lib/supabase.js';

export default function Approvals() {
  const mt = useMt();
  const [rows, setRows] = useState(null), [busy, setBusy] = useState(''), [fail, setFail] = useState(false);
  const load = useCallback(async () => {
    const {data, error} = await supabase().from('artists').select('id, name, disc, city, created_at, artist_private(email, apply_note)')
      .eq('approved', false).eq('demo', false).order('created_at');
    setFail(!!error); setRows(error ? [] : data);
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
  </section>;
}
