import { Decision } from "../types/decision-types";

export type DecisionStatus = 'pending' | 'accepted' | 'rejected';

// Determine the display status from a decision-data record.
// The tri-state `decision` field is authoritative; fall back to the
// `isAccepted` boolean only when it is explicitly set. An unset decision
// (e.g. a comment-only record) is PENDING — never rejected.
export const getDecisionStatus = (decision: Decision): DecisionStatus => {
    const raw = decision.decision;
    if (raw === 'accepted' || raw === 'rejected' || raw === 'pending') {
        return raw;
    }
    if (decision.isAccepted === true) return 'accepted';
    if (decision.isAccepted === false) return 'rejected';
    return 'pending';
};
