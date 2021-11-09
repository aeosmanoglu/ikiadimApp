/*jshint esversion: 8 */

const request = require("supertest");
const app = require("./app");
const { encrypt, decrypt } = require("./controllers/crypto");
const isValidID = require("./controllers/pbik-validator");

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
        const hash = encrypt("Hello World");
        expect(decrypt(hash)).toBe("Hello World");
    });
});