import { doc, getDoc, setDoc, collection, query, where, getDocs } from "firebase/firestore"
import Review from "../types/review-types"
import {db} from "../index"
import { getCurrentCycle } from "./application-cycle";

export const submitReview = async (review: Review) => { 
    try {
        const reviewsRef = doc(db, 'reviews');
        await setDoc(reviewsRef, review)
    } catch (e) {
        throw e
    }
}

export const getReviewByID = async (id: string): Promise<Review> => { 
    try {
        const reviewsRef = doc(db, 'reviews', id);
        const querySnapshot = await getDoc(reviewsRef);
        return querySnapshot.data() as Review
    } catch (e) {
        throw e
    }
}

export const getCurrentCycleReviewsByReviewer = async (uid: string): Promise<Review[]> => { 
    try {
        const currentCycle = await getCurrentCycle()
        const reviewsRef = collection(db, 'reviews');
        let q = query(reviewsRef, where('reviewer', '==', uid))
        q = query(q, where('cycle', '==', currentCycle))
        const querySnapshot = await getDocs(q);
        const reviews: Review[] = []
        querySnapshot.forEach((doc) => {
            reviews.push(doc.data() as Review)
        })
        return reviews
    } catch (e) {
        throw e
    }
}