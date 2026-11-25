#!/bin/bash
# בונה את אתר "מי המתחזה? פרו" מתוך קבצי האתר הרגיל (MAIN) + src/pro.js, ישירות לתיקיית המאגר הזה.
# שימוש:  bash src/build.sh <תיקיית-האתר-הרגיל>
set -e
MAIN="$1"; [ -f "$MAIN/index.html" ] || { echo "usage: bash src/build.sh <main-site-dir>"; exit 1; }
HERE="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$HERE"
for f in index.html engine.js map.js config.js i18n.js peerjs.min.js manifest.webmanifest icon.svg icon-192.png icon-512.png apple-touch-icon.png og.png iphone.html; do cp "$MAIN/$f" "$OUT/$f"; done
cp "$HERE"/src/icons/* "$OUT"/
cat "$HERE/src/pro.js" "$HERE/src/music.js" > "$OUT/pro.js"
cp "$HERE/src/sw.js" "$OUT/sw.js"
cat "$HERE/src/threed.js" "$HERE/src/threed-props.js" > "$OUT/threed.js"
cat "$HERE"/src/arcade/*.js > "$OUT/arcade.js"
python3 - "$OUT" <<'PY'
import sys,re
out=sys.argv[1]
p=out+'/index.html'; s=open(p,encoding='utf-8').read()
s=s.replace('<title>מי המתחזה? – משחק חשיפה חברתי בעברית, חינם בדפדפן</title>','<title>מי המתחזה? פרו 👑</title>\n<meta name="robots" content="noindex,nofollow">',1)
s=re.sub(r'<link rel="canonical"[^>]*>\n','',s)
s=re.sub(r'<meta property="og:[^>]*>\n','',s)
s=re.sub(r'<meta name="twitter:[^>]*>\n','',s)
s=re.sub(r'<meta name="description"[^>]*>\n','<meta name="description" content="מי המתחזה? פרו – גרסה מוגדלת לחברים">\n',s,1)
s=s.replace('apple-mobile-web-app-title" content="מי המתחזה"','apple-mobile-web-app-title" content="מי המתחזה פרו"',1)
i=s.index('<script'); s=s[:i]+'<script src="pro.js"></script>\n'+s[i:]
j=s.rindex('</body>'); s=s[:j]+'<script src="arcade.js"></script>\n'+s[j:]
open(p,'w',encoding='utf-8').write(s)
m=out+'/manifest.webmanifest'; t=open(m,encoding='utf-8').read().replace('"name": "מי המתחזה?"','"name": "מי המתחזה? פרו"').replace('"short_name": "מי המתחזה"','"short_name": "מתחזה פרו"'); open(m,'w',encoding='utf-8').write(t)
PY
echo "built $OUT"
