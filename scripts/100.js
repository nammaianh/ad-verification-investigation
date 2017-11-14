'use strict';

const { promisify } = require('util');
const fs = require('fs');
const appendFile = promisify(fs.appendFile);
const path = require('path');
const events = require('events');
const launcher = require('./common/launcher');
const checkAutoRedirection = require('./common/checkAutoRedirection');
const checkPopup = require('./common/checkPopup');

events.EventEmitter.defaultMaxListeners = 0;

(async function run() {

    while (true) {
        try {
            const promises = [];

            const now = Date.now();
            for (let i = 0; i < 5; ++i) {
                promises.push(launcher.launch().then(async ({ browser, page }) => {
                    // return checkAutoRedirection(browser, page);
                    const result = await checkPopup(browser, page);
                    await browser.close();
                    return result;
                }));
            }

            const results = await Promise.all(promises);
            const then = Date.now();
            const period = then - now;

            const logMsg =
                `---------- ${new Date()} ----------\n` +
                `> Passed count: ${results.filter(result => result === true).length}\n` +
                `> Failed count: ${results.filter(result => result === false).length}\n` +
                `> Period: ${period / 1000} sec\n`;

            // Write log to console
            console.log(logMsg);

            // Write log to file
            appendFile(path.join(__dirname, '../logs/100.log'), logMsg);

        } catch (err) {
            const separator = `---------- ${new Date()} ----------\n`;
            console.log(separator);
            console.log(err);
            await appendFile(LOG_FILE, separator);
            await appendFile(LOG_FILE, err);
            await appendFile(LOG_FILE, '\n');
        }
    }

    process.exit();

})();
