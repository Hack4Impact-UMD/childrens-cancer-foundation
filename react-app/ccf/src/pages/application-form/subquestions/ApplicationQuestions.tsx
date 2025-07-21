import { useState } from "react";
import "./SubForm.css";

interface ApplicationQuestionsProps {
  formData: any;
  setFormData: (data: any) => void;
}

function ApplicationQuestions({ formData, setFormData }: ApplicationQuestionsProps): JSX.Element {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setFormData((prevData: any) => ({
      ...prevData,
      [name]: type === 'radio' && e.target.checked ? value : value,
    }));
  };

  return (
    <div className="form-container">
      <div className="left-container">
        <p className="text-label">
          I have included in this Grant Application any paper that I have
          published on this Grant topic while receiving CCF funding. *
        </p>
        <div className="radio-opts">
          <div className="radio-opt">
            <input type="radio" name="includedPublishedPaper" value="Yes" checked={formData.includedPublishedPaper === "Yes"} onChange={handleChange}/>
            <label className="radio-label">Yes</label>
          </div>
          <div className="radio-opt">
            <input type="radio" name="includedPublishedPaper" value="No" checked={formData.includedPublishedPaper === "No"} onChange={handleChange}/>
            <label className="radio-label">No</label>
          </div>

          <div className="radio-opt">
            <input type="radio" name="includedPublishedPaper" value="N/A" checked={formData.published === "N/A"} onChange={handleChange}/>
            <label className="radio-label">N/A</label>
          </div>
        </div>

        <p className="text-label">
          I am in the process of writing a paper on this Grant topic. I agree to
          give credit to CCF as a funder and will provide a copy of this paper
          when published. *
        </p>
        <div className="radio-opts">
          <div className="radio-opt">
            <input type="radio" name="creditAgreement" value="Yes" checked={formData.creditAgreement === "Yes"} onChange={handleChange}/>
            <label className="radio-label">Yes</label>
          </div>
          <div className="radio-opt">
            <input type="radio" name="creditAgreement" value="No" checked={formData.creditAgreement === "No"} onChange={handleChange}/>
            <label className="radio-label">No</label>
          </div>
          <div className="radio-opt">
            <input type="radio" name="creditAgreement" value="N/A" checked={formData.creditAgreement === "N/A"} onChange={handleChange}/>
            <label className="radio-label">N/A</label>
          </div>
        </div>

        <p className="text-label">
          I have applied for a Patent for discoveries in my prior years on this
          Grant topic, funded by CCF. *
        </p>
        <div className="radio-opts">
          <div className="radio-opt">
            <input type="radio" name="patentApplied"  value="Yes" checked={formData.patentApplied === "Yes"} onChange={handleChange}/>
            <label className="radio-label">Yes</label>
          </div>
          <div className="radio-opt">
            <input type="radio" name="patentApplied"  value="No" checked={formData.patentApplied === "No"} onChange={handleChange}/>
            <label className="radio-label">No</label>
          </div>
          <div className="radio-opt">
            <input type="radio" name="patentApplied" value="N/A" checked={formData.patentApplied === "N/A"} onChange={handleChange}/>
            <label className="radio-label">N/A</label>
          </div>
        </div>

        <p className="text-label">
          I have included information in my Biosketch on current sources of
          funding, and applications pending for sources of funding for same or
          similar grants as this Grant Proposal. *
        </p>
        <div className="radio-opts">
          <div className="radio-opt">
            <input type="radio" name="includedFundingInfo" value="Yes" checked={formData.includedFundingInfo === "Yes"} onChange={handleChange}/>
            <label className="radio-label">Yes</label>
          </div>

          <div className="radio-opt">
            <input type="radio" name="includedFundingInfo" value="No" checked={formData.includedFundingInfo === "No"} onChange={handleChange}/>
            <label className="radio-label">No</label>
          </div>
          <div className="radio-opt">
            <input type="radio" name="includedFundingInfo" value="N/A" checked={formData.includedFundingInfo === "N/A"} onChange={handleChange}/>
            <label className="radio-label">N/A</label>
          </div>
        </div>
      </div>
      <div className="right-container">
        <p className="text-label">Amount Requested *</p>
        <input
          type="text"
          placeholder="Enter amount requested"
          required
          className="text-input"
          name="amountRequested"
          value={formData.amountRequested}
          onChange={handleChange}
        />

        <p className="text-label">Dates of Grant Project *</p>
        <input
          type="text"
          placeholder="List dates of grant project"
          required
          className="text-input"
          name="dates"
          value={formData.dates}
          onChange={handleChange}
        />

        <p className="text-label">EIN # *</p>
        <input 
          type="text" 
          name="einNumber" 
          value={formData.einNumber} 
          onChange={handleChange} 
          placeholder="Enter EIN number" 
          required className="text-input" 
        />

          <div className="cont-current-funds">
            <p className="text-label">Continuation of Current Funding:</p>
            <div className="sub-radio-opts">
              <div className="sub-radio-opt">
                <input type="radio" name="continuation" value="Yes" checked={formData.continuation === "Yes"} onChange={handleChange}/>
                <label>Yes</label>
              </div>

              <div className="sub-radio-opt">
                <input type="radio" name="continuation" value="No" checked={formData.continuation === "No"} onChange={handleChange}/>
                <label>No</label>
              </div>
            </div>
          </div>
          <input
            type="text"
            placeholder="If yes, list years (ex. 2022)"
            className="text-input"
            name="continuationYears"
            value={formData.continuationYears}
            onChange={handleChange}
          />

          <div className="full-width-section">
            <div className="checkbox-row">
              <input 
                type="checkbox" 
                name="attestationHumanSubjects" 
                checked={formData.attestationHumanSubjects || false} 
                onChange={handleChange} 
                className="checkbox-input"
              />
              <label className="text-label">I attest that all Human Subjects Research protocols have been or will be approved by our IRB, and that all Animal Subjects Research has been or will be approved by the Animal Care and Use Committee.</label>
            </div>
            <div className="checkbox-row">
              <input 
                type="checkbox" 
                name="attestationCertification" 
                checked={formData.attestationCertification || false} 
                onChange={handleChange} 
              />
              <label className="text-label">I certify that everything in this cover sheet and included in the Grant Application is true to the best of my knowledge. I have read and recommend this Grant Proposal for CCF's consideration.</label>
            </div>
            <p className="text-label">Signature of Principal Investigator(s) *</p>
            <input 
              type="text" 
              name="signaturePI" 
              value={formData.signaturePI} 
              onChange={handleChange} 
              placeholder="Enter PI signature"
              required 
              className="text-input" 
            />
            <p className="text-label">Signature of Department Head *</p>
            <input 
              type="text" 
              name="signatureDeptHead" 
              value={formData.signatureDeptHead} 
              onChange={handleChange} 
              placeholder="Enter Dept Head signature" 
              required 
              className="text-input" 
            />
          </div>
        </div>
      </div>
  );
}

export default ApplicationQuestions;
