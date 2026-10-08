#!/usr/bin/env python3
"""Adds pixel-punks.js (pixel artist at work + a visitor who follows you up the building) to cutaway.html and every studio-*.html.
Run from the site folder:  python3 tools/apply-pixel-punks.py      (safe to run again)"""
import os, glob
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE) if os.path.basename(HERE) == 'tools' else os.getcwd()
TAG = '<script src="pixel-punks.js"></script>\n'
for f in [os.path.join(ROOT, 'cutaway.html')] + sorted(glob.glob(os.path.join(ROOT, 'studio-*.html'))):
    s = open(f, encoding='utf-8').read()
    if 'pixel-punks.js' in s: print('  ok', os.path.basename(f)); continue
    if s.count('</body>') != 1: raise SystemExit('!! ' + os.path.basename(f) + ': </body> not found once')
    open(f, 'w', encoding='utf-8').write(s.replace('</body>', TAG + '</body>')); print('  updated', os.path.basename(f))
print('done. (pixel-punks.js itself must sit next to the pages)')
