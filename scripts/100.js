'use strict';

const events = require('events');
const launcher = require('./common/launcher');
const checkAutoRedirection = require('./common/checkAutoRedirection');
const checkPopup = require('./common/checkPopup');

events.EventEmitter.defaultMaxListeners = 0;

(async function run() {

    try {

        while (true) {
            const promises = [];

            const now = Date.now();
            for (let i = 0; i < 10; ++i) {
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

            console.log('> Passed count:', results.filter(result => result === true).length);
            console.log('> Failed count:', results.filter(result => result === false).length);
            console.log('> Period:', period / 1000, 'sec');
        }

    } catch (err) {
        console.log(err);
    }

    process.exit();

})();
