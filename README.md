# SlackBot
*Easily extendable node.js based slack bot.*

## Features
- Create a simple class to add a new message handler.
- Simply call message.respond(message) to respond to messages.

## Configuring
- copy `_config.js` to `config.js` and replace with your own info
- `npm install` to install the dependencies
- `npm run bot` to start it

### Keep the server running using PM2
- `npm install pm2 --global`
- `pm2 install pm2-logrotate`
- `pm2 set pm2-logrotate:max_size 10M`
- `pm2 set pm2-logrotate:retain 7`
- `pm2 set pm2-logrotate:interval_unit DD`
- `pm2 start bot.js --interpreter ./node_modules/.bin/babel-node`
- `pm2 startup`
- `pm2 save`

### PM2 helpful commands
- `pm2 list`
- `pm2 show server`
- `pm2 monit`
- `pm2 logs`
- `pm2 logs --out --lines 20 --timestamp`
- `pm2 stop server`
- `pm2 restart server`
- `pm2 delete server`

## Docs
- [Bot users](https://api.slack.com/bot-users)
- [Slack Real Time Messaging API](https://api.slack.com/rtm)
- [Message event](hhttps://api.slack.com/events/message)