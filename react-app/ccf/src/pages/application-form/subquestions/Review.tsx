import { useState } from "react";
import "./SubForm.css";
import React from "react";

interface ReviewProps {
  type: any;
  formData: any;
  hideFile?: boolean;
}

/* Still need to add useState from information*/
function ReviewApplication({ type, formData, hideFile}: ReviewProps): JSX.Element {
  if (type === "NonResearch") return (
    <div className="review-form-container">
    <div className="proposal-text">
      <p className="text-label">Title of Project: {formData.title}</p>
      <p className="text-label">Principal Requestor: {formData.requestor}</p>
      <p className="text-label">Institution: {formData.institution}</p>
      <p className="text-label">Phone Number: {formData.institutionPhoneNumber}</p>
      <p className="text-label">Email: {formData.institutionEmail}</p>
      <p className = "text-label">Explain the Project requested and justify the need for your requested Project: {formData.explanation}</p>
      <br />
      <br />
      <p className="text-label">We ask that you include other sources from which you are seeking to fund the Project and any other funding source, and/or the amount contributed by your Institution/Hospital: {formData.sources}</p>
      <br />
      <br />
      <p className="text-label">Time Frame: {formData.timeframe}</p>
      <p className="text-label">Signature of Department Head or other person(s) designated to approve grant requests: {formData.signature}</p>
      {hideFile ? "": <p className="text-label">File: {formData.file?.name || 'No file uploaded'}</p>}
    </div>
  </div>
  );
    
    else return (
    <div className="review-form-container">
      <div className="proposal-text">
        <p className="text-label">Title of Project: {formData.title}</p>
        <p className="text-label">Principal Investigator Name/Title: {formData.principalInvestigator}</p>
        <p className="text-label">Other Staff Name/Title: {formData.otherStaff}</p>
        <p className="text-label">Institution: {formData.institution}</p>
        <p className="text-label">Department: {formData.department}</p>
        <p className="text-label">Department Head: {formData.departmentHead}</p>
        <p className="text-label">Street Address: {formData.institutionAddress}</p>
        <p className="text-label">City/St/Zip: {formData.institutionCityStateZip}</p>
        <p className="text-label">Phone: {formData.institutionPhoneNumber}</p>
        <p className="text-label">Email: {formData.institutionEmail}</p>
        <p className="text-label">Types of Cancer Being Addressed: {formData.typesOfCancerAddressed}</p>
        <p className="text-label">Administration Official Name/Title: {formData.adminOfficialName}</p>
        <p className="text-label">Admin Street Address: {formData.adminOfficialAddress}</p>
        <p className="text-label">Admin City/St/Zip: {formData.adminOfficialCityStateZip}</p>
        <p className="text-label">Admin Phone Number: {formData.adminPhoneNumber}</p>
        <p className="text-label">Admin Email: {formData.adminEmail}</p>
        <p className="text-label">Amount Requested: {formData.amountRequested}</p>
        <p className="text-label">Dates of Project: {formData.dates}</p>
        <p className="text-label">EIN #: {formData.einNumber}</p>
        <p className="text-label">Biosketch Funding Info: {formData.includedFundingInfo}</p>
        <p className="text-label">Attestation (Human/Animal Subjects): {formData.attestationHumanSubjects ? 'Yes' : 'No'}</p>
        <p className="text-label">Attestation (Certification): {formData.attestationCertification ? 'Yes' : 'No'}</p>
        <p className="text-label">Signature of Principal Investigator(s): {formData.signaturePI}</p>
        <p className="text-label">Signature of Department Head: {formData.signatureDeptHead}</p>
        {hideFile ? "": <p className="text-label">File: {formData.file?.name || 'No file uploaded'}</p>}
      </div>
    </div>
  );
}

export default ReviewApplication;
