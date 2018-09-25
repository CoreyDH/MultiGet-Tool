const {getInputUrl, getInputSettings} = require('./inquiry.js');
const {getHeaders, downloadFile} = require('./requests.js');

const startApp = async function() {
    try {
        const {url} = await getInputUrl(); // Prompt input URL
        const headers = await getHeaders(url); // Get file header information, needed for input settings prompt
        const settings = await getInputSettings(url, headers); // Promp input settings
        
        // console.log(settings);
        downloadFile({url, settings, headers}); // Begin GET requests
    } catch(err) {
        console.error(err);
    }
}

// Begin APP
startApp();