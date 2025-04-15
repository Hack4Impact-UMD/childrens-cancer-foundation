import { ref, uploadBytes, getDownloadURL, listAll } from "firebase/storage";
import { storage } from '../index'

export const uploadFileToStorage = async (file: File): Promise<string> => {


    const MAX_PDF_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB in bytes

    console.log("file type:"  + file.type);
    if (file.size > MAX_PDF_SIZE_BYTES) {
      throw new Error('PDF file size exceeds the 50MB limit.');
    }

    if (file.type !== "application/pdf"){
      throw new Error('File type not supported (ONLY pdf file type accepted).');
    }


    if (!file) {
      throw new Error('No file selected');
    }
  
    const storageRef = ref(storage, 'pdfs/' + file.name);
  
    try {
      const snapshot = await uploadBytes(storageRef, file);
      console.log('Uploaded a blob or file!');
      
      const downloadURL = await getDownloadURL(snapshot.ref);
      console.log('File available at', downloadURL);

      //TODO change this to return the URL of the file, so we can save it in firestore
      return 'File uploaded successfully!';
    } catch (error) {
      console.error('Upload failed', error);
      throw error;
    }
  };

export const downloadPDFsByName = async (names: string[]): Promise<Array<{ name: string, url: string }>> => {
  try {
    const files: Array<{ name: string, url: string }> = [];
    for (const name of names) {
      const fileRef = ref(storage, `pdfs/${name}`);
      const downloadURL = await getDownloadURL(fileRef);
      files.push({ name, url: downloadURL });  

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
