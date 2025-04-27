import { useState, ChangeEvent } from "react";
import "./SubForm.css";

interface InformationProps {
  formData: any;
  setFormData: (data: any) => void;
}

function NRInformation({ formData, setFormData }: InformationProps): JSX.Element {

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prevData: any) => ({ ...prevData, [name]: value }));
  };

  return (
    <div className="form-container">
      <div className="left-container">
        <p className="text-label">Title of Project*</p>
        <input
          type="text"
          name="title"
          value={formData.title}
          onChange={handleChange}
          placeholder="Enter title of project"
          required
          className="text-input"
        />

        <p className="text-label">Principal Requestor*</p>
        <input
          type="text"
          name="requestor"
          value={formData.requestor}
          onChange={handleChange}
          placeholder="Enter principal requestor"
          required
          className="text-input"
        />

<p className="text-label">Institution*</p>
        <input
          type="text"
          name="institution"
          value={formData.institution}
          onChange={handleChange}
          placeholder="Enter institution"
          required
          className="text-input"
        />

<p className="text-label">Phone Number*</p>
        <input
          type="text"
          name="institutionPhoneNumber"
          value={formData.institutionPhoneNumber}
          onChange={handleChange}
          placeholder="Enter institution phone number"
          required
          className="text-input"
        />


<p className="text-label">Email*</p>
        <input
          type="text"
          name="institutionEmail"
          value={formData.institutionEmail}
          onChange={handleChange}
          placeholder="Enter institution email"
          required
          className="text-input"
        />


      </div>
      <div className="right-container">
        
      </div>
    </div>
  );
}

export default NRInformation;
