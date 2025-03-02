import "./SubForm.css";

function GrantForm(): JSX.Element {
  return (
    <div className="single-col-form-container">
      <p>In the Grant Proposal, make sure to include: </p>
      <ol type="1" className="list">
        <li>Cover Sheet</li>
        <li>If Re-submission or renewal</li>
        <p className="sublist">
          {" "}
          a. Please include a one (1) page Introduction. Applicants who have
          received a previous CCF grant may apply for continued funding, but
          must include the results of their current research, discuss the
          progress made in prior year(s), and state how continued funding will
          advance research in this area.
        </p>

        <div className="single-list">
          <li>Narrative</li> <p className="note">(no more than 6 pages)</p>
        </div>
        <div className="single-list">
          <li>References Cited</li>
          <p className="note">not included in 6 pages</p>
        </div>

        <div className="single-list">
          <li>CCF-specified References</li>
        </div>
        <div className="single-list">
          <li>Budget</li>
          <p className="note">(up to $70,000 for one year)</p>
        </div>
        <div className="single-list">
          <li>Lay Summary</li>
          <p className="note">1-2 pages recommended</p>
        </div>
        <li>NIH Biosketch</li>
      </ol>
      <p>Format:</p>
      <p>
        The Narrative of the proposal should not exceed 6 pages and should use
        NIH standard: font 11 points or larger, no fewer than 6 lines per inch,
        and margins no smaller than 0.5” (top, bottom, left and right.) It is
        recommended to use Arial, Georgia, Helvetica or Palatino Linotype.
      </p>

      <div className="upload-container">
        <p>Upload File (PDF Format)</p>
        <div className="upload-btn-container">
          <button className="upload-btn">Click to upload</button>
          <input 
          type="file" 
          accept=".pdf" 
           
          style={{ display: "none" }} 
          id="file-upload" 
        />
          <button className="del-icon-container">
            <div className="del-icon"></div>
          </button>
        </div>
      </div>
    </div>
  );
}

export default GrantForm;
