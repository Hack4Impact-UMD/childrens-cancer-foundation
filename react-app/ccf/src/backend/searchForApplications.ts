import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from '../../index';
import { ApplicationInfo, ApplicationQuestions } from '../../types/application-types';

export const searchApplications = async (
    feature: keyof ApplicationInfo, 
    searchString: string
) => {
  try {
        const lowercaseSearch = searchString.toLowerCase().trim();
        const applicationsRef = collection(db, 'applications');
        const searchApp = query(
                        applicationsRef, 
                        where(feature, '>=', searchString), 
                        where(feature, '<=', searchString + '\uf8ff')
                       );
        const querySnapshot = await getDocs(searchApp);
    
        const applications = querySnapshot.docs.map(doc => doc.data());
        const filteredApplication = applications.filter(
            app => String(app[feature]).toLowerCase().includes(lowercaseSearch)
    );
    
        return filteredApplication;
  } catch (error) {
        console.error("Error searching for applications:", error);
        throw error;
  }
};
