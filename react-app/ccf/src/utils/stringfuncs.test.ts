import { firstLetterCap } from "./stringfuncs";

describe("firstLetterCap", () => {
    test("capitalizes the first letter", () => {
        expect(firstLetterCap("abc")).toBe("Abc");
    });

    test("returns an empty string unchanged", () => {
        expect(firstLetterCap("")).toBe("");
    });

    test("leaves an already-capitalized string unchanged", () => {
        expect(firstLetterCap("Abc")).toBe("Abc");
    });
});
