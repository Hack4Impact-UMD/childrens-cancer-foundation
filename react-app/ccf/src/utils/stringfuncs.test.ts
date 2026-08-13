import { firstLetterCap, formatGrantType } from "./stringfuncs";

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

describe("formatGrantType", () => {
    test("formats nextgen", () => {
        expect(formatGrantType("nextgen")).toBe("NextGen");
    });

    test("formats nonresearch", () => {
        expect(formatGrantType("nonresearch")).toBe("Non-Research");
    });

    test("capitalizes any other grant type", () => {
        expect(formatGrantType("research")).toBe("Research");
    });

    test("returns an empty string unchanged", () => {
        expect(formatGrantType("")).toBe("");
    });
});
