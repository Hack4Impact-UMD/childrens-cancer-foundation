import { isDraftFromEndedCycle } from "./draft-cycle";

describe("isDraftFromEndedCycle", () => {
    test("true when the draft's cycle id differs from the current cycle", () => {
        expect(isDraftFromEndedCycle({ applicationCycleId: "old" }, "current")).toBe(true);
    });

    test("false when the ids match", () => {
        expect(isDraftFromEndedCycle({ applicationCycleId: "current" }, "current")).toBe(false);
    });

    test("false for legacy drafts missing the field", () => {
        expect(isDraftFromEndedCycle({}, "current")).toBe(false);
        expect(isDraftFromEndedCycle({ applicationCycleId: null }, "current")).toBe(false);
    });

    test("false when the current cycle id is unknown", () => {
        expect(isDraftFromEndedCycle({ applicationCycleId: "old" }, undefined)).toBe(false);
    });
});
