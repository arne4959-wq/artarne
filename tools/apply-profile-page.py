#!/usr/bin/env python3
"""tools/apply-profile-page.py - writes profile.html (the template of every profile-<id>.html) from cutaway.html, so the nav, footer,
language switch, toast and lite mode stay the same code. Idempotent: the output depends only on cutaway.html; running it twice changes nothing.
profile-<id>.html itself is made by `node tools/build.mjs`, not by this script."""
import re, sys
src = open('cutaway.html', encoding='utf-8').read()
def cut(a, b, s=src):
    i = s.index(a); j = s.index(b, i); return s[i:j]
head = cut('<!DOCTYPE html>', '<style>')
style = cut('<style>', '/* the cutaway: one floor per work.')
foot_css = '\n'.join(re.findall(r'^\.mini-foot[^\n]*$', src, flags=re.M))          # base + noir footer rules, in file order
extra = """/* touch screens have no real hover */
@media(hover:none){.links .join:hover{transform:none;box-shadow:4px 4px 0 var(--black);}}
@media(max-width:860px){nav{padding:.8rem 1rem}.links a:not(.join){display:none}}
@media(max-width:480px){nav .brand{font-size:1.45rem;gap:.45rem;letter-spacing:.07em;}nav .brand svg{width:30px;height:30px;}nav .links{gap:.5rem;}}
@media(prefers-reduced-motion:reduce){*,*::before,*::after{animation-duration:.001ms!important;animation-iteration-count:1!important;transition-duration:.001ms!important;scroll-behavior:auto!important;}}
</style>
</head>
"""
head = head.replace('<link rel="stylesheet" href="museum.css">\n', '').replace('<link rel="stylesheet" href="profile.css">\n', '')
head = head.replace('<link rel="stylesheet" href="circles.css">', '<link rel="stylesheet" href="circles.css">\n<link rel="stylesheet" href="blade.css">\n<link rel="stylesheet" href="profile.css">')
head = re.sub(r'<title>[^<]*</title>', '<title>โปรไฟล์ศิลปิน — circles</title>', head)
head = re.sub(r'(<meta (?:name="description"|property="og:description"|name="twitter:description") content=")[^"]*(")', r'\1รู้จักศิลปินของ circles ผลงานและแนวคิด\2', head)
head = re.sub(r'(<meta (?:property="og:title"|name="twitter:title") content=")[^"]*(")', r'\1โปรไฟล์ศิลปิน — circles\2', head)
body = cut('<body', '<main id="main">')
body = re.sub(r'<body class="noir">', '<body>', body)
foot = cut('<footer class="mini-foot">', '</footer>') + '</footer>\n'
script = """
<script src="artists.js"></script>
<script src="circles.js"></script>
<script src="profile.js"></script>
<script>
const params = new URLSearchParams(location.search);
const wantId = params.get('id') || (document.querySelector('#main[data-profile]') || {dataset: {}}).dataset.profile || 'napha';
const A = artistById(wantId);
const main = $('#main');
function render() {
  if (!A) {
    main.innerHTML = `<section class="nf"><h1>${esc(t('nf_h'))}</h1><p>${esc(t('nf_p'))}</p><a class="btn pk" href="index.html#city">${esc(t('cw_back'))}</a></section>`;
    setMeta(t('nf_h') + ' — circles', t('nf_p')); return;
  }
  PF.mount(main, A);
  setMeta(t('title_pf', {a: nameL(A)}), t('desc_pf', {a: nameL(A), d: discL(A)}));
}
onLang(render);
render();
wireNav(); applyLang();
</script>
</body>
</html>
"""
noscript = '<main id="main"><noscript><section class="nf"><h1>circles</h1><p><a href="index.html">← circles</a></p></section></noscript></main>\n\n'
out = head + style.rstrip('\n') + '\n' + foot_css + '\n' + extra + body + noscript + foot + script
if out != open('profile.html', encoding='utf-8').read() if __import__('os').path.exists('profile.html') else True:
    open('profile.html', 'w', encoding='utf-8').write(out); print('wrote profile.html', len(out), 'bytes')
else:
    print('profile.html already up to date')
