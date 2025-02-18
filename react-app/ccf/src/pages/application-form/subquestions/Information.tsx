import { useState, ChangeEvent } from "react";
import "./SubForm.css";

interface InformationProps {
  formData: any;
  setFormData: (data: any) => void;
}

function Information({ formData, setFormData }: InformationProps): JSX.Element {
  const [projectTitle, setProjectTitle] = useState("");
  const [investigator, setInvestigator] = useState("");
  const [cancers, setCancers] = useState("");
  const [staff, setStaff] = useState("");
  const [institution, setInstitution] = useState("");
  const [institutionAddress, setInstitutionAddress] = useState("");

  const [institutionPhone, setInstitutionPhone] = useState("");
  const [institutionEmail, setInstitutionEmail] = useState("");
  const [adminName, setAdminName] = useState("");
  const [adminAddress, setAdminAddress] = useState("");
  const [adminPhone, setAdminPhone] = useState("");
  const [adminEmail, setAdminEmail] = useState("");

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
          name="projectTitle"
          value={formData.projectTitle}
          onChange={handleChange}
          placeholder="Enter title of project"
          required
          className="text-input"
        />

        <p className="text-label">Principal Investigator*</p>
        <input
          type="text"
          name="investigator"
          value={formData.investigator}
          onChange={handleChange}
          placeholder="Enter principal investigator"
          required
          className="text-input"
        />

        <p className="text-label">Types of Cancers Being Addressed*</p>
        <input
          type="text"
          name="cancers"
          value={formData.cancers}
          onChange={handleChange}
          placeholder="Enter types of cancers"
          required
          className="text-input"
        />

        <p className="text-label">Name/Titles of Other Staff*</p>
        <input
          type="text"
          name="staffNames"
          onChange={(e) => setStaff(e.target.value)}
          placeholder="Enter name/titles of other staff"
          required
          className="text-input"
        />

        <p className="text-label">Institution*</p>
        <input
          type="text"
          name="institutionName"
          value={formData.institutionName}
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
        <p className="text-label">Phone Number*</p>
        <input
          type="text"
          name="institutionPhone"
          value={formData.institutionPhone}
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

        <p className="text-label">Administration Official Name*</p>
        <input
          type="text"
          name="adminName"
          value={formData.adminName}
          onChange={handleChange}
          placeholder="Enter administration official"
          required
          className="text-input"
        />

        <p className="text-label">Address of Administration Official*</p>
        <input
          type="text"
          name="adminAddress"
          value={formData.adminAddress}
          onChange={handleChange}
          placeholder="Enter address of administration official"
          required
          className="text-input"
        />

        <p className="text-label">Phone Number*</p>
        <input
          type="text"
          name="adminPhone"
          value={formData.adminPhone}
          onChange={handleChange}
          placeholder="Enter administration official phone number"
          required
          className="text-input"
        />

        <p className="text-label">Email*</p>
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
