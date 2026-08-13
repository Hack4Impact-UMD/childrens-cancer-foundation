// What the applicant is allowed to see about their award. Applicants can read
// their own /decision-data doc directly (firestore.rules), so every field here
// is public to them — internal award commentary lives in DecisionComments.
export interface Decision {
    applicationId: string;
    fundingAmount?: number;
    decision?: string;
    isAccepted?: boolean;
    lastUpdated?: Date; // Firebase Timestamp
    createdAt?: Date; // Firebase Timestamp
}

// Internal committee commentary on an award, stored in the admin-only
// /decision-comments collection rather than on the decision doc. Hiding it in
// the UI is not enough: the applicant can read the decision doc itself.
export interface DecisionComments {
    applicationId: string;
    comments?: string;
    lastUpdated?: Date; // Firebase Timestamp
}
