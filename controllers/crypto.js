/*jshint esversion: 6 */

const { createCipheriv, createHash, randomBytes } = require("crypto");
const dotenv = require("dotenv");
dotenv.config();

const algorithm = "aes-256-ctr";
const secretKey = process.env.SECRET_KEY;
const iv = randomBytes(16);

const encrypt = (text) => {
    const cipher = createCipheriv(algorithm, secretKey, iv);
    const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);
    return {
        iv: iv.toString("hex"),
        content: encrypted.toString("hex"),
    };
};

const decrypt = (hash) => {
    const decipher = createDecipheriv(
        algorithm,
        secretKey,
        Buffer.from(hash.iv, "hex")
    );
    const decrpyted = Buffer.concat([
        decipher.update(Buffer.from(hash.content, "hex")),
        decipher.final(),
    ]);
    return decrpyted.toString();
};

const sha256 = (text = String) => {
    const hash = createHash("sha256");
    hash.update(text);
    return hash.digest("hex");
};

module.exports = {
    encrypt,
    decrypt,
    sha256,
};
