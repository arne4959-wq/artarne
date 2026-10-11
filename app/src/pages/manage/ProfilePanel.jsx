import {useState} from 'react';
import {useMt} from '../../lib/manageStrings.js';
import {supabase} from '../../lib/supabase.js';
import {profileToForm, formToProfile} from '../../lib/manage.js';
import {Field, Check, SaveState} from './Field.jsx';

export default function ProfilePanel({artist, onSaved}) {
  const mt = useMt();
  const [form, setForm] = useState(() => profileToForm(artist)), [errors, setErrors] = useState({}), [state, setState] = useState('');
  const set = (k, v) => { setForm(f => ({...f, [k]: v})); setState(''); };
  const props = {form, set, errors};

  async function save(e) {
    e.preventDefault();
    const r = formToProfile(form);
    if (r.errors) { setErrors(r.errors); setState('fix'); return; }
    setErrors({}); setState('saving');
    const {data, error} = await supabase().from('artists').update(r.update).eq('id', artist.id).select().single();
    if (error) { setState('fail'); return; }
    setState('saved'); onSaved(data);
  }

  return <form className="mg-panel" onSubmit={save} noValidate>
    <h3 className="mg-h3" style={{marginTop: 0}}>{mt('h_names')}</h3>
    <div className="mg-grid">
      <Field label={mt('f_name')} name="name" maxLength={80} {...props}/>
      <Field label={mt('f_name_en')} name="name_en" maxLength={80} {...props}/>
      <Field label={mt('f_name_lo')} name="name_lo" maxLength={80} {...props}/>
      <Field label={mt('f_since')} name="since" inputMode="numeric" maxLength={4} {...props}/>
      <Field label={mt('f_disc')} name="disc" maxLength={60} {...props}/>
      <Field label={mt('f_city')} name="city" maxLength={60} {...props}/>
    </div>
    <h3 className="mg-h3">{mt('h_about')}</h3>
    <div className="mg-grid">
      <Field label={mt('f_tagline')} name="tagline" maxLength={200} {...props}/>
      <Field label={mt('f_tagline_en')} name="tagline_en" maxLength={200} {...props}/>
      <Field label={mt('f_concept')} name="concept" as="textarea" maxLength={400} {...props}/>
      <Field label={mt('f_concept_en')} name="concept_en" as="textarea" maxLength={400} {...props}/>
      <Field label={mt('f_bio')} name="bio" as="textarea" wide maxLength={2000} {...props}/>
      <Field label={mt('f_bio_en')} name="bio_en" as="textarea" wide maxLength={2000} {...props}/>
      <Field label={mt('f_bio_lo')} name="bio_lo" as="textarea" wide maxLength={2000} {...props}/>
    </div>
    <h3 className="mg-h3">{mt('h_links')}</h3>
    <div className="mg-grid">
      <Field label={mt('f_instagram')} name="instagram" type="url" inputMode="url" placeholder="https://instagram.com/…" wide {...props}/>
      <div className="wide"><Check label={mt('f_commission')} name="commission_open" form={form} set={set}/></div>
      {form.commission_open && <><Field label={mt('f_until')} name="commission_until" maxLength={30} {...props}/><Field label={mt('f_until_en')} name="commission_until_en" maxLength={30} {...props}/></>}
    </div>
    <div className="mg-bar"><button type="submit" className="btn" disabled={state === 'saving'}>{mt('save')}</button><SaveState state={state}/></div>
  </form>;
}
