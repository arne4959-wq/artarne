/* Field.jsx — the form pieces of the dashboard. A field shows its error under the box, in red. */
import {useId} from 'react';
import {useMt} from '../../lib/manageStrings.js';

export function Field({label, name, form, set, errors = {}, as = 'input', wide = false, ...rest}) {
  const mt = useMt(), id = useId(), err = errors[name], Tag = as === 'textarea' ? 'textarea' : as === 'select' ? 'select' : 'input';
  const cls = as === 'textarea' ? 'mg-ta' : as === 'select' ? 'mg-sel' : 'mg-in';
  return <label className={'mg-lbl' + (wide ? ' wide' : '') + (err ? ' bad' : '')} htmlFor={id}>
    <span>{label}</span>
    <Tag id={id} className={cls} value={form[name] ?? ''} onChange={e => set(name, e.target.value)} aria-invalid={err ? 'true' : undefined}
      aria-describedby={err ? id + '-e' : undefined} {...rest}/>
    {err && <small id={id + '-e'}>{mt(err)}</small>}
  </label>;
}

export function Check({label, name, form, set}) {
  return <label className="mg-check"><input type="checkbox" checked={!!form[name]} onChange={e => set(name, e.target.checked)}/>{label}</label>;
}

/* the little "saved / failed" line next to a Save button */
export function SaveState({state}) {
  const mt = useMt();
  if (!state) return <span className="mg-ok" role="status"></span>;
  return <span className={'mg-ok' + (state === 'fail' || state === 'fix' ? ' bad' : '')} role="status">
    {state === 'saving' ? mt('saving') : state === 'saved' ? mt('saved') : state === 'fix' ? mt('er_fix') : mt('retry')}</span>;
}
