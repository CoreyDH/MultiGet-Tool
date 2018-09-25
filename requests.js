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
    const bytesToDownload = sizeToBytes(settings.size);
    const increment = Math.ceil(bytesToDownload / settings.concurrent);

    let pieces = [];
    let min = 0;
    let max = increment;

    for(let i = 0; i < settings.concurrent; i++) {
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

const downloadFile = async function({url, settings, headers}) {
    const fileName = settings.name || getFileNameFromUrl(url);
    const fileHeaders = headers || await getHeaders(url, { method: 'HEAD' });

    const dowloadDir = path.join(__dirname, 'downloads');
    const downloadPath = path.join(dowloadDir, fileName);

    // Check if downloads directory exists, if not create it
    if(!fs.existsSync(dowloadDir)) {
        fs.mkdirSync(dowloadDir);
    }
    
    const wstream = fs.createWriteStream(downloadPath);

    // Check if file can be pulled by range, has a content length, and split exists and is a number
    if(fileHeaders['accept-ranges'] === 'bytes' && fileHeaders['content-length'] && settings.concurrent) {
        const downloadedPieces = await downloadSplitPieces(url, settings); // Returns array with the results of all requests
        const sortedAllPieces = downloadedPieces.sort((a, b) => a.order - b.order); // Sort requests
        const finalDataArray = sortedAllPieces.map(val => val.data); // Create new array filled with the data only

        wstream.write(Buffer.concat(finalDataArray)); // Concat all data chunks, and write to file
        console.log('Complete!');
    }
}

module.exports = {
    getHeaders,
    downloadFile
}