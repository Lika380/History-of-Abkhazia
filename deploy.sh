#!/usr/bin/env bash
set -euo pipefail

HOST="root@62.113.37.206"
SSH_KEY="$HOME/.ssh/abkhazia_vps"
REMOTE_DIR="/var/www/abkhazia"

cd "$(dirname "$0")"

echo "==> Building client"
npm --prefix client run build

echo "==> Building server"
npm --prefix server run build

echo "==> Syncing client build"
rsync -az --delete -e "ssh -i $SSH_KEY" client/dist/ "$HOST:$REMOTE_DIR/client/dist/"

echo "==> Syncing server build"
rsync -az --delete -e "ssh -i $SSH_KEY" server/dist/ "$HOST:$REMOTE_DIR/server/dist/"
rsync -az -e "ssh -i $SSH_KEY" server/package.json server/package-lock.json "$HOST:$REMOTE_DIR/server/"

echo "==> Installing production deps and restarting on server"
ssh -i "$SSH_KEY" "$HOST" "cd $REMOTE_DIR/server && npm ci --omit=dev && (pm2 restart abkhazia-server || pm2 start dist/index.js --name abkhazia-server --cwd $REMOTE_DIR/server) && pm2 save"

echo "==> Done"
