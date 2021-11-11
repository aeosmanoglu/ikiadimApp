/*jshint esversion: 6 */

const { createCipheriv, createHash, randomBytes } = require("crypto");
const dotenv = require("dotenv");
dotenv.config();

const algorithm = "aes-256-ctr";
const secretKey = process.env.SECRET_KEY;
const iv = randomBytes(16);

/**
 *
 * @param {string} text - text to encrypt and hash it (required)
 * @param {string} key - key to encrypt 32 bytes
 * @returns {{iv: string, content: string}} - iv and encrypted content
 */
const encrypt = (text, key = secretKey) => {
    const cipher = createCipheriv(algorithm, key, iv);
    const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);

    return {
        iv: iv.toString("hex"),
        content: encrypted.toString("hex"),
    };
};

/**
 *
 * @param {{iv: string, content: string}} hash - iv and encrypted content (required)
 * @param {string} key - key to decrypt 32 bytes
 * @returns {string} - decrypted text
 */
const decrypt = (hash, key = secretKey) => {
    const decipher = createCipheriv(
        algorithm,
        key,
        Buffer.from(hash.iv, "hex")
    );
    const decrypted = Buffer.concat([
        decipher.update(Buffer.from(hash.content, "hex")),
        decipher.final(),
    ]);
    return decrypted.toString();
};

/**
 *
 * @param {string} text - text to hash it (required)
 * @returns {string} - hash of text
 */
const sha256 = (text) => {
    const hash = createHash("sha256");
    hash.update(text);
    return hash.digest("hex");
};

module.exports = {
    encrypt,
    decrypt,
    sha256,
};
