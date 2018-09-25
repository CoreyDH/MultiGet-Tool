/* Converts bytes into appropriate shorten size
 * @param {integer}: bytes
 * @returns {object}:
 *      {float}: value
 *      {string}: multiplier
 *      {integer}: bytes
 */
const bytesToSize = function(bytes) {
    var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    bytes = parseInt(bytes);
    if (bytes == 0) return '0 Byte';
    var i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
    return {
        value: Math.round(bytes / Math.pow(1024, i), 2),
        multiplier: sizes[i],
        bytes: bytes
    };
 };

/* Converts shorten byte size into bytes
 * @param {string}: size
 * @returns {integer}
 */
const sizeToBytes = function(size) {
    const sizeArr = size.match(/([\d,\.]+)\s?(([KkMmGgTt][Bb])|[Bb])?/);

    const val = parseFloat(sizeArr[1]);
    const multiplier = sizeArr[2];

    if(isNaN(val)) {
        return false;
    }

    const multiplierOptions = {
        'KB': 1,
        'MB': 2,
        'GB': 3,
        'TB': 4
    }

    const m = multiplier ? multiplierOptions[multiplier.toUpperCase()] : 0;

    return Math.round(val * Math.pow(1024, m));
}

/* Retrieve file name from URL path
 * @param {string}: url
 * @returns {string}
 */
const getFileNameFromUrl = function(url) {
    const filePaths = url.split('/');
    const fileName = filePaths[filePaths.length - 1].split('?')[0];

    console.log(fileName);

    return fileName;
}

module.exports = {
    bytesToSize,
    sizeToBytes,
    getFileNameFromUrl
}