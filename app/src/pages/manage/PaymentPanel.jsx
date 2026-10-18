/* PaymentPanel.jsx — how buyers pay: the artist's own LAO QR and account (circles never touches the money), and the private e-mail for buyers' messages. */
import {useEffect, useState} from 'react';
import {useMt} from '../../lib/manageStrings.js';
import {supabase} from '../../lib/supabase.js';
import {formToPayment, formToEmail} from '../../lib/manage.js';
import {Field, SaveState} from './Field.jsx';
import ImagePick from './ImagePick.jsx';

const qrUrl = path => (path ? supabase().storage.from('qr').getPublicUrl(path).data.publicUrl : '');

export default function PaymentPanel({artist, userEmail}) {
  const mt = useMt();
  const [form, setForm] = useState(null), [fail, setFail] = useState(false), [errors, setErrors] = useState({}), [state, setState] = useState('');
  const set = (k, v) => { setForm(f => ({...f, [k]: v})); setState(''); };

  useEffect(() => {
    let live = true;
    (async () => {
      const sb = supabase();
      const [pay, priv] = await Promise.all([
        sb.from('artist_payment').select('*').eq('artist_id', artist.id).maybeSingle(),
        sb.from('artist_private').select('email').eq('artist_id', artist.id).maybeSingle()]);
      if (!live) return;
      if (pay.error || priv.error) { setFail(true); return; }
      setForm({bank: pay.data?.bank || 'BCEL', account_name: pay.data?.account_name || '', account_no: pay.data?.account_no || '',
        qr_path: pay.data?.qr_path || '', email: priv.data?.email || userEmail || ''});
    })();
    return () => { live = false; };
  }, [artist.id, userEmail]);

  async function save(e) {
    e.preventDefault();
    const p = formToPayment(form), m = formToEmail(form.email);
    if (p.errors || m.errors) { setErrors({...p.errors, ...m.errors}); setState('fix'); return; }
    setErrors({}); setState('saving');
    const sb = supabase();
    const a = await sb.from('artist_payment').upsert({artist_id: artist.id, ...p.row, qr_path: form.qr_path || null}, {onConflict: 'artist_id'});
    const b = await sb.from('artist_private').upsert({artist_id: artist.id, email: m.email}, {onConflict: 'artist_id'});
    setState(a.error || b.error ? 'fail' : 'saved');
  }

  if (fail) return <div className="mg-bad" role="alert">{mt('load_fail')}</div>;
  if (!form) return <p role="status" className="mg-status">{mt('loading')}</p>;
  const props = {form, set, errors};
  return <form className="mg-panel" onSubmit={save} noValidate>
    <h2>{mt('p_h')}</h2>
    <p className="mg-note">{mt('p_note')}</p>
    <p className="mg-note warn">{mt('p_warn')}</p>
    <div className="mg-grid">
      <Field label={mt('p_bank')} name="bank" maxLength={30} list="mg-banks" {...props}/>
      <datalist id="mg-banks"><option value="BCEL"/><option value="LDB"/></datalist>   {/* the two banks most artists in Laos use; any other name can still be typed */}
      <Field label={mt('p_acc_name')} name="account_name" maxLength={80} {...props}/>
      <Field label={mt('p_acc_no')} name="account_no" inputMode="numeric" maxLength={40} {...props}/>
    </div>
    <h3 className="mg-h3">{mt('p_qr')}</h3>
    <p className="mg-note">{mt('p_qr_help')}</p>
    <ImagePick qr src={qrUrl(form.qr_path)} bucket="qr" artistId={artist.id} max={900} png limit={1.9 * 1024 * 1024}
      onDone={({path}) => set('qr_path', path)} label={mt('img_pick')}/>
    <p className="mg-ok" style={{marginBottom: '1.2rem'}}>{mt('p_public')}</p>
    <h3 className="mg-h3">{mt('p_email')}</h3>
    <div className="mg-grid"><Field label={mt('lg_email')} name="email" type="email" autoComplete="email" {...props}/></div>
    <p className="mg-ok">{mt('p_email_note')}</p>
    <div className="mg-bar"><button type="submit" className="btn" disabled={state === 'saving'}>{mt('save')}</button><SaveState state={state}/></div>
  </form>;
}
