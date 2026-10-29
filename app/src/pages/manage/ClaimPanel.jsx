/* ClaimPanel.jsx — a login with no building asks for one (claim_building, migration 009). It is created hidden; an admin approves it. */
import {useState} from 'react';
import {ARTISTS} from 'virtual:circles/data';
import {useMt} from '../../lib/manageStrings.js';
import {supabase} from '../../lib/supabase.js';
import {formToClaim, slugFrom} from '../../lib/manage.js';
import {Field, SaveState} from './Field.jsx';

const TAKEN = ARTISTS.map(a => a.id);   // hand-written buildings of artists.js: the database does not know them

export default function ClaimPanel({email, onDone}) {
  const mt = useMt();
  const [form, setForm] = useState(() => ({id: slugFrom(email), name: '', disc: '', city: '', note: ''}));
  const [errors, setErrors] = useState({}), [state, setState] = useState(''), [msg, setMsg] = useState('');
  const set = (k, v) => { setForm(f => ({...f, [k]: v})); setState(''); };
  const props = {form, set, errors};

  async function send(e) {
    e.preventDefault();
    const r = formToClaim(form, TAKEN);
    if (r.errors) { setErrors(r.errors); setState('fix'); return; }
    setErrors({}); setMsg(''); setState('saving');
    const {error} = await supabase().rpc('claim_building', r.row);
    if (!error) { onDone(); return; }
    if (/duplicate key/.test(error.message || '')) { setErrors({id: 'er_taken'}); setState('fix'); return; }
    if (/already has a building/.test(error.message || '')) { onDone(); return; }   // sent twice (two tabs): just show the building
    if (/too many requests/.test(error.message || '')) setMsg('cl_full');
    setState('fail');
  }

  return <form className="mg-panel" onSubmit={send} noValidate>
    <h2 style={{marginTop: 0}}>{mt('cl_h')}</h2>
    <p>{mt('cl_p', {e: email})}</p>
    <div className="mg-grid">
      <Field label={mt('f_name')} name="name" maxLength={80} {...props}/>
      <Field label={mt('f_disc')} name="disc" maxLength={60} {...props}/>
      <Field label={mt('f_city')} name="city" maxLength={60} {...props}/>
      <Field label={mt('f_slug')} name="id" maxLength={40} autoCapitalize="none" spellCheck="false" {...props}/>
      <p className="wide" style={{margin: '-.6rem 0 0', fontSize: '.85rem', opacity: .85}}>{mt('f_slug_s')}</p>
      <Field label={mt('f_note')} name="note" as="textarea" wide maxLength={500} {...props}/>
    </div>
    {msg && <p className="mg-bad" role="alert">{mt(msg)}</p>}
    <div className="mg-bar"><button type="submit" className="btn" disabled={state === 'saving'}>{mt('cl_btn')}</button><SaveState state={state}/></div>
  </form>;
}
