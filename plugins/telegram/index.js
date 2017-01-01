/**
 * Telegram plugin
 *
 * Notifies all events (up, down, paused, restarted) by Telegram messenger
 *
 * Installation
 * ------------
 * This plugin is disabled by default. To enable it, add its entry 
 * to the `plugins` key of the configuration:
 *
 *   // in config/production.yaml
 *   plugins:
 *     - ./plugins/telegram
 *
 * Usage
 * -----
 * This plugin sends an email each time a check is started, goes down, or goes back up. 
 * When the check goes down, the email contains the error details:
 *
 *   Object: [Down] Check "FooBar" just went down
 *   On Thursday, September 4th 1986 8:30 PM,
 *   a test on URL "http://foobar.com" failed with the following error:
 *
 *     Error 500
 *
 *   Uptime won't send anymore emails about this check until it goes back up.
 *   ---------------------------------------------------------------------
 *   This is an automated email sent from Uptime. Please don't reply to it.
 *
 * Configuration
 * -------------
 * Here is an example configuration:
 *
 *   // in config/production.yaml
 *   telegram:
 *     app_key: # Telegram bot api key
 *     chat_id: # target chat id
 */
var fs         = require('fs');
var moment     = require('moment');
var CheckEvent = require('../../models/checkEvent');
var ejs        = require('ejs');
var telegram   = require('node-telegram-bot-api');

exports.initWebApp = function(options) {
  var config = options.config.telegram;
  var bot = new telegram(config.api_key);
  var templateDir = __dirname + '/views/';

  CheckEvent.on('afterInsert', function(checkEvent) {
    if (!config.event[checkEvent.message]) return;
    checkEvent.findCheck(function(err, check) {
      if (err) return console.error(err);
      var filename = templateDir + checkEvent.message + '.ejs';
      var renderOptions = {
        check: check,
        checkEvent: checkEvent,
        url: options.config.url,
        moment: moment,
        filename: filename
      };
      var lines = ejs.render(fs.readFileSync(filename, 'utf8'), renderOptions).split('\n');

      bot.sendMessage(config.chat_id, lines.join('\n'))
        .then(function(res){
          console.log('Notified event by Telegram: Check ' + check.name + ' ' + checkEvent.message);
        })
        .catch(function(res){
          console.error('Telegram plugin error: %s', res);
        });
    });
  });
  console.log('Enabled Telegram notifications');
};
