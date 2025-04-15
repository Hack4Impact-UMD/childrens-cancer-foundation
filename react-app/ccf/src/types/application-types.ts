export interface ApplicationInfo {
    applicationId: number;
    title: string;
    principalInvestigator: string;
    typesOfCancerAddressed: string;
    namesOfStaff: string;
    institution: string;
    institutionAddress: string;
    institutionPhoneNumber: string;
    instituionEmail: string;
    adminOfficialName: string;
    adminOfficialAddress: string;
    adminPhoneNumber: string;
    adminEmail: string;
    decision: string;
    assignedReviewers?: string[]
};

export interface ApplicationQuestions {
    includedPublishedPaper: string;
    creditAgreement: string;
    patentApplied: string;
    includedFundingInfo: string;
    amountRequested: number;
    dates: string;
    continuation: boolean;
    continuationYears?: string;
    grantType: string;
}