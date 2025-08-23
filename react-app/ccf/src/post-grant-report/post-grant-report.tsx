import "./post-grant-report.css";
import { useEffect, useState } from "react";
import { writePostGrantReport } from "./post-grant-report-submit";
import { getCurrentCycle } from "../backend/application-cycle";
import { getUsersCurrentCycleAppplications } from "../backend/application-filters";
import { getDecisionData } from "../services/decision-data-service";
import ApplicationCycle from "../types/applicationCycle-types";
import type { PostGrantReport as PostGrantReportType } from "../types/post-grant-report-types";
import Sidebar from "../components/sidebar/Sidebar";
import { getApplicantSidebarItems } from "../types/sidebar-types";

function PostGrantReport(): JSX.Element {
    const [sidebarItems, setSidebarItems] = useState<any[]>([]);
    const [uploadLabel, setUploadLabel] = useState<string>("Click to Upload");
    const [reportUploaded, setReportUploaded] = useState<boolean>(false);
    const [report, setReport] = useState<File | null>(null);
    const [currentCycle, setCurrentCycle] = useState<ApplicationCycle | null>(null);
    const [deadline, setDeadline] = useState<Date | null>(null);
    const [isOverdue, setIsOverdue] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
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

                const cycle = await getCurrentCycle();
                setCurrentCycle(cycle);

                if (cycle.postGrantReportDeadline) {
                    setDeadline(cycle.postGrantReportDeadline);
                    const now = new Date();
                    setIsOverdue(now > cycle.postGrantReportDeadline);
                }

                // Check if user has accepted applications
                const userApplications = await getUsersCurrentCycleAppplications();
                const hasAcceptedApplication = await Promise.any(
                    userApplications.map(async (app: any) => {
                        try {
                            const decision = await getDecisionData(app.id);
                            return decision?.isAccepted === true;
                        } catch {
                            return false;
                        }
                    })
                );

                if (!hasAcceptedApplication) {
                    setError("You don't have any accepted applications that require post-grant reports.");
                }
            } catch (error) {
                console.error("Error initializing post-grant report:", error);
                setError("Failed to load post-grant report data. Please try again.");
            } finally {
                setLoading(false);
            }
        };

        initializeData();
    }, []);

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

    const handleSaveProgress = async () => {
        // TODO: Implement save progress functionality
        console.log("Saving progress...");
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
            console.log('Starting post-grant report submission...');
            console.log('File:', report.name, 'Size:', report.size, 'Type:', report.type);
            console.log('Form data:', formData);

            // For the old component, we'll use a placeholder applicationId
            await writePostGrantReport(report, "placeholder-id", "Post-Grant Report", "research", formData);
            alert("Post-grant report submitted successfully!");
            // Reset form
            setReport(null);
            setReportUploaded(false);
            setUploadLabel("Click to Upload");
            setFormData({
                investigatorName: "",
                institutionName: "",
                attestationDate: ""
            });
        } catch (error) {
            console.error("Error submitting report:", error);
            if (error instanceof Error) {
                alert(`Failed to submit report: ${error.message}`);
            } else {
                alert("Failed to submit report. Please try again.");
            }
        }
    };

    if (loading) {
        return (
            <div>
                <Sidebar links={sidebarItems} />
                <div className="dashboard-container">
                    <div className="PostGrantReport">
                        <div className="PostGrantReport-header-container">
                            <h1 className="PostGrantReport-header">Post Grant Results</h1>
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
                            <h1 className="PostGrantReport-header">Post Grant Results</h1>
                        </div>
                        <div className="error-message">{error}</div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div>
            <Sidebar links={sidebarItems} />
            <div className="dashboard-container">
                <div className="PostGrantReport">
                    <div className="PostGrantReport-header-container">
                        <h1 className="PostGrantReport-header">
                            Post Grant Results
                        </h1>
                    </div>

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
                                            onChange={e => (e.target.files) ? updateReport(e.target.files) : "Click to Upload"}
                                            aria-label="Upload PDF report"
                                        />
                                        <label className="upload-label" htmlFor="report-pdf">{uploadLabel}</label>
                                        {reportUploaded ? <button className="remove-upload" onClick={_ => removeUpload()}><strong>X</strong></button> : <></>}
                                    </form>
                                </div>
                            </div>

                            <div className="PostGrantReport-subsection">
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
                                        required
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="PostGrantReport-submit">
                            <button className="application-btn" onClick={handleSaveProgress}>Save Progress</button>
                            <button className="application-btn" onClick={handleSubmit}>Save and Submit</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
};

export default PostGrantReport;