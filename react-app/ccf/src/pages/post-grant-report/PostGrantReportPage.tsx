import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { writePostGrantReport } from "../../post-grant-report/post-grant-report-submit";
import { getCurrentCycle } from "../../backend/application-cycle";
import { getUsersCurrentCycleAppplications } from "../../backend/application-filters";
import { getDecisionData } from "../../services/decision-data-service";
import ApplicationCycle from "../../types/applicationCycle-types";
import { Application } from "../../types/application-types";
import Confetti from 'react-confetti';
import Sidebar from "../../components/sidebar/Sidebar";
import { getApplicantSidebarItems } from "../../types/sidebar-types";
import { checkIfReportSubmitted, getReportsByUser } from "../../backend/post-grant-reports";
import { PostGrantReport } from "../../types/post-grant-report-types";
import { auth } from "../../index";
import { FaCheckCircle, FaFileAlt } from "react-icons/fa";
import { getPDFDownloadURL } from "../../storage/storage";
import "../../post-grant-report/post-grant-report.css";

function PostGrantReportPage(): JSX.Element {
    const { applicationId } = useParams<{ applicationId: string }>();
    const navigate = useNavigate();

    const [sidebarItems, setSidebarItems] = useState<any[]>([]);
    const [uploadLabel, setUploadLabel] = useState<string>("Click to Upload");
    const [reportUploaded, setReportUploaded] = useState<boolean>(false);
    const [report, setReport] = useState<File | null>(null);
    const [currentCycle, setCurrentCycle] = useState<ApplicationCycle | null>(null);
    const [deadline, setDeadline] = useState<Date | null>(null);
    const [isOverdue, setIsOverdue] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [application, setApplication] = useState<Application | null>(null);
    const [showConfetti, setShowConfetti] = useState<boolean>(false);
    const [submittedReport, setSubmittedReport] = useState<PostGrantReport | null>(null);
    const [pdfUrl, setPdfUrl] = useState<string>('');
    const [formData, setFormData] = useState({
        investigatorName: "",
        institutionName: "",
        attestationDate: ""
    });

    useEffect(() => {
        const initializeData = async () => {
            try {
                setLoading(true);

                // Load sidebar items
                const sidebarItems = await getApplicantSidebarItems();
                setSidebarItems(sidebarItems);

                // Get application data
                const userApplications = await getUsersCurrentCycleAppplications();
                const targetApplication = userApplications.find((app: any) => (app as any).id === applicationId);

                if (!targetApplication) {
                    setError("Application not found.");
                    return;
                }

                // Check if application is accepted
                try {
                    const decision = await getDecisionData((targetApplication as any).id);
                    if (!decision?.isAccepted) {
                        setError("This application has not been accepted or does not require a post-grant report.");
                        return;
                    }
                } catch (error) {
                    setError("Unable to verify application status.");
                    return;
                }

                setApplication(targetApplication);

                // Check if report is already submitted
                const user = auth.currentUser;
                if (user) {
                    const userReports = await getReportsByUser(user.uid);
                    const existingReport = userReports.find(report => report.applicationId === applicationId);
                    if (existingReport) {
                        setSubmittedReport(existingReport);
                        // Get the PDF download URL
                        try {
                            const fileId = existingReport.pdf || existingReport.file;
                            if (fileId) {
                                const url = await getPDFDownloadURL(fileId);
                                setPdfUrl(url);
                            }
                        } catch (error) {
                            console.error('Error getting PDF URL:', error);
                        }
                    }
                }

                // Get cycle data
                const cycle = await getCurrentCycle();
                setCurrentCycle(cycle);

                if (cycle.postGrantReportDeadline) {
                    setDeadline(cycle.postGrantReportDeadline);
                    const now = new Date();
                    setIsOverdue(now > cycle.postGrantReportDeadline);
                }

            } catch (error) {
                console.error("Error initializing post-grant report:", error);
                setError("Failed to load post-grant report data. Please try again.");
            } finally {
                setLoading(false);
            }
        };

        if (applicationId) {
            initializeData();
        }
    }, [applicationId]);

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
                applicationId!,
                application?.title || application?.grantType,
                application?.grantType,
                formData
            );

            // Show confetti animation
            setShowConfetti(true);
            setTimeout(() => {
                setShowConfetti(false);
                navigate('/applicant/dashboard');
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

    const formatDate = (dateString: string | Date | undefined | null) => {
        if (!dateString) {
            return 'N/A';
        }

        try {
            if (typeof dateString === 'string') {
                const date = new Date(dateString);
                if (isNaN(date.getTime())) {
                    return 'Invalid Date';
                }
                return date.toLocaleDateString();
            }

            if (dateString instanceof Date) {
                return dateString.toLocaleDateString();
            }

            return 'Invalid Date';
        } catch (error) {
            console.error('Error formatting date:', error);
            return 'Error';
        }
    };

    if (loading) {
        return (
            <div>
                <Sidebar links={sidebarItems} />
                <div className="dashboard-container">
                    <div className="PostGrantReport">
                        <div className="PostGrantReport-header-container">
                            <h1 className="PostGrantReport-header">Post Grant Report</h1>
                        </div>
                        <div className="loading-message">Loading...</div>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div>
                <Sidebar links={sidebarItems} />
                <div className="dashboard-container">
                    <div className="PostGrantReport">
                        <div className="PostGrantReport-header-container">
                            <h1 className="PostGrantReport-header">Post Grant Report</h1>
                        </div>
                        <div className="error-message">{error}</div>
                        <button className="back-button" onClick={() => navigate('/applicant/dashboard')}>
                            Back to Dashboard
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // If report is already submitted, show submission details
    if (submittedReport) {
        return (
            <div>
                <Sidebar links={sidebarItems} />
                <div className="dashboard-container">
                    <div className="PostGrantReport">
                        <div className="PostGrantReport-header-container">
                            <h1 className="PostGrantReport-header">
                                Post Grant Report - Already Submitted
                            </h1>
                            <button className="back-button" onClick={() => navigate('/applicant/dashboard')}>
                                ← Back to Dashboard
                            </button>
                        </div>

                        {application && (
                            <div className="application-info-section">
                                <h2>Application: {application.title || `${application.grantType} Application`}</h2>
                                <p><strong>Grant Type:</strong> {application.grantType}</p>
                            </div>
                        )}

                        <div className="submission-confirmation">
                            <div className="confirmation-header">
                                <FaCheckCircle className="confirmation-icon" />
                                <h2>Report Successfully Submitted</h2>
                            </div>

                            <div className="submission-details">
                                <h3>Submission Details:</h3>
                                <div className="details-grid">
                                    <div className="detail-item">
                                        <strong>Application Title:</strong>
                                        <span>{submittedReport.applicationTitle}</span>
                                    </div>
                                    <div className="detail-item">
                                        <strong>Grant Type:</strong>
                                        <span>{submittedReport.grantType}</span>
                                    </div>
                                    <div className="detail-item">
                                        <strong>Investigator:</strong>
                                        <span>{submittedReport.investigatorName}</span>
                                    </div>
                                    <div className="detail-item">
                                        <strong>Institution:</strong>
                                        <span>{submittedReport.institutionName}</span>
                                    </div>
                                    <div className="detail-item">
                                        <strong>Attestation Date:</strong>
                                        <span>{formatDate(submittedReport.attestationDate || '')}</span>
                                    </div>
                                    <div className="detail-item">
                                        <strong>Submitted:</strong>
                                        <span>
                                            {submittedReport.submittedAt ?
                                                (typeof submittedReport.submittedAt === 'object' && 'seconds' in submittedReport.submittedAt) ?
                                                    new Date((submittedReport.submittedAt as any).seconds * 1000).toLocaleDateString() :
                                                    new Date(submittedReport.submittedAt).toLocaleDateString()
                                                : 'N/A'
                                            }
                                        </span>
                                    </div>
                                    <div className="detail-item">
                                        <strong>Status:</strong>
                                        <span className="status-submitted">{submittedReport.status}</span>
                                    </div>
                                    <div className="detail-item">
                                        <strong>PDF File:</strong>
                                        <div className="pdf-viewer">
                                            {pdfUrl ? (
                                                <a
                                                    href={pdfUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="pdf-link"
                                                >
                                                    <FaFileAlt className="pdf-icon" />
                                                    View Submitted PDF
                                                </a>
                                            ) : (
                                                <span className="pdf-loading">Loading PDF...</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="submission-note">
                                <p><strong>Note:</strong> This report has been successfully submitted and cannot be edited. If you need to make changes, please contact the administrator.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <>
            {showConfetti && <Confetti />}
            <div>
                <Sidebar links={sidebarItems} />
                <div className="dashboard-container">
                    <div className="PostGrantReport">
                        <div className="PostGrantReport-header-container">
                            <h1 className="PostGrantReport-header">
                                Post Grant Report
                            </h1>
                            <button className="back-button" onClick={() => navigate('/applicant/dashboard')}>
                                ← Back to Dashboard
                            </button>
                        </div>

                        {application && (
                            <div className="application-info-section">
                                <h2>Application: {application.title || `${application.grantType} Application`}</h2>
                                <p><strong>Grant Type:</strong> {application.grantType}</p>
                            </div>
                        )}

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

                        <div className="PostGrantReport-sections-content">
                            <div className="PostGrantReport-section-box">
                                <h2 className="PostGrantReport-section-title">
                                    Post-Grant Report Requirements
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
                                            <label htmlFor="report-pdf" className="sr-only">Upload PDF report</label>
                                            <input
                                                type='file'
                                                accept="application/pdf"
                                                id="report-pdf"
                                                title="Upload PDF report"
                                                onChange={e => (e.target.files) ? updateReport(e.target.files) : "Click to Upload"}
                                                aria-label="Upload PDF report"
                                            />
                                            <label className="upload-label" htmlFor="report-pdf">{uploadLabel}</label>
                                            {reportUploaded ? <button type="button" className="remove-upload" onClick={removeUpload}><strong>X</strong></button> : <></>}
                                        </form>
                                    </div>
                                </div>

                                <div className="PostGrantReport-subsection">
                                    <h3 className="header-title">Attestation Information</h3>
                                    <div className="attestation">
                                        <div><label className="attestation-label">Awardee/Principal Investigator:</label></div>
                                        <input
                                            type="text"
                                            placeholder="Full Legal Name"
                                            value={formData.investigatorName}
                                            onChange={(e) => handleInputChange("investigatorName", e.target.value)}
                                            className="attestation-input"
                                            required
                                        />
                                    </div>
                                    <div className="attestation">
                                        <div><label className="attestation-label">Institution:</label></div>
                                        <input
                                            type="text"
                                            placeholder="Institution Name"
                                            value={formData.institutionName}
                                            onChange={(e) => handleInputChange("institutionName", e.target.value)}
                                            className="attestation-input"
                                            required
                                        />
                                    </div>
                                    <div className="attestation">
                                        <div><label className="attestation-label">Date:</label></div>
                                        <input
                                            type="date"
                                            value={formData.attestationDate}
                                            onChange={(e) => handleInputChange("attestationDate", e.target.value)}
                                            className="attestation-input"
                                            title="Attestation date"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="PostGrantReport-submit">
                                    <button className="cancel-button" onClick={() => navigate('/applicant/dashboard')}>Cancel</button>
                                    <button
                                        className="application-btn"
                                        onClick={handleSubmit}
                                        disabled={loading}
                                    >
                                        {loading ? 'Submitting...' : 'Submit Report'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

export default PostGrantReportPage;
