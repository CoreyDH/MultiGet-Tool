const request = require('request');
const rp = require('request-promise');
const fs = require('fs');
const path = require('path');

const {getFileNameFromUrl, sizeToBytes} = require('./helpers');

const getHeaders = function(url) {
    const options = {
        method: 'HEAD',
        uri: url
    }

    try {
        return rp(options);
    } catch(err) {
        console.log(err)
    }

    // return getFile(url, { method: 'HEAD'});
}

function getFile(url, options) {
    const requestOptions = Object.assign({}, {
        method: 'GET',
        uri: url
    }, options || {});

    console.log('Sending request..', requestOptions);

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

    const downloadPath = path.join(__dirname, 'downloads', fileName);
    const wstream = fs.createWriteStream(downloadPath);

    // Check if file can be pulled by range, has a content length, and split exists and is a number
    if(fileHeaders['accept-ranges'] === 'bytes' && fileHeaders['content-length'] && settings.concurrent) {
        const downloadedPieces = await downloadSplitPieces(url, settings);
        const sortedAllPieces = downloadedPieces.sort((a, b) => a.order - b.order);
        const finalDataArray = sortedAllPieces.map(val => val.data);

        wstream.write(Buffer.concat(finalDataArray));
        console.log('Complete!');
    } else {
        getFile(url).pipe(wstream);
    }
}

module.exports = {
    getHeaders,
    downloadFile
}