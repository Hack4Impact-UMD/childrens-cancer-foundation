/**
 * Backend service for managing form templates
 * Handles CRUD operations for dynamic form templates with versioning
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
  writeBatch,
  DocumentSnapshot
} from 'firebase/firestore';
import { db } from '../index';
import { 
  FormTemplate, 
  FormTemplateVersion, 
  GrantType, 
  FormTemplateFilter,
  FormTemplateStats,
  DynamicApplication
} from '../types/form-template-types';

/**
 * Collection names
 */
const FORM_TEMPLATES_COLLECTION = 'formTemplates';
const FORM_TEMPLATE_VERSIONS_COLLECTION = 'formTemplateVersions';
const APPLICATIONS_COLLECTION = 'applications';

/**
 * Create a new form template
 */
export async function createFormTemplate(
  template: Omit<FormTemplate, 'id' | 'createdAt' | 'updatedAt'>,
  creatorEmail: string
): Promise<string> {
  try {
    const now = Timestamp.now();
    const newTemplate: Omit<FormTemplate, 'id'> = {
      ...template,
      createdAt: now,
      updatedAt: now,
      createdBy: creatorEmail,
      lastModifiedBy: creatorEmail,
      version: template.version || 1,
      isActive: false, // New templates start as drafts
      isPublished: false
    };

    const docRef = await addDoc(collection(db, FORM_TEMPLATES_COLLECTION), newTemplate);
    
    // Create initial version entry
    await createVersionEntry(docRef.id, newTemplate as FormTemplate);
    
    return docRef.id;
  } catch (error) {
    console.error('Error creating form template:', error);
    throw new Error('Failed to create form template');
  }
}

/**
 * Update an existing form template
 */
export async function updateFormTemplate(
  templateId: string,
  updates: Partial<FormTemplate>,
  modifierEmail: string,
  createNewVersion: boolean = false
): Promise<void> {
  try {
    const templateRef = doc(db, FORM_TEMPLATES_COLLECTION, templateId);
    const templateSnap = await getDoc(templateRef);
    
    if (!templateSnap.exists()) {
      throw new Error('Form template not found');
    }

    const currentTemplate = { id: templateId, ...templateSnap.data() } as FormTemplate;
    
    if (createNewVersion) {
      // Create a new version
      const newVersion = currentTemplate.version + 1;
      const newTemplate: Partial<FormTemplate> = {
        ...updates,
        version: newVersion,
        updatedAt: Timestamp.now(),
        lastModifiedBy: modifierEmail,
        parentVersionId: templateId
      };
      
      await updateDoc(templateRef, newTemplate);
      await createVersionEntry(templateId, { ...currentTemplate, ...newTemplate } as FormTemplate);
      
      // Notify that a form template has been updated (this will trigger form resets)
      if (currentTemplate.isActive) {
        await notifyFormTemplateChange(currentTemplate.grantType, 'version_updated');
      }
    } else {
      // Update current version
      const updatedTemplate: Partial<FormTemplate> = {
        ...updates,
        updatedAt: Timestamp.now(),
        lastModifiedBy: modifierEmail
      };
      
      await updateDoc(templateRef, updatedTemplate);
      
      // Notify that a form template has been updated (this will trigger form resets)
      if (currentTemplate.isActive) {
        await notifyFormTemplateChange(currentTemplate.grantType, 'updated');
      }
    }
  } catch (error) {
    console.error('Error updating form template:', error);
    throw new Error('Failed to update form template');
  }
}

/**
 * Get a form template by ID
 */
export async function getFormTemplate(templateId: string): Promise<FormTemplate | null> {
  try {
    const templateRef = doc(db, FORM_TEMPLATES_COLLECTION, templateId);
    const templateSnap = await getDoc(templateRef);
    
    if (!templateSnap.exists()) {
      return null;
    }
    
    return { id: templateId, ...templateSnap.data() } as FormTemplate;
  } catch (error) {
    console.error('Error getting form template:', error);
    throw new Error('Failed to get form template');
  }
}

/**
 * Get the active form template for a specific grant type
 */
