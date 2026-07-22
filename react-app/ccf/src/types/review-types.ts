export default interface Review {
    id?: string;
    applicationId: string;
    reviewerId: string;
    reviewerType: 'primary' | 'secondary';
    status: 'not-started' | 'in-progress' | 'completed';
    score?: number;
    feedback: {
        significance: string;
        approach: string;
        feasibility: string;
        investigator: string;
        summary: string;
        internal?: string;
    };
    submittedDate?: Date;
    lastUpdated?: Date;
    cycle?: string;
    // Visual-only flag: lets a reviewer hide a completed review from their
    // dashboard behind a "Show archived" toggle. Does not affect admin views.
    archived?: boolean;
}

export interface ReviewSummary {
    applicationId: string;
    primaryReview?: Review;
    secondaryReview?: Review;
}