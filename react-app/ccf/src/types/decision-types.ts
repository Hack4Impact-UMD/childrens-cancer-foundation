export interface Decision {
    applicationId: string;
    comments?: string;
    fundingAmount?: number;
    decision?: string;
    lastUpdated?: Date; // Firebase Timestamp
    createdAt?: Date; // Firebase Timestamp
}