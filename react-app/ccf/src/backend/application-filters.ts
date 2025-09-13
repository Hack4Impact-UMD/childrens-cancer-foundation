import { collection, query, where, getDocs, orderBy, Query, DocumentData } from 'firebase/firestore';
import { auth, db } from '../index';
import { Application, ApplicationDetails, ApplicationInfo, ApplicationQuestions, NonResearchApplication, ResearchApplication } from '../types/application-types';
import { getCurrentCycle } from './application-cycle';

export interface FilterOptions {
    date?: string;
    decision?: string;
    grantType?: string;
}

export async function getFilteredApplications(filters: FilterOptions): Promise<Array<(ResearchApplication | NonResearchApplication) & ApplicationDetails>> {
    try {
        // Start with the base collection reference
        let q: Query<DocumentData> = collection(db, 'applications');

        // Build the query based on provided filters
        const conditions = [];

        if (filters.date) {
            conditions.push(where('applicationCycle', '==', filters.date));
        }

        if (filters.decision) {
            conditions.push(where('decision', '==', filters.decision));
        }

        if (filters.grantType) {
            conditions.push(where('grantType', '==', filters.grantType));
        }

        // Create the query with all conditions
        q = query(q, ...conditions, orderBy('submitTime', 'desc'));

        // Execute the query
        const querySnapshot = await getDocs(q);

        // Map the results to the expected type
        const applications = querySnapshot.docs.map(doc => ({
            applicationId: doc.id,
            ...doc.data()
        })) as unknown as Array<Application>;

        return applications;
    } catch (error) {
        console.error('Error fetching filtered applications:', error);
        throw error;
    }
}

export async function getUsersCurrentCycleAppplications(): Promise<Array<Application>> {
    const user = auth.currentUser
    const uid = user?.uid
    console.log("Current user UID:", uid);
    
    if (!uid) {
        throw new Error("User not authenticated");
    }
    
    const currentCycle = await getCurrentCycle()
    console.log("Current cycle name:", currentCycle.name);
    
    let q: Query<DocumentData> = collection(db, 'applications');
    q = query(q, where("creatorId", "==", uid), where("applicationCycle", "==", currentCycle.name))
    
    console.log("Executing query for applications...");
    const querySnapshot = await getDocs(q)
    console.log("Query snapshot size:", querySnapshot.size);
    
    const applications = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    })) as unknown as Array<Application>;
    
    console.log("Found applications:", applications);
    
    // If no applications found, let's try a different approach
    if (applications.length === 0) {
        console.log("No applications found with current query. Trying alternative approaches...");
        
        // Try querying without the applicationCycle filter to see if there are any applications for this user
        const userOnlyQuery = query(collection(db, 'applications'), where("creatorId", "==", uid));
        const userOnlySnapshot = await getDocs(userOnlyQuery);
        console.log(`Found ${userOnlySnapshot.size} applications for user ${uid} across all cycles`);
        
        if (userOnlySnapshot.size > 0) {
            userOnlySnapshot.docs.forEach((doc, index) => {
                const data = doc.data();
                console.log(`User App ${index + 1}:`, {
                    id: doc.id,
                    creatorId: data.creatorId,
                    applicationCycle: data.applicationCycle,
                    grantType: data.grantType,
                    title: data.title
                });
            });
        }
    }
    
    return applications;
}