const {getInputUrl, getInputSettings} = require('./inquiry.js');
const {getHeaders, downloadFile} = require('./requests.js');
const {getFileNameFromUrl, saveToFile} = require('./helpers.js');

const startApp = async function() {
    try {
        const {url} = await getInputUrl(); // Prompt input URL
        const headers = await getHeaders(url); // Get file header information, needed for input settings prompt
        const settings = await getInputSettings(url, headers); // Promp input settings
        
        const data = await downloadFile({url, settings, headers}); // Begin GET requests

        console.log('Saving file...');
        const fileName = settings.name || getFileNameFromUrl(url);
        saveToFile(data, fileName);
        console.log('Complete!');
    } catch(err) {
        console.error(err);
    }
}

// Begin APP
startApp();