import { useState, useRef } from "react";
import "../subquestions/SubForm.css";

type FileUploadSectionProps = {
  formData: any;
  setFormData: (data: any) => void;
};

function FileUploadSection({ formData, setFormData }: FileUploadSectionProps): JSX.Element {
  const [selectedFile, setSelectedFile] = useState<File | null>(formData.file);
  const [uploadStatus, setUploadStatus] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(formData.file);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      console.log("File selected:", event.target.files[0].name);
      setSelectedFile(event.target.files[0]);
      setFormData({ ...formData, file: event.target.files[0] });
      setUploadStatus("");
    }
  };

  const handleDelete = () => {
    console.log("Delete button pressed");
    setSelectedFile(null);
    setFormData({ ...formData, file: null });
    setUploadStatus("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleUploadClick = () => {
    console.log("Upload button clicked - opening file selector");
    fileInputRef.current?.click();
  };

  return (
    <div className="file-upload">
      <label>Upload File (PDF Format)</label>
      <br />
      <br />
      <div className="upload-btn-container">
        <button
          className="upload-btn1"
          onClick={handleUploadClick}
        >
          {selectedFile ? selectedFile.name : "Click to upload"}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          onChange={handleFileChange}
          style={{ display: "none" }}
          id="file-upload"
        />
        {selectedFile && (
          <button className="del-icon-container" onClick={handleDelete}>
            <div className="del-icon"></div>
          </button>
        )}
      </div>
      {uploadStatus && <p className="upload-status">{uploadStatus}</p>}
    </div>
  );
}

export default FileUploadSection;
