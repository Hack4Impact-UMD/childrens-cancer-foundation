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
    const currentCycle = await getCurrentCycle()
    let q: Query<DocumentData> = collection(db, 'applications');
    q = query(q, where("creatorId", "==", uid), where("applicationCycle", "==", currentCycle.name))
    const querySnapshot = await getDocs(q)
    const applications = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    })) as unknown as Array<Application>;
    return applications;
}