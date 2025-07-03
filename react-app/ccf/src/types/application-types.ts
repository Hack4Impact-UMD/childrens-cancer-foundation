export interface ApplicationInfo {
    applicationId: number;
    title: string;
    principalInvestigator: string;
    otherStaff: string;
    coPI: boolean;
    institution: string;
    department: string;
    departmentHead: string;
    institutionAddress: string;
    institutionCityStateZip: string;
    institutionPhoneNumber: string;
    institutionEmail: string;
    typesOfCancerAddressed: string;
    adminOfficialName: string;
    adminOfficialAddress: string;
    adminOfficialCityStateZip: string;
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
    einNumber: string;
    attestationHumanSubjects: boolean;
    attestationCertification: boolean;
    signaturePI: string;
    signatureDeptHead: string;
}

export interface AssignReviewers {
    id: string;
    title: string;
    applicant: string;
    status: 'not-started' | 'in-progress' | 'completed';
    expanded: boolean;
}

export interface ResearchApplication {
    title: string;
    principalInvestigator: string;
    otherStaff: string;
    coPI: boolean;
    institution: string;
    department: string;
    departmentHead: string;
    institutionAddress: string;
    institutionCityStateZip: string;
    institutionPhoneNumber: string;
    institutionEmail: string;
    typesOfCancerAddressed: string;
    adminOfficialName: string;
    adminOfficialAddress: string;
    adminOfficialCityStateZip: string;
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
    einNumber: string;
    attestationHumanSubjects: boolean;
    attestationCertification: boolean;
    signaturePI: string;
    signatureDeptHead: string;
}

export type Application = (ResearchApplication | NonResearchApplication) & ApplicationDetails

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
    applicationId?: string;
    grantType: "research" | "nextgen" | "nonresearch";
    file: string;
    applicationCycle: string;
    submitTime: Date;
}
// application-types.ts

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
    continuation?: boolean;
    continuationYears?: string;
    creatorId?: string;
    creditAgreement?: string;
    dates?: string;
    decision?: string;
    explanation?: string;
    file?: string;
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
    status: 'not-started' | 'in-progress' | 'completed';
    expanded: boolean;
}