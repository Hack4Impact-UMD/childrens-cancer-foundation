import { collection, query, where, getDocs, orderBy, Query, DocumentData } from 'firebase/firestore';
import { db } from '../index';
import { ApplicationInfo, ApplicationQuestions } from '../types/application-types';

export interface FilterOptions {
    date?: string;
    decision?: string;
    grantType?: string;
}

export async function getFilteredApplications(filters: FilterOptions): Promise<Array<ApplicationInfo & ApplicationQuestions>> {
    try {
        // Start with the base collection reference
        let q: Query<DocumentData> = collection(db, 'applications');

        // Build the query based on provided filters
        const conditions = [];

        if (filters.date) {
            conditions.push(where('dates', '==', filters.date));
        }

        if (filters.decision) {
            conditions.push(where('decision', '==', filters.decision));
        }

        if (filters.grantType) {
            conditions.push(where('grantType', '==', filters.grantType));
        }

        // Create the query with all conditions
        q = query(q, ...conditions, orderBy('dates', 'desc'));

        // Execute the query
        const querySnapshot = await getDocs(q);
        
        // Map the results to the expected type
        const applications = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as unknown as Array<ApplicationInfo & ApplicationQuestions>;

        return applications;
    } catch (error) {
        console.error('Error fetching filtered applications:', error);
        throw error;
    }
} 