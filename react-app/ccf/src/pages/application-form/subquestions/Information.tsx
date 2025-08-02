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

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const {name, value, type} = e.target;
    let newValue: any = value;
    if (type === 'checkbox' && e.target instanceof HTMLInputElement) {newValue = e.target.checked;}
    setFormData((prevData: any) => ({...prevData, [name]: newValue}));
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
        <p className="text-label">Title of Project *</p>
        <input
          type="text"
          name="title"
          value={formData.title}
          onChange={handleChange}
          placeholder="Enter title of project"
          required
          className="text-input"
        />

        <p className="text-label">Principal Investigator Name/Title *</p>
        <input 
          type="text" 
          name="principalInvestigator" 
          value={formData.principalInvestigator} 
          onChange={handleChange} 
          placeholder="Enter PI name/title" 
          required 
          className="text-input" 
        />

        <p className="text-label">Other Staff Name/Title</p>
        <input 
          type="text" 
          name="otherStaff" 
          value={formData.otherStaff} 
          onChange={handleChange} 
          placeholder="Enter other staff name/title" 
          className="text-input" 
        />

        <div className="checkbox-row">
          <input type="checkbox" name="coPI" checked={formData.coPI || false} onChange={handleChange} />
          <label className="text-label">Co-PI?</label>
        </div>

        <p className="text-label">Institution *</p>
        <input
          type="text"
          name="institution"
          value={formData.institution}
          onChange={handleChange}
          placeholder="Enter institution"
          required
          className="text-input"
        />

        <p className="text-label">Department *</p>
        <input 
          type="text" 
          name="department" 
          value={formData.department} 
          onChange={handleChange} 
          placeholder="Enter department" 
          required 
          className="text-input" 
        />

        <p className="text-label">Department Head *</p>
        <input 
          type="text" 
          name="departmentHead" 
          value={formData.departmentHead} 
          onChange={handleChange} 
          placeholder="Enter department head name/title" 
          required 
          className="text-input" 
        />

        <p className="text-label">Street Address *</p>
        <input 
          type="text"  
          name="institutionAddress" 
          value={formData.institutionAddress} 
          onChange={handleChange} 
          placeholder="Enter street address" 
          required 
          className="text-input" 
        />

        <p className="text-label">City/St/Zip *</p>
        <input 
          type="text" 
          name="institutionCityStateZip" 
          value={formData.institutionCityStateZip} 
          onChange={handleChange} 
          placeholder="Enter city, state, zip" 
          required 
          className="text-input" 
        />

        <p className="text-label">Phone *</p>
        <input 
          type="text" 
          name="institutionPhoneNumber" 
          value={formData.institutionPhoneNumber} 
          onChange={handleChange} 
          onBlur={handleBlur} 
          placeholder="Enter phone number" 
          required 
          className={`text-input ${errors.institutionPhoneNumber ? 'invalid' : ''}`} 
        />
        {errors.institutionPhoneNumber && <p className="error-message">{errors.institutionPhoneNumber}</p>}

        <p className="text-label">Email *</p>
        <input 
          type="text" 
          name="institutionEmail" 
          value={formData.institutionEmail} 
          onChange={handleChange} 
          onBlur={handleBlur} 
          placeholder="Enter email" 
          required 
          className={`text-input ${errors.institutionEmail ? 'invalid' : ''}`} 
        />
        {errors.institutionEmail && <p className="error-message">{errors.institutionEmail}</p>}
      </div>


      <div className="right-container">
        <p className="text-label">Types of Cancer Being Addressed *</p>
        <input type="text" 
          name="typesOfCancerAddressed" 
          value={formData.typesOfCancerAddressed} 
          onChange={handleChange} 
          placeholder="Enter types of cancer" 
          required
          className="text-input" 
        />
        
        <p className="text-label">Administration Official Name/Title to be notified if awarded *</p>
        <input 
          type="text" 
          name="adminOfficialName" 
          value={formData.adminOfficialName} 
          onChange={handleChange} 
          placeholder="Enter admin official name/title" 
          required 
          className="text-input" 
        />

        <p className="text-label"> Admin Street Address *</p>
        <input 
          type="text" 
          name="adminOfficialAddress" 
          value={formData.adminOfficialAddress} 
          onChange={handleChange} 
          placeholder="Enter admin official address" 
          required 
          className="text-input" 
        />

        <p className="text-label">Admin City/St/Zip *</p>
        <input 
          type="text" 
          name="adminOfficialCityStateZip" 
          value={formData.adminOfficialCityStateZip} 
          onChange={handleChange} 
          placeholder="Enter admin city, state, zip" 
          required 
          className="text-input" 
        />

        <p className="text-label">Admin Phone Number *</p>
        <input 
          type="text"
          name="adminPhoneNumber" 
          value={formData.adminPhoneNumber} 
          onChange={handleChange} 
          onBlur={handleBlur} 
          placeholder="Enter admin phone number" 
          required 
          className={`text-input ${errors.adminPhoneNumber ? 'invalid' : ''}`} 
        />
        {errors.adminPhoneNumber && <p className="error-message">{errors.adminPhoneNumber}</p>}

        <p className="text-label">Admin Email *</p>
        <input 
          type="text" 
          name="adminEmail" 
          value={formData.adminEmail} 
          onChange={handleChange} 
          onBlur={handleBlur} 
          placeholder="Enter admin email" 
          required 
          className={`text-input ${errors.adminEmail ? 'invalid' : ''}`} 
        />
        {errors.adminEmail && <p className="error-message">{errors.adminEmail}</p>}
        </div>
      </div>
  );
}

export default Information;
