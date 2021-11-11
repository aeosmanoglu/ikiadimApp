/*jshint esversion: 8 */

let request = require("supertest");
let app = require("./app");
let { encrypt, decrypt, shax } = require("./controllers/crypto");
let isValidID = require("./controllers/pbik-validator");

describe("Test the root path", () => {
    test("It should response the GET method", () => {
        return request(app).get("/").expect(200);
    });
});

describe("Test ID validator", () => {
    test("It shoulds true", () => {
        expect(isValidID("1234567")).toBe(true);
    });
    test("Can not start with zero", () => {
        expect(isValidID("0234567")).toBe(false);
    });
    test("Can not less than 7 digits", () => {
        expect(isValidID("123456")).toBe(false);
    });
    test("Can not more than 7 digits", () => {
        expect(isValidID("12345678")).toBe(false);
    });
    test("Should only digits", () => {
        expect(isValidID("12E4567")).toBe(false);
    });
});

describe("Test encrypt&decrypt", () => {
    test("It shoulds Hello World", () => {
        let hash = encrypt("Hello World");
        expect(decrypt(hash)).toBe("Hello World");
    });

    test("It shoulds 0A4D55A8D778E5022FAB701977C5D840BBC486D0", () => {
        expect(shax("Hello World")).toBe("0a4d55a8d778e5022fab701977c5d840bbc486d0");
    });
});