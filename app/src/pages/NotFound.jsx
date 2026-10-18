/* 404.html — its own small page (no nav, no sprite); English unless the browser is Thai, like the old one */
import {useEffect} from 'react';
import PageShell from '../components/PageShell.jsx';
import styles from '../styles/notFound.js';

export default function NotFound() {
  const th = String(navigator.language || 'th').toLowerCase().startsWith('th');
  useEffect(() => { document.title = '404 — circles'; }, []);
  return <PageShell styles={styles}>
    <main>
      <div className="big" aria-hidden="true"><span>4</span><span>0</span><span>4</span></div>
      <h1 id="h">{th ? 'ตึกนี้ยังไม่ได้สร้าง' : "This building doesn't exist yet"}</h1>
      <p id="p">{th ? 'หน้าที่คุณหาไม่มีอยู่ในเมือง กลับไปเดินดูตึกที่มีอยู่แล้วกัน' : "The page you're looking for isn't in the city. Go back and walk the buildings that are."}</p>
      <a className="btn" id="b" href="index.html#city">{th ? '← กลับไปเมือง' : '← Back to the city'}</a>
    </main>
    <div className="tape" aria-hidden="true"></div>
  </PageShell>;
}
