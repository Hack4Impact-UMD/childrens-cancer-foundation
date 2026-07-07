import "./SubForm.css";
import { InformationProps } from "../../../types/application-types";
import FileUploadSection from "../Components/FileUploadSection";

function NRNarrative({ formData, setFormData }: InformationProps): JSX.Element {
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
        <FileUploadSection formData={formData} setFormData={setFormData} />
      </div>
    </div>
  );
}

export default NRNarrative;
