// ApplicantUser interface
interface ApplicantUser {
    userId: string;                     //required
    name: string;                       //required
    title: string;                      //required
    email: string;                      //required
    institutionalAffiliation: string;   //required
    principalInvestigator: string;      //required
    applyingFor: string;                
    receivedPriorCCFFunding: boolean;   
  }
  
  // ReviewerUser interface
  interface ReviewerUser {
    userId: string;                     //required
    name: string;                       //required
    email: string;                      //required
    institutionalAffiliation: string;   //required
    assignedApplications?: string[];
  }
  export { type ApplicantUser, type ReviewerUser };
    