export async function getActiveFormTemplate(grantType: GrantType): Promise<FormTemplate | null> {
  try {
    const q = query(
      collection(db, FORM_TEMPLATES_COLLECTION),
      where('grantType', '==', grantType),
      where('isActive', '==', true),
      where('isPublished', '==', true),
      limit(1)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }
    
    const doc = querySnapshot.docs[0];
    return { id: doc.id, ...doc.data() } as FormTemplate;
  } catch (error) {
    console.error('Error getting active form template:', error);
    throw new Error('Failed to get active form template');
  }
}

/**
 * Get all form templates with optional filtering
 */
export async function getFormTemplates(filter?: FormTemplateFilter): Promise<FormTemplate[]> {
  try {
    let q = query(collection(db, FORM_TEMPLATES_COLLECTION));
    
    // Apply filters
    if (filter?.grantType && filter.grantType !== 'all') {
      q = query(q, where('grantType', '==', filter.grantType));
    }
    
    if (filter?.status) {
      switch (filter.status) {
        case 'active':
          q = query(q, where('isActive', '==', true));
          break;
        case 'draft':
          q = query(q, where('isPublished', '==', false));
          break;
        case 'archived':
          q = query(q, where('isActive', '==', false), where('isPublished', '==', true));
          break;
      }
    }
    
    if (filter?.createdBy) {
      q = query(q, where('createdBy', '==', filter.createdBy));
    }
    
    // Order by creation date (newest first)
    q = query(q, orderBy('createdAt', 'desc'));
    
    const querySnapshot = await getDocs(q);
    const templates = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as FormTemplate[];
    
    // Apply client-side filters
    let filteredTemplates = templates;
    
    if (filter?.searchTerm) {
      const searchLower = filter.searchTerm.toLowerCase();
      filteredTemplates = templates.filter(template =>
        template.name.toLowerCase().includes(searchLower) ||
        template.metadata?.description?.toLowerCase().includes(searchLower)
      );
    }
    
    if (filter?.dateRange) {
      filteredTemplates = filteredTemplates.filter(template => {
        const createdDate = template.createdAt.toDate();
        return createdDate >= filter.dateRange!.start && createdDate <= filter.dateRange!.end;
      });
    }
    
    return filteredTemplates;
  } catch (error) {
    console.error('Error getting form templates:', error);
    throw new Error('Failed to get form templates');
  }
}

/**
 * Delete a form template (soft delete by setting isActive to false)
 */
export async function deleteFormTemplate(templateId: string): Promise<void> {
  try {
    const templateRef = doc(db, FORM_TEMPLATES_COLLECTION, templateId);
    
    // Check if template has any applications
    const applicationsQuery = query(
      collection(db, APPLICATIONS_COLLECTION),
      where('formTemplateId', '==', templateId)
    );
    
    const applicationsSnap = await getDocs(applicationsQuery);
    
    if (!applicationsSnap.empty) {
      // Soft delete - just deactivate
      await updateDoc(templateRef, {
        isActive: false,
        isPublished: false,
        updatedAt: Timestamp.now()
      });
    } else {
      // Hard delete if no applications use this template
      await deleteDoc(templateRef);
    }
  } catch (error) {
    console.error('Error deleting form template:', error);
    throw new Error('Failed to delete form template');
  }
}

/**
 * Activate a form template (deactivates others of the same grant type)
 */
export async function activateFormTemplate(templateId: string): Promise<void> {
  try {
    const batch = writeBatch(db);
    
    // Get the template to activate
    const templateToActivate = await getFormTemplate(templateId);
    if (!templateToActivate) {
      throw new Error('Template not found');
    }
    
    // Deactivate all other templates of the same grant type
    const existingActiveQuery = query(
      collection(db, FORM_TEMPLATES_COLLECTION),
      where('grantType', '==', templateToActivate.grantType),
      where('isActive', '==', true)
    );
    
    const existingActiveSnap = await getDocs(existingActiveQuery);
    existingActiveSnap.docs.forEach(doc => {
      batch.update(doc.ref, { isActive: false });
    });
    
    // Activate the target template
    const templateRef = doc(db, FORM_TEMPLATES_COLLECTION, templateId);
    batch.update(templateRef, {
      isActive: true,
      isPublished: true,
      updatedAt: Timestamp.now()
    });
    
    await batch.commit();
    
    // Notify that a form template has been activated (this will trigger form resets)
    await notifyFormTemplateChange(templateToActivate.grantType, 'activated');
  } catch (error) {
    console.error('Error activating form template:', error);
    throw new Error('Failed to activate form template');
  }
}

