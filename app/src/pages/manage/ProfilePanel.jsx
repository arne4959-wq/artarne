import {useState} from 'react';
import {useMt} from '../../lib/manageStrings.js';
import {supabase} from '../../lib/supabase.js';
import {profileToForm, formToProfile} from '../../lib/manage.js';
import {Field, SaveState} from './Field.jsx';
import ImagePick from './ImagePick.jsx';
import {KIND_LIST, MAX_TIMELINE} from '../../lib/manage.js';

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
    <h3 className="mg-h3">{mt('h_photo')}</h3>
    <ImagePick src={form.photo} ar="1/1" bucket="art" artistId={artist.id} max={900} label={mt('photo_pick')} onDone={r => set('photo', r.url)}/>
    {form.photo ? <p><button type="button" className="mg-mini" style={{width: 'auto'}} onClick={() => set('photo', '')}>{mt('photo_remove')}</button></p> : null}
    {errors.photo ? <p className="mg-err" role="alert">{mt(errors.photo)}</p> : null}
    <h3 className="mg-h3">{mt('h_look')}</h3>
    <p style={{margin: '0 0 1rem', fontSize: '.9rem', opacity: .85}}>{mt('look_note')}</p>
    <div className="mg-grid">
      <label className="mg-lbl"><span>{mt('f_kind')}</span>
        <select className="mg-sel" value={form.kind} onChange={e => set('kind', e.target.value)}>{KIND_LIST.map(k => <option key={k} value={k}>{mt('kind_' + k)}</option>)}</select></label>
      <label className={'mg-lbl' + (errors.scale ? ' bad' : '')}><span>{mt('f_scale')}: {Number(form.scale || 1).toFixed(2)}</span>
        <input className="mg-in" style={{accentColor: '#111', padding: 0}} type="range" min="0.6" max="1.5" step="0.02" value={form.scale} onChange={e => set('scale', e.target.value)}/></label>
      <div className="mg-lbl wide"><span>{mt('f_colors')}</span>
        <div style={{display: 'flex', gap: '.8rem', flexWrap: 'wrap', alignItems: 'center'}}>
          {form.colors.map((c, i) => <input key={i} type="color" aria-label={mt('f_color') + ' ' + (i + 1)} value={c} style={{width: '3.6rem', height: '2.6rem', border: '3px solid #111', padding: 0, background: 'none'}}
            onChange={e => set('colors', form.colors.map((x, j) => (j === i ? e.target.value : x)))}/>)}
          <span aria-hidden="true" style={{display: 'inline-flex', height: '2.6rem', border: '3px solid #111'}}>{form.colors.map((c, i) => <i key={i} style={{width: '2.2rem', background: c}}/>)}</span></div></div>
    </div>
    <h3 className="mg-h3">{mt('h_timeline')}</h3>
    <p style={{margin: '0 0 1rem', fontSize: '.9rem', opacity: .85}}>{mt('tl_note')}</p>
    {form.timeline.map((x, i) => <div className="mg-grid" key={i} style={{gridTemplateColumns: '5.5rem 1fr 1fr auto', alignItems: 'end'}}>
      <label className={'mg-lbl' + (errors['tl' + i] ? ' bad' : '')}><span>{mt('f_year')}</span>
        <input className="mg-in" inputMode="numeric" maxLength={4} value={x.y} onChange={e => set('timeline', form.timeline.map((r, j) => (j === i ? {...r, y: e.target.value} : r)))}/></label>
      <label className="mg-lbl"><span>{mt('f_tl_t')}</span>
        <input className="mg-in" maxLength={120} value={x.t} onChange={e => set('timeline', form.timeline.map((r, j) => (j === i ? {...r, t: e.target.value} : r)))}/></label>
      <label className="mg-lbl"><span>{mt('f_tl_en')}</span>
        <input className="mg-in" maxLength={120} value={x.tEn} onChange={e => set('timeline', form.timeline.map((r, j) => (j === i ? {...r, tEn: e.target.value} : r)))}/></label>
      <button type="button" className="mg-mini" style={{width: 'auto', marginBottom: '1rem'}} aria-label={mt('tl_del')} onClick={() => set('timeline', form.timeline.filter((_, j) => j !== i))}>×</button>
      {errors['tl' + i] ? <p className="mg-err wide" role="alert">{mt(errors['tl' + i])}</p> : null}
    </div>)}
    {form.timeline.length < MAX_TIMELINE ? <p><button type="button" className="mg-mini" style={{width: 'auto'}} onClick={() => set('timeline', [...form.timeline, {y: '', t: '', tEn: ''}])}>{mt('tl_add')}</button></p> : null}
    <h3 className="mg-h3">{mt('h_links')}</h3>
    <div className="mg-grid">
      <Field label={mt('f_instagram')} name="instagram" type="url" inputMode="url" placeholder="https://instagram.com/…" wide {...props}/>
    </div>
    <div className="mg-bar"><button type="submit" className="btn" disabled={state === 'saving'}>{mt('save')}</button><SaveState state={state}/></div>
  </form>;
}
