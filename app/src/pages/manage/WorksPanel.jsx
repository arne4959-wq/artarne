/* WorksPanel.jsx — the artist's works: a card each (edit, delete) and one form to add or change a work. Nothing is sold: no price, no status. */
import {useCallback, useEffect, useState} from 'react';
import {useLang} from '../../lib/i18n.jsx';
import {useMt} from '../../lib/manageStrings.js';
import {supabase} from '../../lib/supabase.js';
import {emptyWork, workToForm, formToWork, nextPosition} from '../../lib/manage.js';
import {Field, SaveState} from './Field.jsx';
import ImagePick from './ImagePick.jsx';

const MAX_WORKS = 40;

export default function WorksPanel({artist}) {
  const mt = useMt(), {lang} = useLang();
  const [works, setWorks] = useState(null), [fail, setFail] = useState(false), [editing, setEditing] = useState(null), [sure, setSure] = useState(''), [msg, setMsg] = useState('');
  const load = useCallback(async () => {
    setFail(false);
    const {data, error} = await supabase().from('works').select('*').eq('artist_id', artist.id).order('position');
    if (error) setFail(true); else setWorks(data);
  }, [artist.id]);
  useEffect(() => { load(); }, [load]);

  async function remove(w) {
    if (sure !== w.id) { setSure(w.id); return; }
    const {error} = await supabase().from('works').delete().eq('id', w.id);
    setSure('');
    if (error) setMsg('retry'); else setWorks(ws => ws.filter(x => x.id !== w.id));
  }

  if (fail) return <div className="mg-bad" role="alert">{mt('load_fail')} <button type="button" className="mg-mini" style={{width: 'auto', marginLeft: '.6rem'}} onClick={load}>{mt('reload')}</button></div>;
  if (!works) return <p role="status" className="mg-status">{mt('loading')}</p>;
  if (editing) return <WorkForm artist={artist} work={editing === 'new' ? null : editing} nextPos={nextPosition(works)}
    onCancel={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }}/>;

  const title = w => (lang === 'en' && w.title_en) || (lang === 'lo' && w.title_lo) || w.title;
  return <>
    <div className="mg-bar" style={{marginTop: 0, marginBottom: '1.6rem'}}>
      <button type="button" className="btn" disabled={works.length >= MAX_WORKS} onClick={() => setEditing('new')}>{mt('w_add')}</button>
      {works.length >= MAX_WORKS && <span className="mg-ok bad">{mt('w_limit')}</span>}
      {msg && <span className="mg-ok bad" role="alert">{mt(msg)}</span>}
    </div>
    {works.length === 0 ? <p className="mg-empty">{mt('w_none')}</p> :
      <ul className="mg-works" style={{listStyle: 'none'}}>
        {works.map(w => <li key={w.id} className="mg-work">
          <div className="mg-pic" style={{'--ar': w.ar}}>{w.img ? <img src={w.img} alt={title(w)} loading="lazy"/> : <span>{mt('img_none')}</span>}</div>
          <div className="mg-wbody">
            <b>{title(w)}</b>
            <span className="meta">{w.year || ''}</span>
            {w.hidden && <span className="mg-ok bad" role="status">{mt('w_hidden')}</span>}
            <div className="mg-acts">
              <button type="button" className="mg-mini" onClick={() => setEditing(w)}>{mt('w_edit')}</button>
              <button type="button" className="mg-mini del" data-sure={sure === w.id ? '' : undefined} onClick={() => remove(w)} onBlur={() => setSure('')}>{sure === w.id ? mt('w_del_sure') : mt('w_del')}</button>
            </div>
          </div>
        </li>)}
      </ul>}
  </>;
}

