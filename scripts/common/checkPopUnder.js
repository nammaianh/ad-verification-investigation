'use strict';

const launcher = require('./launcher');

const URL = 'http://0.0.0.0:8000/html/pop-under.html';
const WAITING_TIMEOUT = 3000;

/**
 * Pop-under checking process.
 *
 * @param {Browser} browser An instant of Browser
 * @param {Page} page An instant of Page
 */
module.exports = function checkPopUnder(browser, page) {
    return new Promise(async (resolve, reject) => {
        // Listen to event of target creation
        browser.on('targetcreated', target => {
            try {
                if (target.type() === 'page') {
                    console.log('> New tab has been opened with URL:', target.url());
                    return resolve(false);
                }
            } catch (err) {
                return reject(err);
            }
        });

        try {
            console.log('> Begin checking with desktop browser');
            await page.goto(URL);
            await page.click('body');
            await page.waitFor(WAITING_TIMEOUT);

            console.log('> Begin checking with mobile-emulation browser');
            await launcher.applyMobileEmulation(page);
            await page.tap('body');
            await page.waitFor(WAITING_TIMEOUT);
        } catch (err) {
            return reject(err);
        }

        return resolve(true);
    });
}
