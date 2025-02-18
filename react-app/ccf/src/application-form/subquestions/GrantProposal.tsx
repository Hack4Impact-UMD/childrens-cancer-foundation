import { useState } from "react";
import "./SubForm.css";

type GrantProposalProps = {
  type: "Research" | "NextGen";
};

function GrantProposal({ type }: GrantProposalProps): JSX.Element {
  if (type === "Research") return (
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
        font 11 points or larger, no fewer than 6 lines per inch, and margins no smaller than 0.5”
        (top, bottom, left, and right). It is recommended to use Arial, Georgia, Helvetica, or Palatino Linotype.
      </p>
      <br />
      <br />
      <div className="file-upload">
        <label>Upload File (PDF Format)</label>
        <br />
        <br />
        <div className="upload-btn-container">
          <button className="upload-btn1">Click to upload</button>
          <button className="del-icon-container">
            <div className="del-icon"></div>
          </button>
        </div> 
      </div>
</div>
    </div>
  );
  else return (
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
        font 11 points or larger, no fewer than 6 lines per inch, and margins no smaller than 0.5”
        (top, bottom, left, and right). It is recommended to use Arial, Georgia, Helvetica, or Palatino Linotype.
      </p>
      <br />
      <br />
      <div className="file-upload">
        <label>Upload File (PDF Format)</label>
        <br />
        <br />
        <div className="upload-btn-container">
          <button className="upload-btn1">Click to upload</button>
          <button className="del-icon-container">
            <div className="del-icon"></div>
          </button>
        </div> 
      </div>
</div>
  </div>
  );
}

export default GrantProposal;
