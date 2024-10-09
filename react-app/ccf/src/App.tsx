import  { useState, ChangeEvent, useEffect } from 'react';
import './App.css';
import { handleUpload, listAndDownloadPDFs } from './functions/storage';

function App() {
  const [file, setFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const [downloadStatus, setDownloadStatus] = useState<Array<{ name: string, url: string }>>([]);

  useEffect(() => {
    const fetchPDFsOnLoad = async () => {
      try {
        const files = await listAndDownloadPDFs();
        setDownloadStatus(files);
      } catch (error) {
        console.error('Error listing files:', error);
      }
    };
    fetchPDFsOnLoad();
  }, []);


  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const onUpload = async () => {
    if (!file) {
      setUploadStatus('Please select a file first!');
      return;
    }

    try {
      setUploadStatus('Uploading...');
      const result = await handleUpload(file);
      setUploadStatus(result);
      setFile(null);
      try {
        const files = await listAndDownloadPDFs();
        setDownloadStatus(files);  
      } catch (error) {
        console.error('Error listing files:', error);
      }

    } catch (error) {
      console.error('Upload failed', error);
      setUploadStatus('Upload failed. Please try again.');
    }
  };

  return (
    <div className="App">
      <p>Cloud Storage Demo (Ryan and Tara):</p>
      <input type="file" accept=".pdf" onChange={handleFileChange} />
      <button onClick={onUpload}>Upload PDF</button>
      <p>{uploadStatus}</p>
      <div>
        <h3>Available PDFs:</h3>
        <ul>
          {downloadStatus.length > 0 ? (downloadStatus.map((file, index) => (
            <li key={index}>
              <a href={file.url} target="_blank" rel="noopener noreferrer">{file.name}</a>
            </li>
          ))) : (<p>No PDFs available</p>)}
        </ul>
      </div>
    </div>
  );
}

export default App;