function WorkForm({artist, work, nextPos, onCancel, onSaved}) {
  const mt = useMt();
  const [form, setForm] = useState(() => (work ? workToForm(work) : emptyWork())), [errors, setErrors] = useState({}), [state, setState] = useState('');
  const needRights = !work || !work.rights_confirmed_at, [own, setOwn] = useState(false);
  const set = (k, v) => { setForm(f => ({...f, [k]: v})); setState(''); };
  const props = {form, set, errors};

  async function save(e) {
    e.preventDefault();
    const r = formToWork(form);
    if (needRights && !own) { setErrors({...(r.errors || {}), own: 'er_own'}); setState('fix'); return; }
    if (r.errors) { setErrors(r.errors); setState('fix'); return; }
    if (needRights) r.row.rights_confirmed_at = new Date().toISOString();
    setErrors({}); setState('saving');
    const q = supabase().from('works');
    const {error} = work ? await q.update(r.row).eq('id', work.id) : await q.insert({...r.row, artist_id: artist.id, position: nextPos});
    if (error) { setState('fail'); return; }
    onSaved();
  }

  return <form className="mg-panel" onSubmit={save} noValidate>
    <h2>{work ? mt('w_editing') : mt('w_new')}</h2>
    <p className="mg-note">{mt('rules_note')}</p>
    <ImagePick src={form.img} ar={form.ar} bucket="art" artistId={artist.id} onDone={({url, ratio}) => { set('img', url); set('ar', ratio); }}/>
    <h3 className="mg-h3">{mt('h_wbasic')}</h3>
    <div className="mg-grid">
      <Field label={mt('f_title')} name="title" maxLength={120} {...props}/>
      <Field label={mt('f_title_en')} name="title_en" maxLength={120} {...props}/>
      <Field label={mt('f_title_lo')} name="title_lo" maxLength={120} {...props}/>
      <Field label={mt('f_year')} name="year" inputMode="numeric" maxLength={4} {...props}/>
      <Field label={mt('f_medium')} name="medium" maxLength={120} {...props}/>
      <Field label={mt('f_medium_en')} name="medium_en" maxLength={120} {...props}/>
      <Field label={mt('f_medium_lo')} name="medium_lo" maxLength={120} {...props}/>
      <Field label={mt('f_size')} name="size" maxLength={60} {...props}/>
      <Field label={mt('f_size_lo')} name="size_lo" maxLength={60} {...props}/>
      <Field label={mt('f_ar')} name="ar" maxLength={7} {...props}/>
    </div>
    <h3 className="mg-h3">{mt('h_wtext')}</h3>
    <div className="mg-grid">
      <Field label={mt('f_quote')} name="quote" maxLength={300} {...props}/>
      <Field label={mt('f_quote_en')} name="quote_en" maxLength={300} {...props}/>
      <Field label={mt('f_quote_lo')} name="quote_lo" maxLength={300} {...props}/>
      <span className="wide"></span>
      <Field label={mt('f_story')} name="story" as="textarea" wide maxLength={3000} {...props}/>
      <Field label={mt('f_story_en')} name="story_en" as="textarea" wide maxLength={3000} {...props}/>
      <Field label={mt('f_story_lo')} name="story_lo" as="textarea" wide maxLength={3000} {...props}/>
    </div>
    <h3 className="mg-h3">{mt('h_wtell')}</h3>
    <p className="mg-note">{mt('tell_note')}</p>
    <div className="mg-grid">
      <Field label={mt('f_say')} name="say" maxLength={300} {...props}/>
      <Field label={mt('f_say_en')} name="say_en" maxLength={300} {...props}/>
      <Field label={mt('f_say_lo')} name="say_lo" maxLength={300} {...props}/>
      <span className="wide"></span>
      <Field label={mt('f_why')} name="why" as="textarea" wide maxLength={1500} {...props}/>
      <Field label={mt('f_why_en')} name="why_en" as="textarea" wide maxLength={1500} {...props}/>
      <Field label={mt('f_why_lo')} name="why_lo" as="textarea" wide maxLength={1500} {...props}/>
      <Field label={mt('f_look')} name="look" as="textarea" wide maxLength={800} {...props}/>
      <Field label={mt('f_look_en')} name="look_en" as="textarea" wide maxLength={800} {...props}/>
      <Field label={mt('f_look_lo')} name="look_lo" as="textarea" wide maxLength={800} {...props}/>
    </div>
    {needRights && <label className="mg-own"><input type="checkbox" checked={own} onChange={e => { setOwn(e.target.checked); setState(''); setErrors(x => ({...x, own: undefined})); }}/> {mt('own_check')}
      {errors.own && <span className="mg-ok bad" role="alert"> {mt(errors.own)}</span>}</label>}
    <div className="mg-bar">
      <button type="submit" className="btn" disabled={state === 'saving'}>{mt('save')}</button>
      <button type="button" className="btn ghost" onClick={onCancel}>{mt('w_cancel')}</button>
      <SaveState state={state}/>
    </div>
  </form>;
}
