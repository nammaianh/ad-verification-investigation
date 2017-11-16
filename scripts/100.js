'use strict';

const { promisify }        = require('util');
const fs                   = require('fs');
const appendFile           = promisify(fs.appendFile);
const path                 = require('path');
const events               = require('events');
const launcher             = require('./common/launcher');
const checkAutoRedirection = require('./common/checkAutoRedirection');
const checkPopup           = require('./common/checkPopup');
const checkPopUnder        = require('./common/checkPopUnder');

const LOG_FILE = path.join(__dirname, '../logs/100.log');

const availableFunctions = {
    checkAutoRedirection,
    checkPopup,
    checkPopUnder
};
const functionToCall     = process.argv[2];

if (functionToCall === undefined) {
    throw new Error('Function to call is missing');
}
if (availableFunctions[functionToCall] === undefined || typeof availableFunctions[functionToCall] !== 'function') {
    throw new Error(`Function "${functionToCall}" is not available`);
}

events.EventEmitter.defaultMaxListeners = 0;


(async function run() {

    while (true) {
        try {
            const promises = [];

            const now = Date.now();
            for (let i = 0; i < 50; ++i) {
                promises.push(
                    launcher.launch().then(async ({ browser, page }) => {
                        const result = await availableFunctions[functionToCall](browser, page);
                        await browser.close();
                        return result;
                    }).catch(async err => {
                        await logError(err);
                    })
                );
            }

            const results = await Promise.all(promises);
            const then = Date.now();
            const period = then - now;

            const logMsg =
                `---------- ${new Date()} ----------\n` +
                `> Passed count: ${results.filter(result => result === true).length}\n` +
                `> Failed count: ${results.filter(result => result === false).length}\n` +
                `> Period: ${period / 1000} sec\n`;
            console.log(logMsg);            // Write log to console
            appendFile(LOG_FILE, logMsg);   // Write log to file

        } catch (err) {
            await logError(err);
        }
    }

    process.exit();

})();


async function logError(err) {
    const separator = `---------- ${new Date()} ----------\n`;
    console.log(separator);
    console.log(err);
    await appendFile(LOG_FILE, separator);
    await appendFile(LOG_FILE, err);
    await appendFile(LOG_FILE, '\n');
}
