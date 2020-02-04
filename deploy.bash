cd gitcoin-enterprise
git stash
git pull
cd server
npm i
rm -rf dist
npm run build
cd ../client
npm i
npm run build-prod
rm -rf ../server/docs
cp -r ./docs ../server/ 
mv ../server/docs/index.html ../server/docs/i-want-compression-via-route.html
pm2 restart gitcoin-enterprise-server