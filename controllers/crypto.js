/*jshint esversion: 8 */

let crypto = require("crypto");
let sha1 = require('sha1');
let dotenv = require("dotenv");
dotenv.config();

let algorithm = 'aes-256-ctr';
let secretKey = process.env.SECRET_KEY;
let iv = crypto.randomBytes(16);

let encrypt = (text) => {

    let cipher = crypto.createCipheriv(algorithm, secretKey, iv);

    let encrypted = Buffer.concat([cipher.update(text), cipher.final()]);

    return {
        iv: iv.toString('hex'),
        content: encrypted.toString('hex')
    };
};

let decrypt = (hash) => {

    let decipher = crypto.createDecipheriv(algorithm, secretKey, Buffer.from(hash.iv, 'hex'));

    let decrpyted = Buffer.concat([decipher.update(Buffer.from(hash.content, 'hex')), decipher.final()]);

    return decrpyted.toString();
};

let sha = (text) => {
    return sha1(text);
};

module.exports = {
    encrypt,
    decrypt,
    shax: sha
};