#!/bin/sh
# Starts Expo in a GitHub Codespace without ngrok (--tunnel), which often
# fails with "failed to start tunnel". Instead the phone reaches Metro through
# the Codespace's own forwarded address for port 8081, which must be set to
# Public in the Ports tab (the script tries to do that for you).
set -e
if [ -z "$CODESPACE_NAME" ]; then
  echo "Not in a GitHub Codespace: use 'npx expo start --tunnel' or 'npx expo start' on the same Wi-Fi."
  exit 1
fi
DOMAIN="${GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN:-app.github.dev}"
URL="https://${CODESPACE_NAME}-8081.${DOMAIN}"
# Make port 8081 public so the phone can reach it (needs the gh CLI; if this
# fails, set it by hand: Ports tab > 8081 > right click > Port Visibility > Public).
(sleep 15 && gh codespace ports visibility 8081:public -c "$CODESPACE_NAME" >/dev/null 2>&1 && echo "Port 8081 set to Public") &
echo ""
echo "Phone address: ${URL}"
echo "In Expo Go scan the QR code below, or tap 'Enter URL manually' and type:"
echo "  exps://${CODESPACE_NAME}-8081.${DOMAIN}"
echo ""
EXPO_PACKAGER_PROXY_URL="$URL" exec npx expo start --clear --port 8081 "$@"
