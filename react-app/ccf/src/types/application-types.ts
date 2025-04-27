export interface ApplicationInfo {
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
}

export interface AssignReviewers {
    id: string;
    title: string;
    applicant: string;
    primaryReviewer: string | null;
    secondaryReviewer: string | null;
    status: 'not-started' | 'in-progress' | 'completed';
    expanded: boolean;
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
// application-types.ts

export interface AssignReviewers {
    id: string;
    title: string;
    applicant: string;
    primaryReviewer: string | null;
    secondaryReviewer: string | null;
    status: 'not-started' | 'in-progress' | 'completed';
    expanded: boolean;
}

export interface Reviewer {
    document_id: string;
    affiliation: string;
    email: string;
    firstName: string;
    lastName: string;
    name?: string;
    role: string;
    title?: string;
    assignedApplications?: string[];
}

export interface GrantApplication {
    document_id: string;
    title: string;
    grantType: string;
    principalInvestigator: string;
    additionalInfo?: string;
    adminEmail?: string;
    adminOfficialAddress?: string;
    adminOfficialName?: string;
    adminPhoneNumber?: string;
    amountRequested?: number;
    comments?: string;
    continuation?: boolean;
    continuationYears?: string;
    creatorId?: string;
    creditAgreement?: string;
    dates?: string;
    decision?: string;
    explanation?: string;
    file?: string;
    finalScore?: number;
    fundingAmount?: number;
    includedFundingInfo?: string;
    includedPublishedPaper?: string;
    instituionEmail?: string;
    institution?: string;
    institutionAddress?: string;
    institutionEmail?: string;
    institutionPhoneNumber?: string;
    namesOfStaff?: string;
    patentApplied?: string;
    pdf?: string;
    recommendedAmount?: number;
    requestor?: string;
    sources?: string;
    timeframe?: string;
    typesOfCancerAddressed?: string;
    primaryReviewer?: string;
    secondaryReviewer?: string;
    status: 'not-started' | 'in-progress' | 'completed';
    expanded: boolean;
}