'use strict';

const launcher = require('./common/launcher');
const checkPopUnder = require('./common/checkPopUnder');

/**
 * MAIN SCRIPT
 */
launcher.launch().then(({ browser, page }) => {

    launcher.handlePageResponse(page, 'pop-under');
    return checkPopUnder(browser, page);

}).then(result => {

    if (typeof result !== 'boolean') {
        throw new Error('Result is not boolean');
    }
    console.log('> Result:', result ? 'Passed' : 'Failed');

}).catch(err => {
    console.error(err);
});
