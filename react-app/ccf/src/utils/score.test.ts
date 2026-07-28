import { formatAverageScore, formatScore, roundAverageScore } from "./score";

describe("formatScore", () => {
    test("shows one decimal for a 0.1-increment score", () => {
        expect(formatScore(1.1)).toBe("1.1");
    });

    test("pads a whole number from the old integer scale", () => {
        expect(formatScore(3)).toBe("3.0");
    });
});

describe("roundAverageScore", () => {
    test("strips the float artifact from a half-step average", () => {
        expect(roundAverageScore((1.1 + 1.2) / 2)).toBe(1.15);
    });

    test("strips the float artifact from a whole-step average", () => {
        expect(roundAverageScore((1.1 + 1.3) / 2)).toBe(1.2);
    });

    test("leaves an exact average unchanged", () => {
        expect(roundAverageScore(2.5)).toBe(2.5);
    });
});

describe("formatAverageScore", () => {
    test("keeps the half-step that toFixed(1) would round away", () => {
        expect(formatAverageScore(roundAverageScore((1.1 + 1.2) / 2))).toBe("1.15");
    });

    test("pads to two decimals", () => {
        expect(formatAverageScore(1.2)).toBe("1.20");
    });
});
