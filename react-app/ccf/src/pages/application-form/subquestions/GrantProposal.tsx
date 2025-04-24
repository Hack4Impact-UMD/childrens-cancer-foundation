import { useState, useRef } from "react";
import "./SubForm.css";
import { uploadFileToStorage } from "../../../storage/storage";

type GrantProposalProps = {
  type: "Research" | "NextGen";
  formData: any;
  setFormData: (data: any) => void;
};

function GrantProposal({ type, formData, setFormData }: GrantProposalProps): JSX.Element {
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

  const renderUploadSection = () => (
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

  const renderResearchContent = () => (
    <div className="form-container">
      <div className="proposal-text">
        <p className="text-label">In the Grant Proposal, make sure to include:</p>
        <ul className="text-label"><b>1. Cover Sheet</b></ul>
        <ul className="text-label"><b>2. Narrative</b> (no more than 6 pages)</ul>
        <ul className="text-label"><b>3. References Cited</b> (not included in 6 pages)</ul>
        <ul className="text-label"><b>4. Budget</b> (up to $100,000 for one year)</ul>
        <ul className="text-label"><b>5. Lay Summary</b>(~1/2 page recommended)</ul>
        <ul className="text-label"><b>6. Applicant's Statement of Long-term Career Goals</b>(~1 page)</ul>
        <ul className="text-label"><b>7. Mentor's Letter of Commitment</b></ul>
        <ul className="text-label"><b>8. Support Letter from Sponsoring Institution</b> (Hospital or University Department Chair, Division Director, or Dean, or equivalent)</ul>
        <ul className="text-label"><b>9. NIH Biosketch</b></ul>
        <br />
        <p className="text-label">Format:</p>
        <p className="text-label">
          The Narrative of the proposal should not exceed 6 pages and should use NIH standard:
          font 11 points or larger, no fewer than 6 lines per inch, and margins no smaller than 0.5"
          (top, bottom, left, and right). It is recommended to use Arial, Georgia, Helvetica, or Palatino Linotype.
        </p>
        <br />
        <br />
        {renderUploadSection()}
      </div>
    </div>
  );

  const renderNextGenContent = () => (
    <div className="form-container">
      <div className="proposal-text">
        <p className="text-label">In the Grant Proposal, make sure to include:</p>
        <ul className="text-label"><b>1. Cover Sheet</b></ul>
        <ul><b>2. If Re-submission or renewal</b>
          <ol className="text-labe indent" type="a"><li><p className="text-label">
            Please include a one (1) page Introduction. Applicants who have
            received a previous CCF grant may apply for continued funding, but
            must include the results of their current research, discuss the
            progress made in prior year(s), and state how continued funding will
            advance research in this area.
          </p></li></ol>
        </ul>
        <ul className="text-label"><b>3. Narrative</b> (no more than 6 pages)</ul>
        <ul className="text-label"><b>4. References Cited</b> (not included in 6 pages)</ul>
        <ul className="text-label"><b>5. CCF-specific References</b></ul>
        <ul className="text-label"><b>8. Budget</b> (up to $75,000 for one year)</ul>
        <ul className="text-label"><b>7. Lay Summary</b> (1-2 pages recommended)</ul>
        <ul className="text-label"><b>9. NIH Biosketch</b></ul>
        <br />
        <p className="text-label">Format:</p>
        <p className="text-label">
          The Narrative of the proposal should not exceed 6 pages and should use NIH standard:
          font 11 points or larger, no fewer than 6 lines per inch, and margins no smaller than 0.5"
          (top, bottom, left, and right). It is recommended to use Arial, Georgia, Helvetica, or Palatino Linotype.
        </p>
        <br />
        <br />
        {renderUploadSection()}
      </div>
    </div>
  );

  return type === "Research" ? renderResearchContent() : renderNextGenContent();
}

export default GrantProposal;