/**
 * Get version history for a form template
 */
export async function getFormTemplateVersions(templateId: string): Promise<FormTemplateVersion[]> {
  try {
    const q = query(
      collection(db, FORM_TEMPLATE_VERSIONS_COLLECTION),
      where('templateId', '==', templateId),
      orderBy('version', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as FormTemplateVersion[];
  } catch (error) {
    console.error('Error getting form template versions:', error);
    throw new Error('Failed to get form template versions');
  }
}

/**
 * Create a version entry for audit trail
 */
async function createVersionEntry(templateId: string, template: FormTemplate): Promise<void> {
  try {
    const versionEntry: Omit<FormTemplateVersion, 'id'> = {
      templateId,
      version: template.version,
      name: template.name,
      createdAt: Timestamp.now(),
      createdBy: template.lastModifiedBy,
      changeLog: template.changeLog,
      isActive: template.isActive,
      formData: template
    };
    
    await addDoc(collection(db, FORM_TEMPLATE_VERSIONS_COLLECTION), versionEntry);
  } catch (error) {
    console.error('Error creating version entry:', error);
    // Don't throw here as this is secondary to the main operation
  }
}

/**
 * Get form template statistics
 */
export async function getFormTemplateStats(templateId: string): Promise<FormTemplateStats | null> {
  try {
    // Get all applications using this template
    const applicationsQuery = query(
      collection(db, APPLICATIONS_COLLECTION),
      where('formTemplateId', '==', templateId)
    );
    
    const applicationsSnap = await getDocs(applicationsQuery);
    const applications = applicationsSnap.docs.map(doc => ({
      applicationId: doc.id,
      ...doc.data()
    })) as DynamicApplication[];
    
    if (applications.length === 0) {
      return null;
    }
    
    // Calculate basic stats
    const totalSubmissions = applications.length;
    const completedApplications = applications.filter(app => app.formData && Object.keys(app.formData).length > 0);
    const completionRate = (completedApplications.length / totalSubmissions) * 100;
    
    // For now, return basic stats
    // In the future, we could track more detailed analytics
    const stats: FormTemplateStats = {
      templateId,
      version: applications[0]?.formVersion || 1,
      totalSubmissions,
      completionRate,
      averageCompletionTime: 0, // Would need to track completion times
      fieldStats: [] // Would need to analyze field-level data
    };
    
    return stats;
  } catch (error) {
    console.error('Error getting form template stats:', error);
    return null;
  }
}

/**
 * Duplicate a form template
 */
export async function duplicateFormTemplate(
  templateId: string,
  newName: string,
  creatorEmail: string
): Promise<string> {
  try {
    const originalTemplate = await getFormTemplate(templateId);
    if (!originalTemplate) {
      throw new Error('Original template not found');
    }
    
    const duplicatedTemplate: Omit<FormTemplate, 'id' | 'createdAt' | 'updatedAt'> = {
      ...originalTemplate,
      name: newName,
      version: 1,
      isActive: false,
      isPublished: false,
      parentVersionId: templateId,
      changeLog: `Duplicated from ${originalTemplate.name}`
    };
    
    return await createFormTemplate(duplicatedTemplate, creatorEmail);
  } catch (error) {
    console.error('Error duplicating form template:', error);
    throw new Error('Failed to duplicate form template');
  }
}

/**
 * Notify that a form template has changed (for triggering form resets)
 */
async function notifyFormTemplateChange(
  grantType: GrantType,
  changeType: 'updated' | 'activated' | 'version_updated'
): Promise<void> {
  try {
    // This function could be extended to:
    // 1. Send notifications to users with draft applications
    // 2. Log the change for audit purposes
    // 3. Trigger cleanup of old application states
    
    console.log(`Form template changed for ${grantType}: ${changeType}`);
    
    // For now, we'll just log the change
    // In a production system, you might want to:
    // - Send push notifications to affected users
    // - Update a notification collection
    // - Trigger background cleanup tasks
    
  } catch (error) {
    console.error('Error notifying form template change:', error);
    // Don't throw here as this is a secondary operation
  }
}
