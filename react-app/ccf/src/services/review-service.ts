import {
    collection,
    doc,
    addDoc,
    updateDoc,
    getDoc,
    getDocs,
    query,
    where,
    serverTimestamp,
    orderBy,
    setDoc,
    Timestamp
} from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";
import { db } from "../index";
import Review, { ReviewSummary } from "../types/review-types";

// Create a new review document in the reviews/{applicationId}/reviewers subcollection
export const createReview = async (review: Omit<Review, 'id'>): Promise<string> => {
    try {
        const reviewData = {
            ...review,
            status: 'not-started',
            feedback: {
                significance: '',
                approach: '',
                feasibility: '',
                investigator: '',
                summary: '',
                internal: ''
            },
            lastUpdated: serverTimestamp()
        };

        // Create the parent application document in reviews collection if it doesn't exist
        const reviewAppRef = doc(db, "reviews", review.applicationId);
        await setDoc(reviewAppRef, {
            applicationId: review.applicationId,
            createdAt: serverTimestamp()
        }, { merge: true });

        // Create the review in the reviewers subcollection
        const reviewersRef = collection(db, "reviews", review.applicationId, "reviewers");
        const docRef = await addDoc(reviewersRef, reviewData);
        return docRef.id;
    } catch (error) {
        console.error("Error creating review:", error);
        throw error;
    }
};

// Update an existing review
export const updateReview = async (applicationId: string, reviewId: string, updates: Partial<Review>): Promise<void> => {
    try {
        const reviewRef = doc(db, "reviews", applicationId, "reviewers", reviewId);
        await updateDoc(reviewRef, {
            ...updates,
            lastUpdated: serverTimestamp()
        });
    } catch (error) {
        console.error("Error updating review:", error);
        throw error;
    }
};

// Submit a review (mark as completed)
export const submitReview = async (applicationId: string, reviewId: string, score: number, feedback: Review['feedback']): Promise<void> => {
    try {
        const reviewRef = doc(db, "reviews", applicationId, "reviewers", reviewId);
        await updateDoc(reviewRef, {
            score,
            feedback,
            status: 'completed',
            submittedDate: serverTimestamp(),
            lastUpdated: serverTimestamp()
        });
    } catch (error) {
        console.error("Error submitting review:", error);
        throw error;
    }
};

// Get review by ID
export const getReviewById = async (applicationId: string, reviewId: string): Promise<Review | null> => {
    try {
        const reviewDoc = await getDoc(doc(db, "reviews", applicationId, "reviewers", reviewId));
        if (reviewDoc.exists()) {
            return { id: reviewDoc.id, ...reviewDoc.data() } as Review;
        }
        return null;
    } catch (error) {
        console.error("Error getting review:", error);
        throw error;
    }
};

// Get reviews for a specific application
export const getReviewsForApplication = async (applicationId: string): Promise<ReviewSummary> => {
    try {
        const functions = getFunctions();
        const getApplicationReviews = httpsCallable(functions, 'getApplicationReviews');
        
        const result = await getApplicationReviews({ applicationId });
        return result.data as ReviewSummary;
    } catch (error) {
        console.error("Error getting reviews for application:", error);
        throw error;
    }
};

// Get reviews assigned to a specific reviewer across all applications
export const getReviewsForReviewer = async (reviewerId: string): Promise<Review[]> => {
    try {
        // Get all application review documents from the reviews collection
        const reviewsCollectionSnapshot = await getDocs(collection(db, "reviews"));
        const allReviews: Review[] = [];

        // For each application, check its reviewers subcollection for reviews by this reviewer
        for (const appDoc of reviewsCollectionSnapshot.docs) {
            const reviewersRef = collection(db, "reviews", appDoc.id, "reviewers");
            const reviewerQuery = query(reviewersRef, where("reviewerId", "==", reviewerId));
            const reviewsSnapshot = await getDocs(reviewerQuery);

            reviewsSnapshot.forEach((reviewDoc) => {
                const data = reviewDoc.data()
                allReviews.push(
                    { 
                    id: reviewDoc.id, 
                    ...data, 
                    lastUpdated: data.lastUpdated ? (data.lastUpdated as Timestamp).toDate() : undefined,
                    submittedDate: data.submittedDate ? (data.submittedDate as Timestamp).toDate(): undefined,
                } as Review);
            });
        }

        // Sort by last updated date
        return allReviews.sort((a, b) => {
            if (a.lastUpdated && b.lastUpdated) {
                return b.lastUpdated.getTime() - a.lastUpdated.getTime();
            }
            return 0;
        });
    } catch (error) {
        console.error("Error getting reviews for reviewer:", error);
        throw error;
    }
};

// Find existing review for a reviewer and application
export const findReviewForReviewerAndApplication = async (
    applicationId: string,
    reviewerId: string
): Promise<Review | null> => {
    try {
        const reviewersRef = collection(db, "reviews", applicationId, "reviewers");
        const reviewerQuery = query(reviewersRef, where("reviewerId", "==", reviewerId));
        const reviewsSnapshot = await getDocs(reviewerQuery);

        if (!reviewsSnapshot.empty) {
            const reviewDoc = reviewsSnapshot.docs[0];
            return { id: reviewDoc.id, ...reviewDoc.data() } as Review;
        }

        return null;
    } catch (error) {
        console.error("Error finding review:", error);
        throw error;
    }
};

// Create reviews when assigning reviewers
export const assignReviewersToApplication = async (
    applicationId: string,
    primaryReviewerId: string,
    secondaryReviewerId: string
): Promise<void> => {
    try {
        // Create primary review in the reviews/{applicationId}/reviewers subcollection
        await createReview({
            applicationId,
            reviewerId: primaryReviewerId,
            reviewerType: 'primary',
            status: 'not-started',
            feedback: {
                significance: '',
                approach: '',
                feasibility: '',
                investigator: '',
                summary: '',
                internal: ''
            }
        });

        // Create secondary review in the reviews/{applicationId}/reviewers subcollection
        await createReview({
            applicationId,
            reviewerId: secondaryReviewerId,
            reviewerType: 'secondary',
            status: 'not-started',
            feedback: {
                significance: '',
                approach: '',
                feasibility: '',
                investigator: '',
                summary: '',
                internal: ''
            }
        });
    } catch (error) {
        console.error("Error assigning reviewers:", error);
        throw error;
    }
}; 