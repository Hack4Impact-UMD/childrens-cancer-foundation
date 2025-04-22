import "./post-grant-report.css";
import { useEffect, useState } from "react";
import { writePostGrantReport, PostGrantFormData } from "./post-grant-report-submit";
import { useNavigate } from "react-router-dom";

function PostGrantReport(): JSX.Element {
    const navigate = useNavigate();
    const [uploadLabel, setUploadLabel] = useState<string>("Click to Upload");
    const [reportUploaded, setReportUploaded] = useState<boolean>(false);
    const [report, setReport] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [submitSuccess, setSubmitSuccess] = useState<boolean>(false);

    const updateReport = async (files: FileList) => {
        if (files?.length === 0) {
            setUploadLabel("Click to Upload");
            setReportUploaded(false);
            setReport(null);
        }
        else if (files?.length === 1) {
            if (files[0].type !== "application/pdf") {
                setUploadLabel("Please upload only PDF files");
                setReportUploaded(false);
                setReport(null);
                return;
            }
            
            setUploadLabel(files[0].name);
            setReport(files[0]);
            setReportUploaded(true);
        } else {
            setUploadLabel("Please upload only one PDF file");
            setReportUploaded(false);
            setReport(null);
        }
    }

    const removeUpload = async () => {
        setReport(null);
        document.forms.namedItem("report-form")?.reset();
        setReportUploaded(false);
        setUploadLabel("Click to Upload");
    }

    const handleSubmit = async () => {
        setIsSubmitting(true);
        setSubmitError(null);
        
        try {
            // Validation
            if (!report) {
                throw new Error("Please upload a report file");
            }
            
            const investigatorName = (document.getElementById("InvestigatorName") as HTMLInputElement)?.value;
            const institutionName = (document.getElementById("InstitutionName") as HTMLInputElement)?.value;
            const attestationDate = (document.getElementById("attestationDate") as HTMLInputElement)?.value;
            
            if (!investigatorName) {
                throw new Error("Please enter the Principal Investigator name");
            }
            
            if (!institutionName) {
                throw new Error("Please enter the Institution name");
            }
            
            if (!attestationDate) {
                throw new Error("Please select a date");
            }
            
            // All validation passed, prepare form data
            const formData: PostGrantFormData = {
                investigatorName,
                institutionName,
                attestationDate
            };
            
            // Submit data to API
            await writePostGrantReport(report, formData);
            setSubmitSuccess(true);

            setTimeout(() => {
                navigate("/applicant-dashboard");
            }, 2000);
        } catch (error: any) {
            setSubmitError(error.message || "Error submitting report. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    }

    const handleSaveProgress = () => {
        alert("Progress saved!");
    }

    return (
        <div className="PostGrantReport">
            <div className="PostGrantReport-header-container">
                <h1 className="PostGrantReport-header">
                    Post Grant Results
                </h1>
            </div>

            <div className="PostGrantReport-sections-content">
                {submitSuccess && (
                    <div className="success-message">
                        Report submitted successfully! Redirecting to dashboard...
                    </div>
                )}
                
                {submitError && (
                    <div className="error-message">
                        {submitError}
                    </div>
                )}
                
                <div className="PostGrantReport-section-box">
                    <h2 className="PostGrantReport-section-title">
                        Post-Grant Report
                    </h2>
                    <div className="PostGrantReport-subsection">
                        <h3 className="header-title">In the Post-Grant Report, please submit a 2-3 page Word or PDF file which includes:</h3>
                        <ol>
                            <li>Research Title</li>
                            <li>Principal Investigator</li>
                            <li>Institution</li>
                            <li>Grant Start and End Dates</li>
                            <li>Initial Research Goal</li>
                            <li>Results/Findings, such as relevant graphs, charts, or images</li>
                            <li>Ongoing/Additional Plans, such as intent for future research using said findings and intent to submit abstracts on funded research to any research publications (crediting funding from CCF)</li>
                        </ol>
                    </div>
                    
                    <div className="PostGrantReport-subsection">
                        <h3 className="header-title">Upload File (PDF Format)</h3>
                        <div className="report-upload">
                            <form id="report-form">
                                <input 
                                    type='file' 
                                    accept="application/pdf" 
                                    id="report-pdf" 
                                    onChange={e => (e.target.files) ? updateReport(e.target.files) : null} 
                                />
                                <label className="upload-label" htmlFor="report-pdf">{uploadLabel}</label>
                                {reportUploaded ? <button type="button" className="remove-upload" onClick={_ => removeUpload()}><strong>X</strong></button> : <></>}
                            </form>
                        </div>
                    </div>

                    <div className="PostGrantReport-subsection">
                        <div className="attestation">
                            <div><label className="attestation-label">Awardee/Principal Investigator:</label></div>
                            <input
                                type="text"
                                placeholder="Full Legal Name"
                                id="InvestigatorName"
                                className="attestation-input"
                                required
                            />
                        </div>
                        <div className="attestation">
                            <div><label className="attestation-label">Institution:</label></div>
                            <input
                                type="text"
                                placeholder="Institution Name"
                                id="InstitutionName"
                                className="attestation-input"
                                required
                            />
                        </div>
                        <div className="attestation">
                            <div><label className="attestation-label">Date:</label></div>
                            <input
                                type="date"
                                id="attestationDate"
                                className="attestation-input"
                                required
                            />
                        </div>
                    </div>
                </div>
                <div className="PostGrantReport-submit">
                    <button 
                        className="application-btn" 
                        onClick={handleSaveProgress}
                        disabled={isSubmitting}
                    >
                        Save Progress
                    </button>
                    <button 
                        className="application-btn" 
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? "Submitting..." : "Save and Submit"}
                    </button>
                </div>
            </div>
        </div>
    )
};

export default PostGrantReport;