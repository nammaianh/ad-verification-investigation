'use strict';

const launcher = require('./common/launcher');
const checkAutoRedirection = require('./common/checkAutoRedirection');

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
