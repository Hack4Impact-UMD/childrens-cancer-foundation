import { getMissingRequiredReviewFields, canSubmitReview } from "./review-required-fields";

const feedback = (summary: string) => ({ summary });

describe("getMissingRequiredReviewFields", () => {
    test("nothing missing when the score and summary are filled in", () => {
        expect(getMissingRequiredReviewFields("2.3", feedback("Solid proposal."))).toEqual([]);
        expect(canSubmitReview("2.3", feedback("Solid proposal."))).toBe(true);
    });

    test("empty optional sections do not block submission", () => {
        // significance/approach/feasibility/investigator are absent entirely here.
        expect(canSubmitReview("1.0", feedback("Summary text"))).toBe(true);
    });

    test("names the missing score", () => {
        expect(getMissingRequiredReviewFields("", feedback("Summary text"))).toEqual([
            "an overall score",
        ]);
    });

    test("names the missing summary, including whitespace-only text", () => {
        expect(getMissingRequiredReviewFields("3.0", feedback(""))).toEqual(["the summary"]);
        expect(getMissingRequiredReviewFields("3.0", feedback("   "))).toEqual(["the summary"]);
    });

    test("names both when neither is filled in", () => {
        expect(getMissingRequiredReviewFields("", feedback(""))).toEqual([
            "an overall score",
            "the summary",
        ]);
        expect(canSubmitReview("", feedback(""))).toBe(false);
    });
});
