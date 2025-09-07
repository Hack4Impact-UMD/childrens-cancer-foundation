/**
 * Service for managing application state and version control
 * Handles form version tracking and application reset logic
 */

import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc,
  deleteDoc,
  query, 
  where, 
  orderBy,
  limit,
  Timestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from '../index';
import { FormTemplate, DynamicApplication, GrantType } from '../types/form-template-types';
import { getActiveFormTemplate } from './form-template-service';

/**
 * Collection names
 */
const APPLICATION_STATES_COLLECTION = 'applicationStates';
const APPLICATIONS_COLLECTION = 'applications';

/**
 * Application state interface for tracking in-progress applications
 */
export interface ApplicationState {
  id: string;
  applicantId: string;
  grantType: GrantType;
  formTemplateId: string;
  formVersion: number;
  formData: Record<string, any>;
  currentPageIndex: number;
  lastSaved: Timestamp;
  isDraft: boolean;
  applicationCycle: string;
  metadata?: {
    estimatedTime?: number;
    startedAt: Timestamp;
    lastAccessed: Timestamp;
  };
}

/**
 * Save application state (draft)
 */
export async function saveApplicationState(
  applicantId: string,
  grantType: GrantType,
  formTemplateId: string,
  formVersion: number,
  formData: Record<string, any>,
  currentPageIndex: number,
  applicationCycle: string
): Promise<string> {
  try {
    // Validate required fields
    if (!applicantId || !grantType || !formTemplateId || !applicationCycle) {
      throw new Error('Missing required fields for application state');
    }

    const now = Timestamp.now();
    
    // Clean form data to remove File objects and other non-Firestore-compatible types
    const cleanedFormData = cleanFormDataForFirestore(formData);
    
    // Check if there's an existing draft for this applicant and grant type
    const existingStateQuery = query(
      collection(db, APPLICATION_STATES_COLLECTION),
      where('applicantId', '==', applicantId),
      where('grantType', '==', grantType),
      where('isDraft', '==', true)
    );
    
    const existingStateSnap = await getDocs(existingStateQuery);
    
    if (!existingStateSnap.empty) {
      // Update existing draft
      const existingState = existingStateSnap.docs[0];
      const stateRef = doc(db, APPLICATION_STATES_COLLECTION, existingState.id);
      
      // Get the current metadata and update it
      const currentData = existingState.data();
      const updatedMetadata = {
        ...currentData.metadata,
        lastAccessed: now
      };
      
      await updateDoc(stateRef, {
        formTemplateId,
        formVersion,
        formData: cleanedFormData,
        currentPageIndex,
        lastSaved: now,
        metadata: updatedMetadata
      });
      
      return existingState.id;
    } else {
      // Create new draft
      const newState: Omit<ApplicationState, 'id'> = {
        applicantId,
        grantType,
        formTemplateId,
        formVersion,
        formData: cleanedFormData,
        currentPageIndex,
        lastSaved: now,
        isDraft: true,
        applicationCycle,
        metadata: {
          startedAt: now,
          lastAccessed: now
        }
      };
      
      const docRef = await addDoc(collection(db, APPLICATION_STATES_COLLECTION), newState);
      return docRef.id;
    }
  } catch (error) {
    console.error('Error saving application state:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      code: (error as any)?.code,
      details: (error as any)?.details
    });
    throw new Error('Failed to save application state');
  }
}

/**
 * Get application state for an applicant and grant type
 */
export async function getApplicationState(
  applicantId: string,
  grantType: GrantType
): Promise<ApplicationState | null> {
  try {
    const stateQuery = query(
      collection(db, APPLICATION_STATES_COLLECTION),
      where('applicantId', '==', applicantId),
      where('grantType', '==', grantType),
      where('isDraft', '==', true),
      orderBy('lastSaved', 'desc'),
      limit(1)
    );
    
    const stateSnap = await getDocs(stateQuery);
    
    if (stateSnap.empty) {
      return null;
    }
    
    const stateDoc = stateSnap.docs[0];
    return {
      id: stateDoc.id,
      ...stateDoc.data()
    } as ApplicationState;
  } catch (error) {
    console.error('Error getting application state:', error);
    return null;
  }
}

/**
 * Check if application state needs to be reset due to form version change
 */
export async function checkFormVersionCompatibility(
  applicantId: string,
  grantType: GrantType
): Promise<{
  needsReset: boolean;
  currentState?: ApplicationState | null;
  activeTemplate?: FormTemplate;
  reason?: string;
}> {
  try {
    // Get current application state
    const currentState = await getApplicationState(applicantId, grantType);
    
    // Get active form template
    const activeTemplate = await getActiveFormTemplate(grantType);
    
    if (!activeTemplate) {
      return {
        needsReset: true,
        currentState,
        reason: 'No active form template found'
      };
    }
    
    if (!currentState) {
      return {
        needsReset: false,
        activeTemplate
      };
    }
    
    // Check if form template has changed
    if (currentState.formTemplateId !== activeTemplate.id) {
      return {
        needsReset: true,
        currentState,
        activeTemplate,
        reason: 'Form template has been changed by admin'
      };
    }
    
    // Check if form version has changed
    if (currentState.formVersion !== activeTemplate.version) {
      return {
        needsReset: true,
        currentState,
        activeTemplate,
        reason: 'Form version has been updated by admin'
      };
    }
    
    return {
      needsReset: false,
      currentState,
      activeTemplate
    };
  } catch (error) {
    console.error('Error checking form version compatibility:', error);
    return {
      needsReset: true,
      reason: 'Error checking form compatibility'
    };
  }
}

