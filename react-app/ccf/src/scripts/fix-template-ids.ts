import { db } from '../index';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';

/**
 * Emergency script to fix template IDs in Firestore
 * This will update all form templates to have their proper document ID
 */
export const fixTemplateIds = async (): Promise<void> => {
  try {
    console.log('🔧 Starting template ID fix...');
    
    const templatesRef = collection(db, 'formTemplates');
    const snapshot = await getDocs(templatesRef);
    
    const updatePromises = snapshot.docs.map(async (document) => {
      const docId = document.id;
      const data = document.data();
      
      console.log(`Fixing template: ${data.name} (${docId})`);
      
      // Update the document to have the correct ID field
      const templateRef = doc(db, 'formTemplates', docId);
      await updateDoc(templateRef, {
        id: docId  // Set the ID field to the actual document ID
      });
      
      console.log(`✅ Fixed template: ${data.name}`);
    });
    
    await Promise.all(updatePromises);
    
    console.log('🎉 All template IDs fixed successfully!');
    
  } catch (error) {
    console.error('❌ Error fixing template IDs:', error);
    throw error;
  }
};

// Export for standalone execution
if (typeof window === 'undefined') {
  // Running in Node.js environment
  fixTemplateIds().then(() => {
    console.log('Script completed successfully');
    process.exit(0);
  }).catch(error => {
    console.error('Script failed:', error);
    process.exit(1);
  });
}
