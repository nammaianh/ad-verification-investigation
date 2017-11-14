'use strict';

const launcher = require('./common/launcher');

const URL = 'http://0.0.0.0:8000/html/popup.html';
const WAITING_TIMEOUT = 3000;

/**
 * MAIN SCRIPT
 */
launcher.launch().then(({ browser, page }) => {

    launcher.handlePageResponse(page, 'popup');
    return checkPopup(browser, page);

}).then(result => {

    if (typeof result !== 'boolean') {
        throw new Error('Result is not boolean');
    }
    console.log('> Result:', result ? 'Passed' : 'Failed');

}).catch(err => {
    console.error(err);
});

function checkPopup(browser, page) {
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
