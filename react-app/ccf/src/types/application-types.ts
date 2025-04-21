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
    grantType: string;
}
