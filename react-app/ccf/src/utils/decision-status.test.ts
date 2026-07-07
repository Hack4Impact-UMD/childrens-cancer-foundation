import { getDecisionStatus } from "./decision-status";

describe("getDecisionStatus", () => {
    test("explicit accepted decision", () => {
        expect(getDecisionStatus({ applicationId: "a", decision: "accepted" })).toBe("accepted");
    });

    test("explicit rejected decision", () => {
        expect(getDecisionStatus({ applicationId: "a", decision: "rejected" })).toBe("rejected");
    });

    test("explicit pending decision", () => {
        expect(getDecisionStatus({ applicationId: "a", decision: "pending" })).toBe("pending");
    });

    test("comment-only record is pending, never rejected (the regression)", () => {
        expect(getDecisionStatus({ applicationId: "a", comments: "nice work" })).toBe("pending");
    });

    test("falls back to isAccepted true", () => {
        expect(getDecisionStatus({ applicationId: "a", isAccepted: true })).toBe("accepted");
    });

    test("falls back to isAccepted false", () => {
        expect(getDecisionStatus({ applicationId: "a", isAccepted: false })).toBe("rejected");
    });
});
