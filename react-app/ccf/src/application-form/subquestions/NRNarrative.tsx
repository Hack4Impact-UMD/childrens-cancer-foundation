import { useState, ChangeEvent } from "react";
import "./SubForm.css";

interface InformationProps {
  formData: any;
  setFormData: (data: any) => void;
}

function NRNarrative({ formData, setFormData }: InformationProps): JSX.Element {
  const [explanation, setExplanation] = useState("");
  const [institution, setInstitution] = useState("");
  const [institutionAddress, setInstitutionAddress] = useState("");
  const [institutionPhone, setInstitutionPhone] = useState("");
  const [institutionEmail, setInstitutionEmail] = useState("");
  const [amountRequested, setAmountRequested] = useState("");
  const [timeframe, setTimeframe] = useState("");
  const [additionalInfo, setAdditionalInfo] = useState("");

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prevData: any) => ({ ...prevData, [name]: value }));
  };

  return (
    <div className="form-container">
      <div className="left-container">
        <p className="text-label">Explain the Project requested and justify the need for your requested Project.</p>
        <input
          type="text"
          name="explanation"
          value={formData.explanation}
          onChange={handleChange}
          placeholder="Type Here"
          required
          className="text-input2"
        />

        <p className="text-label">We ask that you include other sources from which you are seeking to fund the Project and any other funding source, and/or the amount contributed by your Institution/Hospital. </p>
        <input
          type="text"
          name="sources"
          value={formData.sources}
          onChange={handleChange}
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

export default NRNarrative;
