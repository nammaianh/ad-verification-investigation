'use strict';

const launcher = require('./common/launcher');
const checkPopup = require('./common/checkPopup');

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
