import { doc, setDoc } from "firebase/firestore";
import { db } from '../index';
import { uploadFileToStorage } from "../storage/storage";
// import { ApplicationInfo, ApplicationQuestions } from '../types/application-types';

export const writeApplicationInfo = async( 
    applicationData: any, 
) => {
    try {
        const pdfUrl = await uploadFileToStorage(applicationData.file);
        
        const newApplicationRef = doc(db, 'applications', Date.now().toString());
        await setDoc(newApplicationRef, {
            title: applicationData.projectTitle,
            principalInvestigator: applicationData.investigator,
            typesOfCancerAddressed: applicationData.cancers,
            namesOfStaff: applicationData.namesOfStaff,
            institution: applicationData.institution,
            institutionAddress: applicationData.institutionAddress,
            institutionPhoneNumber: applicationData.institutionPhone,
            instituionEmail: applicationData.instituionEmail,
            adminOfficialName: applicationData.adminName,
            adminOfficialAddress: applicationData.adminAddress,
            adminPhoneNumber: applicationData.adminPhone,
            adminEmail: applicationData.adminEmail,
            includedPublishedPaper: applicationData.includedPublishedPaper,
            creditAgreement: applicationData.creditAgreement,
            patentApplied: applicationData.appliedPatent,
            includedFundingInfo: applicationData.includedInfo,
            amountRequested: applicationData.amountRequested,
            dates: applicationData.grantProjDates,
            continuation: applicationData.continuation,
            contCurrentFunds: applicationData.contCurrentFunds,
            contCurrentFundDates: applicationData.contCurrentFundDates,
            pdf: pdfUrl, 
        });

    } catch (error) {
        console.error("Error writing application data:", error);
        throw error;
    }
};
