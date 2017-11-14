'use strict';

const { promisify } = require('util');
const fs = require('fs');
const writeFile = promisify(fs.writeFile);
const path = require('path');
const puppeteer = require('puppeteer');
const DeviceDescriptors = require('puppeteer/DeviceDescriptors');

const EXEC_PATH_CANARY = '/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary';
const LAUNCHING_OPTIONS = {
    // executablePath: EXEC_PATH_CANARY,
    // headless: false,
    timeout: 120 * 1000
};
const DEFAULT_DEVICE_CODE_NAME = 'iPhone 6';
const PATH_LOG = path.resolve('./logs');
const PATH_DOWNLOADED_SCRIPT = path.join(PATH_LOG, 'downloadedScripts');

/**
 * Instantiate and configuring a browser and a page (tab).
 */
exports.launch = async function () {
    const browser = await puppeteer.launch(LAUNCHING_OPTIONS);
    const page = await browser.newPage();

    return { browser, page };
}

/**
 * Enable mobile-emulation mode on the provided page, and reload the page automatically.
 *
 * @param {Page} page An instant of Page
 */
exports.applyMobileEmulation = async function (page, codeName = DEFAULT_DEVICE_CODE_NAME) {
    console.log(`> Collecting device descriptor with code name "${codeName}"`);
    const deviceDesc = DeviceDescriptors[codeName];
    if (deviceDesc === undefined) {
        throw new Error(`Device descriptor with code name "${codeName}" not found`);
    }

    console.log('> Start mobile-emulation');
    await page.emulate(deviceDesc);
}

/**
 * Setup a handler for "response" event of the provided Page instant.
 *
 * @param {Page} page An instant of Page
 * @param {string} name Script file prefix
 */
exports.handlePageResponse = function (page, name) {
    page.on('response', async resp => {
        try {
            const isScript = resp.request().resourceType === 'script';
            const isOk = resp.status === 200;

            if (isScript && isOk) {
                const content = await resp.text().then(text => text.trim());
                if (content) {
                    const filename = `${name}_${Date.now()}.js`;
                    const filepath = path.join(PATH_DOWNLOADED_SCRIPT, filename);
                    await writeFile(filepath, content);
                }
            }
        } catch (err) {
            console.error(err);
        }
    });
}
