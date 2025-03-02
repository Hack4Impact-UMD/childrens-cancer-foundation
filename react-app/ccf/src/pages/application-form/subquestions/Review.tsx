import { useState } from "react";
import "./SubForm.css";
import React from "react";

interface ReviewProps {
  type: any;
  formData: any;
}

/* Still need to add useState from information*/
function Review({ type, formData }: ReviewProps): JSX.Element {
  if (type === "NonResearch") return (
    <div className="review-form-container">
    <div className="proposal-text">
      <p className="text-label">Title of Project: {formData.projectTitle}</p>
      <p className="text-label">Principal Requestor: {formData.requestor}</p>
      <p className="text-label">Institution: {formData.institution}</p>
      <p className="text-label">Phone Number: {formData.institutionPhone}</p>
      <p className="text-label">Email: {formData.institutionEmail}</p>
      <p className = "text-label">Explain the Project requested and justify the need for your requested Project: {formData.explanation}</p>
      <br />
      <br />
      <p className="text-label">We ask that you include other sources from which you are seeking to fund the Project and any other funding source, and/or the amount contributed by your Institution/Hospital: {formData.sources}</p>
      <br />
      <br />
      <p className="text-label">Time Frame: {formData.timeframe}</p>
      <p className="text-label">Signature of Department Head or other person(s) designated to approve grant requests: {formData.signature}</p>
      <p className="text-label">File: {formData.file}</p>
    </div>
  </div>
  );
    
    
    else return (
    <div className="review-form-container">
      <div className="proposal-text">
        <p className="text-label">Title of Project: {formData.projectTitle}</p>
        <p className="text-label">Principal Investigator: {formData.investigator}</p>
        <p className="text-label">Types of Cancers Being Addressed: {formData.cancers}</p>
        <p className="text-label">Institution: {formData.institution}</p>
        <p className="text-label">Address of Institution: {formData.institutionAddress}</p>
        <p className="text-label">Phone Number: {formData.institutionPhone}</p>
        <p className="text-label">Email: {formData.institutionEmail}</p>
        <p className="text-label">Administration Official Name: {formData.adminName}</p>
        <p className="text-label">Address of Administration Official: {formData.adminAddress}</p>
        <p className="text-label">Phone Number: {formData.adminPhone}</p>
        <p className="text-label">Email: {formData.adminEmail}</p>
        <p className="text-label">I have included in this Grant Application any paper that I have published on this Grant topic while receiving CCF funding: {formData.published}</p>
        <p className="text-label">I am in the process of writing a paper on this Grant topic. I agree to give credit to CCF as a funder and will provide a copy of this paper when published: {formData.paperWIP}</p>
        <p className="text-label">I have applied for a Patent for discoveries in my prior years on this Grant topic, funded by CCF: {formData.appliedPatent}</p>
        <p className="text-label">I have included information in my Biosketch on current sources of funding, and applications pending for sources of funding for same or similar grants as this Grant Proposal. {formData.includedInfo}</p>
        <br />
        <br />
        <p className="text-label">Amount Requested: {formData.amountRequested}</p>
        <p className="text-label">Dates of Grant Project: {formData.grantProjDates}</p>
        <p className="text-label">Continuation of Current Funding: {formData.contCurrentFunds}</p>
        <p className="text-label">File: {formData.file}</p>
      </div>
    </div>
  );
}

export default Review;
