/* forms.js — sending messages, from circles.js (deliver, subscribeNews). Endpoint if configured, otherwise the visitor's email app. */
import {CONFIG} from 'virtual:circles/config';

export async function deliver(kind, to, subject, fields) {
  to = to || CONFIG.contact;   // an artist from the database has no public address: the message goes to the site's own contact
  const body = Object.entries(fields).filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`).join('\n');
  if (CONFIG.endpoint) {
    try {
      const r = await fetch(CONFIG.endpoint, {method: 'POST', headers: {'Content-Type': 'application/json', Accept: 'application/json'}, body: JSON.stringify({kind, to, subject, ...fields})});
      if (r.ok) return {mode: 'sent', body};
    } catch (e) {}
    return {mode: 'fail', body};
  }
  location.href = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  return {mode: 'mailto', body, to, subject};
}

/* newsletter: returns the toast key to show, or '' when nothing should happen (honeypot / empty) */
export async function subscribeNews(form) {
  if (form.querySelector('.hp-n')?.value) return '';          // honeypot: bots fill every field
  const email = form.querySelector('input[type=email]').value.trim(); if (!email) return '';
  if (CONFIG.endpoint) {
    const res = await deliver('newsletter', CONFIG.contact, 'newsletter', {email});
    if (res.mode === 'sent') form.reset();
    return res.mode === 'sent' ? 'news_sent' : 'news_fail';
  }
  try { const list = JSON.parse(localStorage.getItem('circles-news') || '[]'); if (!list.includes(email)) list.push(email); localStorage.setItem('circles-news', JSON.stringify(list)); } catch (e) {}
  form.reset();
  return 'news_saved';
}
