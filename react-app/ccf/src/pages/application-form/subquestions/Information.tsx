import { useState, ChangeEvent } from "react";
import "./SubForm.css";

interface InformationProps {
  formData: any;
  setFormData: (data: any) => void;
}

function Information({ formData, setFormData }: InformationProps): JSX.Element {

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

        <p className="text-label">Principal Investigator*</p>
        <input
          type="text"
          name="principalInvestigator"
          value={formData.principalInvestigator}
          onChange={handleChange}
          placeholder="Enter principal investigator"
          required
          className="text-input"
        />

        <p className="text-label">Types of typesOfCancerAddressed Being Addressed*</p>
        <input
          type="text"
          name="typesOfCancerAddressed"
          value={formData.typesOfCancerAddressed}
          onChange={handleChange}
          placeholder="Enter types of cancers"
          required
          className="text-input"
        />

        <p className="text-label">Name/Titles of Other Staff*</p>
        <input
          type="text"
          name="namesOfStaff"
          value={formData.namesOfStaff}
          onChange={handleChange}
          placeholder="Enter name/titles of other staff"
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

        <p className="text-label">Address of Institution*</p>
        <input
          type="text"
          name="institutionAddress"
          value={formData.institutionAddress}
          onChange={handleChange}
          placeholder="Enter address of Institution"
          required
          className="text-input"
        />
      </div>
      <div className="right-container">
        <p className="text-label">Institution Phone Number*</p>
        <input
          type="text"
          name="institutionPhoneNumber"
          value={formData.institutionPhoneNumber}
          onChange={handleChange}
          placeholder="Enter institution phone number"
          required
          className="text-input"
        />

        <p className="text-label">Institution Email*</p>
        <input
          type="text"
          name="institutionEmail"
          value={formData.institutionEmail}
          onChange={handleChange}
          placeholder="Enter institution email"
          required
          className="text-input"
        />

        <p className="text-label">Administration Official Name*</p>
        <input
          type="text"
          name="adminOfficialName"
          value={formData.adminOfficialName}
          onChange={handleChange}
          placeholder="Enter administration official"
          required
          className="text-input"
        />

        <p className="text-label">Address of Administration Official*</p>
        <input
          type="text"
          name="adminOfficialAddress"
          value={formData.adminOfficialAddress}
          onChange={handleChange}
          placeholder="Enter address of administration official"
          required
          className="text-input"
        />

        <p className="text-label">Administration Official Phone Number*</p>
        <input
          type="text"
          name="adminPhoneNumber"
          value={formData.adminPhoneNumber}
          onChange={handleChange}
          placeholder="Enter administration official phone number"
          required
          className="text-input"
        />

        <p className="text-label">Email of Administration Official*</p>
        <input
          type="text"
          name="adminEmail"
          value={formData.adminEmail}
          onChange={handleChange}
          placeholder="Enter administration official email"
          required
          className="text-input"
        />
      </div>
    </div>
  );
}

export default Information;
