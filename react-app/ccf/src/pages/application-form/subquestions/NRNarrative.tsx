import { useState, useRef } from "react";
import "./SubForm.css";

interface InformationProps {
  formData: any;
  setFormData: (data: any) => void;
}

function NRNarrative({ formData, setFormData }: InformationProps): JSX.Element {
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prevData: any) => ({ ...prevData, [name]: value }));
  };

  const handleChangeTextArea = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prevData: any) => ({ ...prevData, [name]: value }));
  };

  return (
    <div className="form-container">
      <div className="left-container">
        <p className="text-label">Explain the Project requested and justify the need for your requested Project.</p>
        <textarea
          name="explanation"
          value={formData.explanation}
          onChange={handleChangeTextArea}
          placeholder="Type Here"
          required
          className="text-input2"
        />

        <p className="text-label">We ask that you include other sources from which you are seeking to fund the Project and any other funding source, and/or the amount contributed by your Institution/Hospital. </p>
        <textarea
          name="sources"
          value={formData.sources}
          onChange={handleChangeTextArea}
          placeholder="Type Here"
          required
          className="text-input2"
        />
      </div>
      <div className="right-container">
        <p className="text-label">Amount Requested*</p>
        <input
          type="text"
          name="amountRequested"
          value={formData.amountRequested}
          onChange={handleChange}
          placeholder="Enter amount requested"
          required
          className="text-input"
        />

        <p className="text-label">Time Frame*</p>
        <input
          type="text"
          name="timeframe"
          value={formData.timeframe}
          onChange={handleChange}
          placeholder="List start and end dates of project"
          required
          className="text-input"
        />

        <p className="text-label">Additional Information</p>
        <input
          type="text"
          name="additionalInfo"
          value={formData.additionalInfo}
          onChange={handleChange}
          placeholder="Type Here"
          className="text-input"
        />
        <br /><br /><br />
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
      </div>
    </div>
  );
}

export default NRNarrative;
