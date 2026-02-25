## Device Detector
* run app using pm2. app is already set to auto run everytime the machine starts.
- `pm2 start Projects/device-detector/bin/device-detector`, execute this command if pm2 failed to start
- restart app `pm2 restart 0` or `pm2 restart device-detector`, execute this command if app needs manual restart
- `pm2 log 0` or `pm2 log device-detector`, execute this command incase you want to monitor the app logs
* run app
- `npm run start` or `node ./bin/device-detector`
* email notifications and app location can be change on every location, this can be set under `.env` file.
- `nano Projects/device-detector/.env` find `officeLocation=""` in line 19.