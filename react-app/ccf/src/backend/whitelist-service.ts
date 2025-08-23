import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, where, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '../index';
import { WhitelistEntry, WhitelistFormData } from '../types/whitelist-types';
import { auth } from '../index';

// Add a new email to the whitelist
export const addToWhitelist = async (formData: WhitelistFormData): Promise<void> => {
    try {
        const user = auth.currentUser;
        if (!user) {
            throw new Error('User not authenticated');
        }

        const whitelistData: Omit<WhitelistEntry, 'id'> = {
            email: formData.email.toLowerCase().trim(),
            firstName: formData.firstName.trim(),
            lastName: formData.lastName.trim(),
            affiliation: formData.affiliation.trim(),
            title: formData.title.trim(),
            addedAt: new Date(),
            addedBy: user.email || user.uid,
            status: 'active'
        };

        await addDoc(collection(db, 'reviewer-whitelist'), whitelistData);
    } catch (error) {
        console.error('Error adding to whitelist:', error);
        throw error;
    }
};

// Get all whitelist entries
export const getAllWhitelistEntries = async (): Promise<WhitelistEntry[]> => {
    try {
        const querySnapshot = await getDocs(
            query(
                collection(db, 'reviewer-whitelist'),
                orderBy('addedAt', 'desc')
            )
        );

        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            addedAt: doc.data().addedAt?.toDate() || new Date()
        })) as WhitelistEntry[];
    } catch (error) {
        console.error('Error fetching whitelist entries:', error);
        throw error;
    }
};

// Update whitelist entry status
export const updateWhitelistStatus = async (id: string, status: 'active' | 'inactive'): Promise<void> => {
    try {
        const docRef = doc(db, 'reviewer-whitelist', id);
        await updateDoc(docRef, { status });
    } catch (error) {
        console.error('Error updating whitelist status:', error);
        throw error;
    }
};

// Delete a whitelist entry
export const deleteWhitelistEntry = async (id: string): Promise<void> => {
    try {
        const docRef = doc(db, 'reviewer-whitelist', id);
        await deleteDoc(docRef);
    } catch (error) {
        console.error('Error deleting whitelist entry:', error);
        throw error;
    }
};

// Check if an email is in the whitelist
export const isEmailWhitelisted = async (email: string): Promise<boolean> => {
    try {
        const querySnapshot = await getDocs(
            query(
                collection(db, 'reviewer-whitelist'),
                where('email', '==', email.toLowerCase().trim()),
                where('status', '==', 'active')
            )
        );

        return !querySnapshot.empty;
    } catch (error) {
        console.error('Error checking whitelist status:', error);
        return false;
    }
};

// Get unique affiliations from whitelist
export const getUniqueAffiliations = async (): Promise<string[]> => {
    try {
        const entries = await getAllWhitelistEntries();
        const affiliations = entries
            .map(entry => entry.affiliation || entry.institution)
            .filter((affiliation): affiliation is string => affiliation !== undefined && affiliation !== null && affiliation.trim() !== '');

        const uniqueAffiliations = Array.from(new Set(affiliations)).sort();
        return uniqueAffiliations;
    } catch (error) {
        console.error('Error getting unique affiliations:', error);
        return [];
    }
};
