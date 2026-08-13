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

    // Award comments now live in decision-comments, but a decision doc can
    // still exist with neither `decision` nor `isAccepted` set (e.g. only a
    // funding amount recorded so far). That is pending, never rejected.
    test("record with no decision and no isAccepted is pending (the regression)", () => {
        expect(getDecisionStatus({ applicationId: "a", fundingAmount: 5000 })).toBe("pending");
    });

    test("falls back to isAccepted true", () => {
        expect(getDecisionStatus({ applicationId: "a", isAccepted: true })).toBe("accepted");
    });

    test("falls back to isAccepted false", () => {
        expect(getDecisionStatus({ applicationId: "a", isAccepted: false })).toBe("rejected");
    });
});
