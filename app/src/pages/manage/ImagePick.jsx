/* ImagePick.jsx — choose a picture, shrink it in the browser, upload it to a Storage bucket under <artist_id>/, hand back the public URL.
   The folder is checked by the database rules: an artist can only write into their own. */
import {useState} from 'react';
import {useMt} from '../../lib/manageStrings.js';
import {supabase} from '../../lib/supabase.js';
import {prepareImage} from '../../lib/image.js';
import {fileKey} from '../../lib/manage.js';

/* → {path, url, ratio} */
export async function uploadPicture(file, {bucket, artistId, max, png, limit}) {
  const {blob, ext, ratio} = await prepareImage(file, {max, png, limit});
  const path = `${artistId}/${fileKey(ext)}`, sb = supabase();
  const {error} = await sb.storage.from(bucket).upload(path, blob, {contentType: blob.type, cacheControl: '31536000', upsert: false});
  if (error) throw new Error('upload');
  return {path, url: sb.storage.from(bucket).getPublicUrl(path).data.publicUrl, ratio};
}

export default function ImagePick({src, ar = '1/1', bucket, artistId, onDone, max = 1600, png = false, limit, label, qr = false}) {
  const mt = useMt(), [busy, setBusy] = useState(false), [err, setErr] = useState('');
  async function pick(e) {
    const file = e.target.files && e.target.files[0]; e.target.value = '';
    if (!file) return;
    setBusy(true); setErr('');
    try { onDone(await uploadPicture(file, {bucket, artistId, max, png, limit})); }
    catch (x) { setErr({bad_type: 'er_bad_type', too_big: 'er_too_big', bad_image: 'er_bad_image'}[x.message] || 'er_upload'); }
    setBusy(false);
  }
  return <div className="mg-up">
    <div className={'mg-pic' + (qr ? ' mg-qr' : '')} style={{'--ar': ar}}>{src ? <img src={src} alt=""/> : <span>{qr ? mt('p_qr_none') : mt('img_none')}</span>}</div>
    <div style={{flex: '1 1 220px'}}>
      <label className="mg-file">{busy ? mt('img_up') : src ? mt('img_change') : label || mt('img_pick')}
        <input type="file" accept="image/jpeg,image/png,image/webp" onChange={pick} disabled={busy}/></label>
      {err && <p className="mg-err" role="alert" style={{marginTop: '.6rem', marginBottom: 0}}>{mt(err)}</p>}
    </div>
    {!qr && <small>{mt('img_note')}</small>}
  </div>;
}
