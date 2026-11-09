"""Збирає гру з модулів src/ в один index.html (готовий для Vercel / GitHub Pages)."""
import os, glob
root = os.path.dirname(os.path.abspath(__file__))
head = open(os.path.join(root, 'src', '00-head.html'), encoding='utf-8').read()
import base64
logo = 'data:image/svg+xml;base64,' + base64.b64encode(open(os.path.join(root,'src','assets','logo.svg'),'rb').read()).decode()
js = 'const LOGO_URL="' + logo + '";\n' + ''.join(open(f, encoding='utf-8').read() + '\n' for f in sorted(glob.glob(os.path.join(root, 'src', '*.js'))))
page = ('<!doctype html>\n<html lang="uk">\n<head>\n<meta charset="utf-8">\n'
        '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n'
        '<meta name="description" content="Relic Quest — 3D-гра про дослідника артефактів у стилі туристичного скрапбука.">\n'
        '<style>:root{padding-top:env(safe-area-inset-top);padding-bottom:env(safe-area-inset-bottom)}body{margin:0;font:14px system-ui}img{max-width:100%}</style>\n'
        '</head>\n<body>\n' + head + '<script>\n' + js + '</script>\n</body>\n</html>\n')
open(os.path.join(root, 'index.html'), 'w', encoding='utf-8').write(page)
print('ok', len(page), 'bytes')
