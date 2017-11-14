'use strict';

const launcher = require('./common/launcher');

const URL = 'http://0.0.0.0:8000/html/auto-redirection.html';
const WAITING_TIMEOUT = 3000;

/**
 * MAIN SCRIPT
 */
launcher.launch().then(({ browser, page }) => {

    launcher.handlePageResponse(page, 'auto-redirection');
    return checkAutoRedirection(browser, page);

}).then(result => {

    if (typeof result !== 'boolean') {
        throw new Error('Result is not boolean');
    }
    console.log('> Result:', result ? 'Passed' : 'Failed');

}).catch(err => {
    console.error(err);
});

/**
 * Auto-redirection checking process.
 *
 * @param {Browser} browser An instant of Browser
 * @param {Page} page An instant of Page
 */
function checkAutoRedirection(browser, page) {
    return new Promise(async (resolve, reject) => {
        let maxNavCount = 0;
        let curNavCount = 0;

        // Listen to event of navigation
        page.on('framenavigated', async frame => {
            try {
                const url = await frame.url();
                console.log('> Navigated to', url);
                if (++curNavCount > maxNavCount) {
                    return resolve(false);
                }
            } catch (err) {
                return reject(err);
            }
        });

        try {
            console.log('> Begin checking with desktop browser');
            ++maxNavCount;
            await page.goto(URL);
            await page.waitFor(WAITING_TIMEOUT);

            console.log('> Begin checking with mobile-emulation browser');
            ++maxNavCount;
            await launcher.applyMobileEmulation(page);
            await page.waitFor(WAITING_TIMEOUT);
        } catch (err) {
            return reject(err);
        }

        return resolve(true);
    });
}
