import { useState } from "react";
import './SubForm.css';

function Information(): JSX.Element {
    const [projectTitle, setProjectTitle] = useState('');
    const [investigator, setInvestigator] = useState('');
    const [cancers, setCancers] = useState('');
    const [staff, setStaff] = useState('');
    const [institution, setInstitution] = useState('');
    const [institutionAddress, setInstitutionAddress] = useState('');

    const [institutionPhone, setInstitutionPhone] = useState('');
    const [institutionEmail, setInstitutionEmail] = useState('');
    const [adminName, setAdminName] = useState('');
    const [adminAddress, setAdminAddress] = useState('');
    const [adminPhone, setAdminPhone] = useState('');
    const [adminEmail, setAdminEmail] = useState('');

  return (
    <div className="form-container">
        <div className="left-container">
            <p className="text-label">Title of Project*</p>
            <input type="text" onChange={e => setProjectTitle(e.target.value)} placeholder="Enter title of project" required className="text-input"/>

            <p className="text-label">Principal Investigator*</p>
            <input type="text" onChange={e => setInvestigator(e.target.value)} placeholder="Enter principal investigator" required className="text-input"/>

            <p className="text-label">Types of Cancers Being Addressed*</p>
            <input type="text" onChange={e => setCancers(e.target.value)} placeholder="Enter types of cancers" required className="text-input" />

            <p className="text-label">Name/Titles of Other Staff*</p>
            <input type="text" onChange={e => setStaff(e.target.value)} placeholder="Enter name/titles of other staff" required className="text-input" />

            <p className="text-label">Institution*</p>
            <input type="text" onChange={e => setInstitution(e.target.value)} placeholder="Enter institution" required className="text-input" />

            <p className="text-label">Address of Institution*</p>
            <input type="text" onChange={e => setInstitutionAddress(e.target.value)} placeholder="Enter address of Institution" required className="text-input" />

        </div>
        <div className="right-container">
            <p className="text-label">Phone Number*</p>
            <input type="text" onChange={e => setInstitutionPhone(e.target.value)} placeholder="Enter institution phone number" required className="text-input" />

            <p className="text-label">Email*</p>
            <input type="text" onChange={e => setInstitutionEmail(e.target.value)} placeholder="Enter institution email" required className="text-input" />

            <p className="text-label">Administration Official Name*</p>
            <input type="text" onChange={e => setAdminName(e.target.value)} placeholder="Enter administration official" required className="text-input" />

            <p className="text-label">Address of Administration Official*</p>
            <input type="text" onChange={e => setAdminAddress(e.target.value)} placeholder="Enter address of administration official" required className="text-input" />

            <p className="text-label">Phone Number*</p>
            <input type="text" onChange={e => setAdminPhone(e.target.value)} placeholder="Enter administration official phone number" required className="text-input" />

            <p className="text-label">Email*</p>
            <input type="text" onChange={e => setAdminEmail(e.target.value)} placeholder="Enter administration official email" required className="text-input" />
        </div>
    </div>
  );
}

export default Information;