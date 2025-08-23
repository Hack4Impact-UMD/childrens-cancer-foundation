
export interface PostGrantReport {
    id?: string;
    file?: string;
    pdf?: string;
    applicationId: string;
    submittedAt?: Date;
    deadline?: Date;
    investigatorName?: string;
    institutionName?: string;
    attestationDate?: string;
    status?: 'pending' | 'submitted' | 'overdue';
    userId?: string;
    userEmail?: string;
    applicationTitle?: string;
    grantType?: string;
}