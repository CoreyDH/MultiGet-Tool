const request = require('request');
const fs = require('fs');
const path = require('path');

const {getFileNameFromUrl, sizeToBytes} = require('./helpers');

const getHeaders = function(url) {
    return new Promise((resolve, reject) => {
        request(url, { method: 'HEAD'}, (error, response, body) => {
            resolve(response.headers);
        });
    });
}

function getFile(url, options) {
    // Keep default options and overwrite keys if needed
    const requestOptions = Object.assign({}, {
        method: 'GET',
        uri: url
    }, options || {});

    console.log('Sending request..', url);

    return request(requestOptions);
}

function getFilePieces({url, order, range}) {
    return new Promise((resolve, reject) => { // Wrap in Promise to resolve only after Buffer data is received

        let chunks = [];
        let options = {};

        if(range) {
            options.headers = {
                'Range': `bytes=${range.min}-${range.max}`
            };
        }
        
        getFile(url, options)
            .on('data', chunk => {
                chunks.push(chunk); // Stream chunks into chunks array
            })
            .on('end', () => {
                console.log(`Finished downloading part...${order + 1}`);
                resolve({
                    order: order,
                    data: Buffer.concat(chunks) // Concat all chunks and return as Buffer data
                });
            });
    });
}

function downloadSplitPieces(url, settings) {
    const bytesToDownload = sizeToBytes(settings.size); // Total bytes to download 
    const increment = Math.ceil(bytesToDownload / settings.concurrent); // Get file split size, round up for an easier check on last increment

    let pieces = []; // Empty array to be filled with Promises
    let min = 0;
    let max = increment;

    for(let i = 0; i < settings.concurrent; i++) {
        // If the max range is higher than the total bytes needed to be downloaded, set it to the bytes to download instead
        if(max > bytesToDownload) {
            max = bytesToDownload;
        }

        pieces.push(getFilePieces({
            url,
            order: i,
            range: { min, max }
        }));

        if(i === 0) {
            min++; // Offset min bytes by 1 after the first pass only so there is no overlap in bytes
        }

        min += increment;
        max += increment;
    }

    return Promise.all(pieces);
}

function saveFile(data, fileName) {
    const dowloadDir = path.join(__dirname, '..', 'downloads');
    const downloadPath = path.join(dowloadDir, fileName);

    // Check if downloads directory exists, if not create it
    if(!fs.existsSync(dowloadDir)) {
        fs.mkdirSync(dowloadDir);
    }

    const wstream = fs.createWriteStream(downloadPath);
    wstream.write(data); // Concat all data chunks, and write to file
    wstream.close();
}

const downloadFile = async function({url, settings, headers}) {
    const fileName = settings.name || getFileNameFromUrl(url);
    const fileHeaders = headers || await getHeaders(url, { method: 'HEAD' });

    // Check if file can be pulled by range, has a content length, and split exists and is a number
    if(fileHeaders['accept-ranges'] === 'bytes' && fileHeaders['content-length'] && settings.concurrent) {
        const downloadedPieces = await downloadSplitPieces(url, settings); // Returns array with the results of all requests
        const finalDataArray = downloadedPieces
                                    .sort((a, b) => a.order - b.order) // Sort requests
                                    .map(val => val.data); // Create new array filled with the data only
        const finalData = Buffer.concat(finalDataArray); // Merge chunks for final file

        saveFile(finalData, fileName);
        console.log('Complete!');
    }
}

module.exports = {
    getHeaders,
    downloadFile
}