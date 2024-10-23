import { doc, setDoc } from "firebase/firestore";
import { db } from '../index';
import { uploadFileToStorage } from "../functions/storage";

interface ApplicationInfo {
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
};

interface ApplicationQuestions {
    includedPublishedPaper: string;
    creditAgreement: string;
    patentApplied: string;
    includedFundingInfo: string;
    amountRequested: number;
    dates: string;
    continuation: boolean;
    continuationYears?: string;
}

interface GrantInfo {
    pdf: string;
}

export const writeApplicationInfo = async( 
    applicationInfo: ApplicationInfo, 
    applicationQuestions: ApplicationQuestions, 
    file: File 
) => {
    try {
        const pdfUrl = await uploadFileToStorage(file);
        
        const newApplicationRef = doc(db, 'applications', Date.now().toString());
        await setDoc(newApplicationRef, {
            title: applicationInfo.title,
            principalInvestigator: applicationInfo.principalInvestigator,
            typesOfCancerAddressed: applicationInfo.typesOfCancerAddressed,
            namesOfStaff: applicationInfo.namesOfStaff,
            institution: applicationInfo.institution,
            institutionAddress: applicationInfo.institutionAddress,
            institutionPhoneNumber: applicationInfo.institutionPhoneNumber,
            instituionEmail: applicationInfo.instituionEmail,
            adminOfficialName: applicationInfo.adminOfficialName,
            adminOfficialAddress: applicationInfo.adminOfficialAddress,
            adminPhoneNumber: applicationInfo.adminPhoneNumber,
            adminEmail: applicationInfo.adminEmail,
    
            includedPublishedPaper: applicationQuestions.includedPublishedPaper,
            creditAgreement: applicationQuestions.creditAgreement,
            patentApplied: applicationQuestions.patentApplied,
            includedFundingInfo: applicationQuestions.includedFundingInfo,
            amountRequested: applicationQuestions.amountRequested,
            dates: applicationQuestions.dates,
            continuation: applicationQuestions.continuation,
            ...(applicationQuestions.continuationYears && { continuationYears: applicationQuestions.continuationYears }),
            pdf: pdfUrl, 
        });

    } catch (error) {
        console.error("Error writing application data:", error);
        throw error;
    }
};

const mockApplicationInfo: ApplicationInfo = {
    title: "Cancer Research Grant",
    principalInvestigator: "Dr. John Smith",
    typesOfCancerAddressed: "Lung Cancer, Breast Cancer",
    namesOfStaff: "Alice, Bob, Carol",
    institution: "Health Research Institute",
    institutionAddress: "123 Research Blvd",
    institutionPhoneNumber: "123-456-7890",
    instituionEmail: "research@institute.edu",
    adminOfficialName: "Jane Doe",
    adminOfficialAddress: "456 Admin Street",
    adminPhoneNumber: "987-654-3210",
    adminEmail: "admin@institute.edu"
};

const mockApplicationQuestions: ApplicationQuestions = {
    includedPublishedPaper: "Yes",
    creditAgreement: "Yes",
    patentApplied: "No",
    includedFundingInfo: "Yes",
    amountRequested: 50000,
    dates: "2024-2025",
    continuation: true,
    continuationYears: "2 years"
};

const mockFile = new File([""], "mockfile.pdf"); 

writeApplicationInfo(mockApplicationInfo, mockApplicationQuestions, mockFile);