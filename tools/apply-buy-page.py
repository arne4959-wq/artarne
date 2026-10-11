#!/usr/bin/env python3
"""tools/apply-buy-page.py - writes buy.html (the template of every buy-<id>-<k>.html) from profile.html (which apply-profile-page.py makes from
cutaway.html), so nav, footer, TH/EN, toast and lite mode stay the same code. Run apply-profile-page.py first.
Idempotent: the output depends only on profile.html; running it twice changes nothing. buy-<id>-<k>.html itself comes from `node tools/build.mjs`."""
import os, re, sys
src = open('profile.html', encoding='utf-8').read()
out = src.replace('<link rel="stylesheet" href="profile.css">', '<link rel="stylesheet" href="buy.css">')
out = out.replace('<script src="profile.js"></script>', '<script src="buy.js"></script>')
out = re.sub(r'<title>[^<]*</title>', '<title>ซื้อผลงาน — circles</title>', out)
out = re.sub(r'(<meta (?:name="description"|property="og:description"|name="twitter:description") content=")[^"]*(")', r'\1ซื้อผลงานตรงจากศิลปิน ไม่มีคนกลาง\2', out)
out = re.sub(r'(<meta (?:property="og:title"|name="twitter:title") content=")[^"]*(")', r'\1ซื้อผลงาน — circles\2', out)
i = out.index('<script>\nconst params'); j = out.index('</script>', i) + len('</script>')
script = """<script>
const params = new URLSearchParams(location.search);
const mainEl = document.querySelector('#main[data-buy-id]');
const wantId = params.get('id') || (mainEl && mainEl.dataset.buyId) || 'napha';
const k = parseInt(params.get('k') ?? (mainEl && mainEl.dataset.buyK) ?? '0', 10);
const A = artistById(wantId), P = A && Number.isInteger(k) ? A.pieces[k] : null;
const main = $('#main');
function render() {
  if (!P) {
    main.innerHTML = `<section class="nf"><h1>${esc(t('nf_h'))}</h1><p>${esc(t('nf_p'))}</p><a class="btn pk" href="index.html#city">${esc(t('cw_back'))}</a></section>`;
    setMeta(t('nf_h') + ' — circles', t('nf_p')); return;
  }
  BUY.mount(main, A, k);
  setMeta(t('title_by', {t: pk(P, 't'), a: nameL(A)}), t('desc_by', {t: pk(P, 't'), a: nameL(A), d: discL(A), p: usd(P.p)}));
}
onLang(render);
render();
wireNav(); applyLang();
</script>"""
out = out[:i] + script + out[j:]
if not os.path.exists('buy.html') or open('buy.html', encoding='utf-8').read() != out:
    open('buy.html', 'w', encoding='utf-8').write(out); print('wrote buy.html', len(out), 'bytes')
else:
    print('buy.html already up to date')
