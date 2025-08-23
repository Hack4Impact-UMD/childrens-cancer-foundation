import React, { useState, useEffect } from "react";
import { writePostGrantReport } from "../../post-grant-report/post-grant-report-submit";
import { getCurrentCycle } from "../../backend/application-cycle";
import ApplicationCycle from "../../types/applicationCycle-types";
import { Application } from "../../types/application-types";
import Confetti from 'react-confetti';
import "../modal/modal.css";
import "./modal.css";

interface PostGrantReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    application: Application;
}

const PostGrantReportModal: React.FC<PostGrantReportModalProps> = ({ isOpen, onClose, application }) => {
    const [uploadLabel, setUploadLabel] = useState<string>("Click to Upload");
    const [reportUploaded, setReportUploaded] = useState<boolean>(false);
    const [report, setReport] = useState<File | null>(null);
    const [currentCycle, setCurrentCycle] = useState<ApplicationCycle | null>(null);
    const [deadline, setDeadline] = useState<Date | null>(null);
    const [isOverdue, setIsOverdue] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(false);
    const [showConfetti, setShowConfetti] = useState<boolean>(false);
    const [formData, setFormData] = useState({
        investigatorName: "",
        institutionName: "",
        attestationDate: ""
    });

    useEffect(() => {
        if (isOpen) {
            const initializeData = async () => {
                try {
                    const cycle = await getCurrentCycle();
                    setCurrentCycle(cycle);

                    if (cycle.postGrantReportDeadline) {
                        setDeadline(cycle.postGrantReportDeadline);
                        const now = new Date();
                        setIsOverdue(now > cycle.postGrantReportDeadline);
                    }
                } catch (error) {
                    console.error("Error initializing post-grant report:", error);
                }
            };

            initializeData();
        }
    }, [isOpen]);

    const updateReport = async (files: FileList) => {
        if (files?.length === 0) {
            setUploadLabel("Click to Upload")
            setReportUploaded(false);
        }
        else if (files?.length === 1) {
            setUploadLabel(files[0].name);
            setReport(files[0]);
            setReportUploaded(true);
        } else {
            setUploadLabel("Please upload only PDF file.")
            setReportUploaded(false);
        }
    }

    const removeUpload = async () => {
        setReport(null);
        document.forms.namedItem("report-form")?.reset();
        setReportUploaded(false);
        setUploadLabel("Click to Upload");
    }

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleSubmit = async () => {
        if (!report) {
            alert("Please upload a report file.");
            return;
        }

        if (!formData.investigatorName || !formData.institutionName || !formData.attestationDate) {
            alert("Please fill in all required fields.");
            return;
        }

        try {
            setLoading(true);
            console.log('Starting post-grant report submission...');
            console.log('File:', report.name, 'Size:', report.size, 'Type:', report.type);
            console.log('Form data:', formData);

            await writePostGrantReport(
                report,
                (application as any).id,
                application.title || application.grantType,
                application.grantType,
                formData
            );

            // Show confetti animation
            setShowConfetti(true);
            setTimeout(() => {
                setShowConfetti(false);
                onClose();
            }, 3000);

        } catch (error) {
            console.error("Error submitting report:", error);
            if (error instanceof Error) {
                alert(`Failed to submit report: ${error.message}`);
            } else {
                alert("Failed to submit report. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <>
            {showConfetti && <Confetti />}
            <div className="modal-overlay">
                <div className="modal-container">
                    <div className="modal-header">
                        <h2>Post-Grant Report for {application.title || application.grantType}</h2>
                        <button className="close-button" onClick={onClose}>×</button>
                    </div>

                    <div className="modal-body">
                        {deadline && (
                            <div className={`deadline-notice ${isOverdue ? 'overdue' : ''}`}>
                                <h3>Deadline Information</h3>
                                <p>
                                    <strong>Report Deadline:</strong> {deadline.toLocaleDateString()} at 11:59 PM
                                    {isOverdue && (
                                        <span className="overdue-warning"> - OVERDUE</span>
                                    )}
                                </p>
                            </div>
                        )}

                        <div className="report-section">
                            <h3>Post-Grant Report Requirements</h3>
                            <p>Please submit a 2-3 page Word or PDF file which includes:</p>
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

                        <div className="upload-section">
                            <h3>Upload File (PDF Format)</h3>
                            <div className="report-upload">
                                <form id="report-form">
                                    <input
                                        type='file'
                                        accept="application/pdf"
                                        id="report-pdf"
                                        onChange={e => (e.target.files) ? updateReport(e.target.files) : "Click to Upload"}
                                        aria-label="Upload PDF report"
                                    />
                                    <label className="upload-label" htmlFor="report-pdf">{uploadLabel}</label>
                                    {reportUploaded ? <button type="button" className="remove-upload" onClick={removeUpload}><strong>X</strong></button> : <></>}
                                </form>
                            </div>
                        </div>

                        <div className="form-section">
                            <h3>Attestation Information</h3>
                            <div className="form-group">
                                <label>Awardee/Principal Investigator:</label>
                                <input
                                    type="text"
                                    placeholder="Full Legal Name"
                                    value={formData.investigatorName}
                                    onChange={(e) => handleInputChange("investigatorName", e.target.value)}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Institution:</label>
                                <input
                                    type="text"
                                    placeholder="Institution Name"
                                    value={formData.institutionName}
                                    onChange={(e) => handleInputChange("institutionName", e.target.value)}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Date:</label>
                                <input
                                    type="date"
                                    value={formData.attestationDate}
                                    onChange={(e) => handleInputChange("attestationDate", e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    <div className="modal-footer">
                        <button className="cancel-button" onClick={onClose}>Cancel</button>
                        <button
                            className="submit-button"
                            onClick={handleSubmit}
                            disabled={loading}
                        >
                            {loading ? 'Submitting...' : 'Submit Report'}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default PostGrantReportModal;
