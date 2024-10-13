import { ref, uploadBytes, getDownloadURL, listAll } from "firebase/storage";
import { storage } from '../index'

export const uploadFileToStorage = async (file: File): Promise<string> => {
    if (!file) {
      throw new Error('No file selected');
    }
  
    const storageRef = ref(storage, 'pdfs/' + file.name);
  
    try {
      const snapshot = await uploadBytes(storageRef, file);
      console.log('Uploaded a blob or file!');
      
      const downloadURL = await getDownloadURL(snapshot.ref);
      console.log('File available at', downloadURL);
      
      return 'File uploaded successfully!';
    } catch (error) {
      console.error('Upload failed', error);
      throw error;
    }
  };

export const downloadSpecificPDFS = async (arr: string[]): Promise<Array<{ name: string, url: string }>> => {
  try {
    const listRef = ref(storage, 'pdfs/');
    const listResponse = await listAll(listRef);
    const files: Array<{ name: string, url: string }> = [];
    for (const itemRef of listResponse.items) {
      if (arr.includes(itemRef.name)) {
        const downloadURL = await getDownloadURL(itemRef);
        files.push({ name: itemRef.name, url: downloadURL });  
      }
    }
    return files;
  } catch (error) {
    console.error("Error listing files:", error);
    throw error;
  }
  
}

  export const listAndDownloadAllPDFs = async (): Promise<Array<{ name: string, url: string }>> => {
    try {
      const listRef = ref(storage, 'pdfs/');
      const listResponse = await listAll(listRef);
      const files: Array<{ name: string, url: string }> = [];
      for (const itemRef of listResponse.items) {
        const downloadURL = await getDownloadURL(itemRef);
        files.push({ name: itemRef.name, url: downloadURL });
      }
      return files;
    } catch (error) {
      console.error("Error listing files:", error);
      throw error;
    }
};
