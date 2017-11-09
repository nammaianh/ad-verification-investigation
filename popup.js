'use strict';

const puppeteer = require('puppeteer');
const devices = require('puppeteer/DeviceDescriptors');
const iPhone = devices['iPhone 6'];

const browserOptions = {
    headless: false
};

const URL = 'http://localhost:8888/html/popup.html';
const WAIT_FOR_POPUP_TIMEOUT = 6000; // 6 seconds
let browser = undefined;
let page = undefined;

puppeteer.launch(browserOptions).then(async newBrowser => {
    browser = newBrowser;
    page = await browser.newPage();

    // Event handler for target-opening (window, tab...)
    browser.on('targetcreated', async target => {
        if (target.type === 'page') {
            console.log(`> New target [page] has been created [${target.url()}]`);
            return resolve(false);
        }
    });

    return new Promise(async (resolve, reject) => {
        try {
            await page.goto(URL);

            // CLICK on the center of <body> tag.
            // If there is no new page is opened, this verification step is passed.
            console.log('> Start verification with desktop browser');
            await page.click('body');
            console.log('> Click on the center of <body>');
            await page.waitFor(WAIT_FOR_POPUP_TIMEOUT);
            console.log('> Passed verification with desktop browser');

            // Retry the previous step with mobile emulation and TAPping instead of CLICKing.
            console.log('> Start verification with mobile-emulation browser');
            await page.emulate(iPhone);
            await page.reload();
            await page.tap('body');
            console.log('> Tap on the center of <body>');
            await page.waitFor(WAIT_FOR_POPUP_TIMEOUT);
            console.log('> Passed verification with mobile-emulation browser');

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
});
