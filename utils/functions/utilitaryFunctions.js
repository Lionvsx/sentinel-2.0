const emojiRegex = require('emoji-regex/RGI_Emoji.js');
const fs = require('fs-extra');
const https = require('https');

function removeEmojis (string) {
    var regex = emojiRegex();
  
    return string.replace(regex, '');
}

function getEmoji (string) {
    let stringWithoutEmoji = removeEmojis(string);

    return string.replace(stringWithoutEmoji, '')
}

function removeDivider (string) {
    var regex = /『|』|┃|┋|︙/g

    return string.replace(regex, '');
}

const downloadFile = (path, url) => {
    return new Promise(async (resolve) => {
        const file = fs.createWriteStream(path)
        https.get(url, response => {
            var stream = response.pipe(file);
          
            stream.on("finish", () => {
              resolve();
            });
          });
    })
}

const readFile = (path) => {
    return new Promise(async (resolve, reject) => {
        fs.readFile(path, (err, data) => {
            if (err) return reject(err);
            else if (data) return resolve(data);
        })
    })
}

const sleep = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms))
}

module.exports = {
    removeEmojis,
    getEmoji,
    removeDivider,
    downloadFile,
    readFile,
    sleep
}


