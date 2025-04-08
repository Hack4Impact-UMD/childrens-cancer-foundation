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

export interface ResearchApplication {
    title: string;
    principalInvestigator: string;
    typesOfCancerAddressed: string;
    namesOfStaff: string;
    institution: string;
    institutionAddress: string;
    institutionPhoneNumber: string;
    institutionEmail: string;
    adminOfficialName: string;
    adminOfficialAddress: string;
    adminPhoneNumber: string;
    adminEmail: string;
    includedPublishedPaper: string;
    creditAgreement: string;
    patentApplied: string;
    includedFundingInfo: string;
    amountRequested: string;
    dates: string;
    continuation: string;
    continuationYears?: string;
}

export interface NonResearchApplication {
    title: string;
    requestor: string;
    institution: string;
    institutionPhoneNumber: string;
    institutionEmail: string;
    explanation?: string;
    sources?: string;
    amountRequested: string;
    timeframe: string;
    additionalInfo?: string;
}

export interface ApplicationDetails {
    decision: "pending" | "accepted" | "rejected";
    creatorId: string;
    grantType: "research" | "nextgen" | "nonresearch";
    file: string;
    applicationCycle: string;
}