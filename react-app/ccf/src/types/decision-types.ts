export interface Decision {
    applicationId: string;
    comments?: string;
    fundingAmount?: number;
    decision?: string;
    isAccepted?: boolean;
    lastUpdated?: Date; // Firebase Timestamp
    createdAt?: Date; // Firebase Timestamp
}