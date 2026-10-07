#!/usr/bin/env python3
"""Baut knallmania/index.html: Vorlage + Libs + alle src/*.js zu EINER Datei (läuft offline)."""
import glob, os, re, sys

root = os.path.dirname(os.path.abspath(__file__))
tpl = open(os.path.join(root, 'src', 'template.html'), encoding='utf-8').read()

vendor = ''
for f in ('three.min.js', 'cannon.min.js'):
    vendor += '<script>' + open(os.path.join(root, 'vendor', f), encoding='utf-8').read().replace('</script', '<\\/script') + '</script>\n'

game = ''
for f in sorted(glob.glob(os.path.join(root, 'src', '[0-9]*.js'))):
    game += '\n/* ---- %s ---- */\n' % os.path.basename(f)
    game += open(f, encoding='utf-8').read()

out = tpl.replace('<!--SCRIPTS-->', vendor + '<script>\n' + game.replace('</script', '<\\/script') + '\n</script>')
dst = os.path.join(root, 'index.html')
open(dst, 'w', encoding='utf-8').write(out)
print('index.html geschrieben: %.0f KB' % (len(out.encode('utf-8')) / 1024))
