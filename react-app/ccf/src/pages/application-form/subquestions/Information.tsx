import { ChangeEvent, FocusEvent } from "react";
import "./SubForm.css";
import { validateEmail, validatePhoneNumber } from "../../../utils/validation";

interface InformationProps {
  formData: any;
  setFormData: (data: any) => void;
  errors: any;
  setErrors: (errors: any) => void;
}

function Information({ formData, setFormData, errors, setErrors }: InformationProps): JSX.Element {

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prevData: any) => ({ ...prevData, [name]: value }));
    if (errors[name]) {
      setErrors((prevErrors: any) => ({ ...prevErrors, [name]: "" }));
    }
  };

  const handleBlur = (e: FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let error: string | null = "";
    if (value.trim() === '') {
      error = "This field cannot be empty.";
    } else if (name === "institutionEmail" || name === "adminEmail") {
      error = validateEmail(value);
    } else if (name === "institutionPhoneNumber" || name === "adminPhoneNumber") {
      error = validatePhoneNumber(value);
    }
    setErrors((prevErrors: any) => ({ ...prevErrors, [name]: error || "" }));
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

        <p className="text-label">Types of Cancer Being Addressed*</p>
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
          onBlur={handleBlur}
          placeholder="Enter institution phone number"
          required
          className={`text-input ${errors.institutionPhoneNumber ? 'invalid' : ''}`}
        />
        {errors.institutionPhoneNumber && <p className="error-message">{errors.institutionPhoneNumber}</p>}

        <p className="text-label">Institution Email*</p>
        <input
          type="text"
          name="institutionEmail"
          value={formData.institutionEmail}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder="Enter institution email"
          required
          className={`text-input ${errors.institutionEmail ? 'invalid' : ''}`}
        />
        {errors.institutionEmail && <p className="error-message">{errors.institutionEmail}</p>}

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
          onBlur={handleBlur}
          placeholder="Enter administration official phone number"
          required
          className={`text-input ${errors.adminPhoneNumber ? 'invalid' : ''}`}
        />
        {errors.adminPhoneNumber && <p className="error-message">{errors.adminPhoneNumber}</p>}

        <p className="text-label">Email of Administration Official*</p>
        <input
          type="text"
          name="adminEmail"
          value={formData.adminEmail}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder="Enter administration official email"
          required
          className={`text-input ${errors.adminEmail ? 'invalid' : ''}`}
        />
        {errors.adminEmail && <p className="error-message">{errors.adminEmail}</p>}
      </div>
    </div>
  );
}

export default Information;
