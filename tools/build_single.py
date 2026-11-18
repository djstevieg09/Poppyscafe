# Builds a single self-contained HTML file (for previews / sharing):
#   npx esbuild src/main.js --bundle --format=iife --minify --outfile=dist/game.min.js
#   python3 tools/build_single.py dist/game.min.js dist/poppys-cafe-rush.html
import re, sys
root = __file__.rsplit('/tools/', 1)[0]
js = open(sys.argv[1]).read().replace('</script', '<\\/script')
html = open(root + '/index.html').read()
html = re.sub(r'<!doctype html>\s*<html[^>]*>\s*<head>\s*', '', html, flags=re.I)
html = re.sub(r'<meta charset[^>]*>\s*<meta name="viewport"[^>]*>\s*', '', html)
html = html.replace('</head>\n<body>\n', '').replace('</body>\n</html>\n', '')
html = html.replace('<script type="module" src="src/main.js"></script>', '<script>' + js + '</script>')
open(sys.argv[2], 'w').write(html)
