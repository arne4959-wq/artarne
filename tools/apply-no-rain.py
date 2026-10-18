#!/usr/bin/env python3
"""tools/apply-no-rain.py - removes the falling-rain overlay from the studio pages (cutaway.html + studio-*.html).
Idempotent: removes the comment line, the .tower-wrap::after rain rule and @keyframes rain; running it again changes nothing.
The light-ray ::before and everything else stay as they are."""
import glob, re, sys
files = ['cutaway.html'] + sorted(glob.glob('studio-*.html'))
tot = 0
for f in files:
    s = open(f, encoding='utf-8').read()
    o = s
    s = re.sub(r'^/\* rain outside the building:[^\n]*\*/\n', '', s, flags=re.M)
    s = re.sub(r'^\.tower-wrap::after\{[^\n]*animation:\s*rain[^\n]*\}\n', '', s, flags=re.M)
    s = re.sub(r'^@keyframes rain\{[^\n]*\}\n', '', s, flags=re.M)
    s = s.replace('night, rain, blinds of light', 'night, blinds of light')
    if s != o:
        open(f, 'w', encoding='utf-8').write(s); tot += 1; print('patched', f)
left = [f for f in files if re.search(r'keyframes rain|animation:\s*rain', open(f, encoding='utf-8').read())]
print('files changed:', tot, '| files still containing rain:', left or 'none')
sys.exit(1 if left else 0)
