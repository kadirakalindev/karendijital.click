#!/bin/bash
export PATH=/usr/local/bin:/opt/plesk/node/24/bin:$PATH
export HOME=/root

cd /var/www/vhosts/karendijital.click/httpdocs

echo "=== Deploy Started ===" > /tmp/deploy.log 2>&1
date >> /tmp/deploy.log 2>&1

echo "Node: $(node -v)" >> /tmp/deploy.log 2>&1
echo "NPM: $(npm -v)" >> /tmp/deploy.log 2>&1

npm install >> /tmp/deploy.log 2>&1
npx prisma generate >> /tmp/deploy.log 2>&1
npm run build >> /tmp/deploy.log 2>&1
pm2 restart karendijital >> /tmp/deploy.log 2>&1 || PORT=3000 pm2 start server.js --name "karendijital" >> /tmp/deploy.log 2>&1

echo "=== Deploy Finished ===" >> /tmp/deploy.log 2>&1
