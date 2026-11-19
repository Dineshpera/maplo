#!/bin/sh
# Render the PNG app icons and the link-preview image from tools/assets/*.html with headless Chrome.
# Run after changing the logo:  sh tools/make_assets.sh
set -e
cd "$(dirname "$0")/.."
CHROME="${CHROME:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"
OUT=site/icons
A="file://$PWD/tools/assets"
shot() { # size_w size_h url out
  "$CHROME" --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=1 \
    --default-background-color=00000000 --virtual-time-budget=6000 \
    --window-size="$1,$2" --screenshot="$4" "$3" >/dev/null 2>&1
  echo "wrote $4"
}
# Chrome has a minimum window size, so small icons are rendered at 512 and shrunk with macOS sips.
shot 512 512 "$A/icon.html?v=any" $OUT/icon-512.png
shot 512 512 "$A/icon.html?v=maskable" $OUT/icon-maskable-512.png
shot 512 512 "$A/icon.html?v=apple" $OUT/apple-touch-icon.png
sips -z 192 192 $OUT/icon-512.png --out $OUT/icon-192.png >/dev/null && echo "wrote $OUT/icon-192.png"
sips -z 32 32 $OUT/icon-512.png --out $OUT/favicon-32.png >/dev/null && echo "wrote $OUT/favicon-32.png"
sips -z 180 180 $OUT/apple-touch-icon.png >/dev/null && echo "resized $OUT/apple-touch-icon.png"
shot 1200 630 "$A/og.html" $OUT/og.png