/**
 * Reset application state (delete draft)
 */
export async function resetApplicationState(
  applicantId: string,
  grantType: GrantType
): Promise<void> {
  try {
    const stateQuery = query(
      collection(db, APPLICATION_STATES_COLLECTION),
      where('applicantId', '==', applicantId),
      where('grantType', '==', grantType),
      where('isDraft', '==', true)
    );
    
    const stateSnap = await getDocs(stateQuery);
    
    if (!stateSnap.empty) {
      const batch = writeBatch(db);
      stateSnap.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      await batch.commit();
    }
  } catch (error) {
    console.error('Error resetting application state:', error);
    throw new Error('Failed to reset application state');
  }
}

/**
 * Mark application state as submitted (no longer a draft)
 */
export async function markApplicationSubmitted(
  applicantId: string,
  grantType: GrantType,
  applicationId: string
): Promise<void> {
  try {
    const stateQuery = query(
      collection(db, APPLICATION_STATES_COLLECTION),
      where('applicantId', '==', applicantId),
      where('grantType', '==', grantType),
      where('isDraft', '==', true)
    );
    
    const stateSnap = await getDocs(stateQuery);
    
    if (!stateSnap.empty) {
      const batch = writeBatch(db);
      stateSnap.docs.forEach(doc => {
        batch.update(doc.ref, {
          isDraft: false,
          submittedApplicationId: applicationId,
          submittedAt: Timestamp.now()
        });
      });
      await batch.commit();
    }
  } catch (error) {
    console.error('Error marking application as submitted:', error);
    throw new Error('Failed to mark application as submitted');
  }
}

/**
 * Get all draft applications for an applicant
 */
export async function getDraftApplications(applicantId: string): Promise<ApplicationState[]> {
  try {
    const stateQuery = query(
      collection(db, APPLICATION_STATES_COLLECTION),
      where('applicantId', '==', applicantId),
      where('isDraft', '==', true),
      orderBy('lastSaved', 'desc')
    );
    
    const stateSnap = await getDocs(stateQuery);
    
    return stateSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as ApplicationState[];
  } catch (error) {
    console.error('Error getting draft applications:', error);
    return [];
  }
}

/**
 * Clean up old application states (older than 30 days)
 */
export async function cleanupOldApplicationStates(): Promise<void> {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const cutoffTime = Timestamp.fromDate(thirtyDaysAgo);
    
    const oldStatesQuery = query(
      collection(db, APPLICATION_STATES_COLLECTION),
      where('lastSaved', '<', cutoffTime),
      where('isDraft', '==', true)
    );
    
    const oldStatesSnap = await getDocs(oldStatesQuery);
    
    if (!oldStatesSnap.empty) {
      const batch = writeBatch(db);
      oldStatesSnap.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      await batch.commit();
      
      console.log(`Cleaned up ${oldStatesSnap.docs.length} old application states`);
    }
  } catch (error) {
    console.error('Error cleaning up old application states:', error);
  }
}

/**
 * Clean form data to remove File objects and other non-Firestore-compatible types
 */
function cleanFormDataForFirestore(formData: Record<string, any>): Record<string, any> {
  const cleaned: Record<string, any> = {};
  
  Object.entries(formData).forEach(([key, value]) => {
    if (value instanceof File) {
      // Store file name instead of File object
      cleaned[key] = value.name;
    } else if (value instanceof Date) {
      // Convert Date to string
      cleaned[key] = value.toISOString();
    } else if (value !== undefined && value !== null) {
      // Store other values as-is
      cleaned[key] = value;
    }
  });
  
  return cleaned;
}

/**
 * Get application state statistics
 */
export async function getApplicationStateStats(): Promise<{
  totalDrafts: number;
  draftsByGrantType: Record<GrantType, number>;
  oldestDraft?: Date;
}> {
  try {
    const draftsQuery = query(
      collection(db, APPLICATION_STATES_COLLECTION),
      where('isDraft', '==', true)
    );
    
    const draftsSnap = await getDocs(draftsQuery);
    const drafts = draftsSnap.docs.map(doc => doc.data()) as ApplicationState[];
    
    const stats = {
      totalDrafts: drafts.length,
      draftsByGrantType: {
        research: 0,
        nextgen: 0,
        nonresearch: 0
      } as Record<GrantType, number>,
      oldestDraft: undefined as Date | undefined
    };
    
    let oldestTimestamp: Timestamp | undefined;
    
    drafts.forEach(draft => {
      stats.draftsByGrantType[draft.grantType]++;
      
      if (!oldestTimestamp || draft.lastSaved < oldestTimestamp) {
        oldestTimestamp = draft.lastSaved;
      }
    });
    
    if (oldestTimestamp) {
      stats.oldestDraft = oldestTimestamp.toDate();
    }
    
    return stats;
  } catch (error) {
    console.error('Error getting application state stats:', error);
    return {
      totalDrafts: 0,
      draftsByGrantType: {
        research: 0,
        nextgen: 0,
        nonresearch: 0
      }
    };
  }
}
