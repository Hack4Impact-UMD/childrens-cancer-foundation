import { useState } from "react";
import "./SubForm.css";
import React from "react";
import { ReviewProps } from "../../../types/application-types";

/* Still need to add useState from information*/
function ReviewApplication({ type, formData, hideFile }: ReviewProps): JSX.Element {
  if (type === "NonResearch") return (
    <div className="review-form-container">
      <div className="proposal-text">
        <div className="detail-card">
          <h3 className="card-title">Project Information</h3>
          <div className="detail-grid">
            <div className="detail-item">
              <span className="detail-label">Title of Project</span>
              <span className="detail-value">{formData.title || "N/A"}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Principal Requestor</span>
              <span className="detail-value">{formData.requestor || "N/A"}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Institution</span>
              <span className="detail-value">{formData.institution || "N/A"}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Phone Number</span>
              <span className="detail-value">{formData.institutionPhoneNumber || "N/A"}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Email</span>
              <span className="detail-value">{formData.institutionEmail || "N/A"}</span>
            </div>
          </div>
        </div>

        <div className="detail-card">
          <h3 className="card-title">Project Details</h3>
          <div className="detail-grid">
            <div className="detail-item full-width">
              <span className="detail-label">Project Explanation</span>
              <span className="detail-value">{formData.explanation || "N/A"}</span>
            </div>
            <div className="detail-item full-width">
              <span className="detail-label">Funding Sources</span>
              <span className="detail-value">{formData.sources || "N/A"}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Time Frame</span>
              <span className="detail-value">{formData.timeframe || "N/A"}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Department Head Signature</span>
              <span className="detail-value">{formData.signature || "N/A"}</span>
            </div>
          </div>
        </div>

        {!hideFile && (
          <div className="detail-card">
            <h3 className="card-title">Attachments</h3>
            <div className="detail-item">
              <span className="detail-label">File</span>
              <span className="detail-value">{formData.file?.name || 'No file uploaded'}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  else return (
    <div className="review-form-container">
      <div className="proposal-text">
        {/* Project Information Card */}
        <div className="detail-card">
          <h3 className="card-title">Project Information</h3>
          <div className="detail-grid">
            <div className="detail-item full-width">
              <span className="detail-label">Title of Project</span>
              <span className="detail-value">{formData.title || "N/A"}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Principal Investigator Name/Title</span>
              <span className="detail-value">{formData.principalInvestigator || "N/A"}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Other Staff Name/Title</span>
              <span className="detail-value">{formData.otherStaff || "N/A"}</span>
            </div>
          </div>
        </div>

        {/* Institution Information Card */}
        <div className="detail-card">
          <h3 className="card-title">Institution Information</h3>
          <div className="detail-grid">
            <div className="detail-item">
              <span className="detail-label">Institution</span>
              <span className="detail-value">{formData.institution || "N/A"}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Department</span>
              <span className="detail-value">{formData.department || "N/A"}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Department Head</span>
              <span className="detail-value">{formData.departmentHead || "N/A"}</span>
            </div>
            <div className="detail-item full-width">
              <span className="detail-label">Street Address</span>
              <span className="detail-value">{formData.institutionAddress || "N/A"}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">City/State/Zip</span>
              <span className="detail-value">{formData.institutionCityStateZip || "N/A"}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Phone</span>
              <span className="detail-value">{formData.institutionPhoneNumber || "N/A"}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Email</span>
              <span className="detail-value">{formData.institutionEmail || "N/A"}</span>
            </div>
          </div>
        </div>

        {/* Research Details Card */}
        <div className="detail-card">
          <h3 className="card-title">Research Details</h3>
          <div className="detail-grid">
            <div className="detail-item full-width">
              <span className="detail-label">Types of Cancer Being Addressed</span>
              <span className="detail-value">{formData.typesOfCancerAddressed || "N/A"}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Amount Requested</span>
              <span className="detail-value">{formData.amountRequested || "N/A"}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Dates of Project</span>
              <span className="detail-value">{formData.dates || "N/A"}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">EIN Number</span>
              <span className="detail-value">{formData.einNumber || "N/A"}</span>
            </div>
          </div>
        </div>

        {/* Administrative Information Card */}
        <div className="detail-card">
          <h3 className="card-title">Administrative Information</h3>
          <div className="detail-grid">
            <div className="detail-item">
              <span className="detail-label">Administration Official Name/Title</span>
              <span className="detail-value">{formData.adminOfficialName || "N/A"}</span>
            </div>
            <div className="detail-item full-width">
              <span className="detail-label">Admin Street Address</span>
              <span className="detail-value">{formData.adminOfficialAddress || "N/A"}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Admin City/State/Zip</span>
              <span className="detail-value">{formData.adminOfficialCityStateZip || "N/A"}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Admin Phone Number</span>
              <span className="detail-value">{formData.adminPhoneNumber || "N/A"}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Admin Email</span>
              <span className="detail-value">{formData.adminEmail || "N/A"}</span>
            </div>
          </div>
        </div>

        {/* Additional Information Card */}
        <div className="detail-card">
          <h3 className="card-title">Additional Information</h3>
          <div className="detail-grid">
            <div className="detail-item">
              <span className="detail-label">Biosketch Funding Info</span>
              <span className="detail-value">{formData.includedFundingInfo || "N/A"}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Attestation (Human/Animal Subjects)</span>
              <span className="detail-value">{formData.attestationHumanSubjects ? 'Yes' : 'No'}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Attestation (Certification)</span>
              <span className="detail-value">{formData.attestationCertification ? 'Yes' : 'No'}</span>
            </div>
          </div>
        </div>

        {/* Signatures Card */}
        <div className="detail-card">
          <h3 className="card-title">Signatures</h3>
          <div className="detail-grid">
            <div className="detail-item">
              <span className="detail-label">Signature of Principal Investigator(s)</span>
              <span className="detail-value">{formData.signaturePI || "N/A"}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Signature of Department Head</span>
              <span className="detail-value">{formData.signatureDeptHead || "N/A"}</span>
            </div>
          </div>
        </div>

        {!hideFile && (
          <div className="detail-card">
            <h3 className="card-title">Attachments</h3>
            <div className="detail-item">
              <span className="detail-label">File</span>
              <span className="detail-value">{formData.file?.name || 'No file uploaded'}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ReviewApplication;
