'use strict';

const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');
const devices = require('puppeteer/DeviceDescriptors');
const iPhone = devices['iPhone 6'];

const browserOptions = {
    headless: false
};

// const ORIGINAL_URL = 'http://localhost:8888/html/auto-redirection.html';
const ORIGINAL_URL = 'http://localhost:8888/html/auto-redirection-generated.html';
const WAIT_FOR_AUTO_REDIRECTION_TIMEOUT = 6000; // 6 seconds.
const LOG_FILE_PATH = path.join(__dirname, 'logs/requests.log');
let curLogContent = fs.existsSync(LOG_FILE_PATH) ? fs.readFileSync(LOG_FILE_PATH) : '';
let isFirstRequestLog = true;
let browser = undefined;
let page = undefined;
let navCount = 0;
let maxNavCount = 1;

puppeteer.launch(browserOptions).then(async newBrowser => {
    browser = newBrowser;
    page = await browser.newPage();

    // Log every request
    page.on('request', request => {
        if (isFirstRequestLog) {
            isFirstRequestLog = false;
            const now = new Date().toString();
            const sideLength = (98 - now.length) / 2;
            const lSide = '-'.repeat(sideLength);
            const rSide = '-'.repeat(sideLength);
            const logSeparator = `${lSide} ${now} ${rSide}`;
            curLogContent = `${logSeparator}\n\n${curLogContent}`;
            fs.writeFileSync(LOG_FILE_PATH, curLogContent);
        }

        curLogContent = `${request.method} ${request.url}\n${JSON.stringify(request.headers, undefined, 2)}\n\n${curLogContent}`;
        fs.writeFileSync(LOG_FILE_PATH, curLogContent);
    });

    // Log every JS file response
    page.on('response', async response => {
        const request = response.request();
        if (request.resourceType === 'script') {
            console.log(await response.text());
        }
    });

    return new Promise(async (resolve, reject) => {
        // Event handler for page navigation
        page.on('framenavigated', async frame => {
            console.log('> Navigated:', await frame.url());
            if (++navCount > maxNavCount) {
                return resolve(false);
            }
        });

        try {
            // Go to the original URL; navCount will be 1.
            await page.goto(ORIGINAL_URL);

            // Wait for a period-of-time for an auto-redirection.
            // If there is no redirection after that period, this verification step is passed.
            try {
                console.log('> Start verification with desktop browser')
                // TODO: should use waitFor() instead???
                await page.waitForNavigation({ timeout: WAIT_FOR_AUTO_REDIRECTION_TIMEOUT });
            } catch (err) {
                // Got a navigation timeout error if there is no auto-redirection.
                // Do nothing here if this is a navigation timeout error, and continue with the next step of verification;
                // else, throw error.
                if (!isNavigationTimeoutError(err)) {
                    throw err;
                }
                console.log('> Passed verification with desktop browser');
            }

            // Retry the previous step with mobile emulation.
            // TODO: Raise maxNavCount, or reset navCount instead???
            ++maxNavCount;
            try {
                console.log('> Start verification with mobile-emulation browser');
                await page.emulate(iPhone);
                // TODO: should use waitFor instead()???
                await page.waitForNavigation({ timeout: WAIT_FOR_AUTO_REDIRECTION_TIMEOUT });
            } catch (err) {
                if (!isNavigationTimeoutError(err)) {
                    throw err;
                }
                console.log('> Passed verification with mobile-emulation browser');
            }

            // It is VALID if passed all the verification steps.
            return resolve(true);

        } catch (err) {
            return reject(err);
        }
    });

}).then(isValid => {
    console.log(`> Is valid? ${isValid}`);
}).catch(err => {
    console.error(err);
}).then(async () => {
    page && await page.close();
    browser && await browser.close()
    process.exit();
})

/**
 * Check if the provided error is an error of navigation timeout
 *
 * @param {Error} err
 * @returns {boolean}
 */
function isNavigationTimeoutError(err) {
    return err.message.toLowerCase().startsWith('navigation timeout');
}
