/** True only when the draft is stamped with a cycle id that differs from the current cycle. */
export const isDraftFromEndedCycle = (
    draft: { applicationCycleId?: string | null },
    currentCycleId: string | undefined,
): boolean => {
    if (!draft.applicationCycleId || !currentCycleId) return false;
    return draft.applicationCycleId !== currentCycleId;
};
