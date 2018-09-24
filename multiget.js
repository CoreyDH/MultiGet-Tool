const {getInputUrl, getInputSettings} = require('./inquiry.js');
const {getHeaders, downloadFile} = require('./requests.js');

const startMultiGet = async function() {
    try {
        const {url} = await getInputUrl();
        const headers = await getHeaders(url);
        const settings = await getInputSettings(url, headers);
        
        // console.log(settings);
        downloadFile({url, settings, headers}); // Begin GET request
    } catch(err) {
        console.error(err);
    }
}

// Begin APP
startMultiGet();