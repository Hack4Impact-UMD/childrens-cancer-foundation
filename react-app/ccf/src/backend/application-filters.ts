import { collection, query, where, getDocs, Query, DocumentData } from 'firebase/firestore';
import { auth, db } from '../index';
import { Application, ApplicationDetails, NonResearchApplication, ResearchApplication } from '../types/application-types';
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

        // Apply all provided filter conditions to the query
        if (conditions.length > 0) {
            q = query(q, ...conditions);
        }

        // Execute the query
        const querySnapshot = await getDocs(q);

        // Map the results to the expected type. Drafts share this collection, so
        // exclude them (filtered client-side so submitted docs that predate the
        // status field are still included).
        const applications = querySnapshot.docs
            .filter(doc => doc.data().status !== 'draft')
            .map(doc => ({
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
    const user = auth.currentUser;
    if (!user) throw new Error("User is not authenticated.");
    const currentCycle = await getCurrentCycle();
    let q: Query<DocumentData> = collection(db, 'applications');
    q = query(q, where("creatorId", "==", user.uid), where("applicationCycle", "==", currentCycle.name));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs
        // Drafts live in the same collection; exclude them so they don't show up
        // as "completed" submitted applications. (Filtered client-side so submitted
        // docs that predate the status field are still included.)
        .filter(doc => doc.data().status !== 'draft')
        .map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as unknown as Array<Application>;
}

export async function getUsersAllApplications(): Promise<Array<Application>> {
    const user = auth.currentUser;
    if (!user) throw new Error("User is not authenticated.");
    let q: Query<DocumentData> = collection(db, 'applications');
    q = query(q, where("creatorId", "==", user.uid));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    })) as unknown as Array<Application>;
}