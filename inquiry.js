const prompts = require('prompts');
const {bytesToSize, sizeToBytes, getFileNameFromUrl} = require('./helpers.js');

const getInputUrl = function() {
    let questions = [
        {
            type: 'text',
            name: 'url',
            message: 'Download URL (include http):',
            initial: 'http://9e24be87.bwtest-aws.pravala.com/384MB.jar',
            validate: val => val.match(/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/) // Validate as URL with HTTP
        }
    ];
    
    return prompts(questions);
}

const getInputSettings = function(url, headers) {
    let questions = [
        {
            type: 'text',
            name: 'name',
            message: 'Rename file (include file extension)?',
            initial: getFileNameFromUrl(url)
        }
    ];

    if(headers) {
        // Push question if header has content-length
        if(headers['content-length']) {
            const fileSize = bytesToSize(headers['content-length']);

            questions.push({
                type: 'text',
                name: 'size',
                message: `The requested file is [${fileSize.value}${fileSize.multiplier}], number of bytes to download (e.g. 12.01MB)?`,
                initial: headers['content-length'],
                validate: val => {
                    const bytes = sizeToBytes(val);

                    // Ensure amount entered is no greater than the file size
                    if(bytes > fileSize.bytes) {
                        return 'Amount entered too large';
                    }

                    return bytes;
                }
            });
        }

        if(headers['accept-ranges'] === 'bytes') {
            questions.push({
                type: 'number',
                name: 'concurrent',
                message: 'Number of concurrent downloads[max: 10]:',
                initial: 4,
                validate: val => val > 0 && val <= 10
            });
        }
    }
    
    return prompts(questions);
}

module.exports = {getInputUrl, getInputSettings};