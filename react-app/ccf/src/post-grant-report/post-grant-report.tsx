import "./post-grant-report.css";
import { useEffect, useState } from "react";
import { writePostGrantReport } from "./post-grant-report-submit";
import { getAuth } from "firebase/auth";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../index";
import { useNavigate } from "react-router-dom";

function PostGrantReport(): JSX.Element {
    const [uploadLabel, setUploadLabel] = useState<string>("Click to Upload");
    const [reportUploaded, setReportUploaded] = useState<boolean>(false);
    const [report, setReport] = useState<File | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string>("");

    const navigate = useNavigate();
    const auth = getAuth();

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

    useEffect(() => {
        async function checkEligibility() {
            if (!auth.currentUser) {
                navigate("/login");
                return;
            }

            try {
                const q = query(
                    collection(db, "applications"),
                    where("userId", "==", auth.currentUser.uid),
                    where("status", "==", "APPROVED")
                );
                
                const docs = await getDocs(q);
                
                if (docs.empty) {
                    setError("You don't have any approved grants.");
                    setLoading(false);
                    return;
                }
                let eligible = false;
                
                docs.forEach(doc => {
                    const data = doc.data();
                    if (data.grantEndDate?.toDate() < new Date() && !data.postGrantReportSubmitted) {
                        eligible = true;
                    }
                });
                
                if (!eligible) {
                    setError("You don't have any grants that need reports.");
                }
                setLoading(false);
                
            } catch (err) {
                console.error(err);
                setError("Something went wrong. Please try again later.");
                setLoading(false);
            }
        }
        
        checkEligibility();
    }, [auth, navigate]);

    if (loading) {
        return <div className="PostGrantReport">
            <div className="PostGrantReport-header-container">
                <h1 className="PostGrantReport-header">Loading...</h1>
            </div>
        </div>;
    }
    
    if (error) {
        return <div className="PostGrantReport">
            <div className="PostGrantReport-header-container">
                <h1 className="PostGrantReport-header">Post Grant Results</h1>
            </div>
            <div className="PostGrantReport-sections-content">
                <div className="PostGrantReport-section-box">
                    <h2 className="PostGrantReport-section-title">Not Available</h2>
                    <h2>{error}</h2>
                    <button className="application-btn" onClick={() => navigate("/applicant-dashboard")}>
                        Back to Dashboard
                    </button>
                </div>
            </div>
        </div>;
    }

    return (
        <div className="PostGrantReport">

            <div className="PostGrantReport-header-container">
                <h1 className="PostGrantReport-header">
                    Post Grant Results
                </h1>
            </div>

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
                                <input type='file' accept="application/pdf" id="report-pdf" onChange={e => (e.target.files) ? updateReport(e.target.files) : "Click to Upload"} />
                                <label className="upload-label" htmlFor="report-pdf">{ uploadLabel }</label>
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
                    <button className="application-btn">Save Progress</button>
                    <button className="application-btn" onClick={() => {
                        if (!report) {
                            alert("Please upload a report file");
                            return;
                        }
                        
                        const investigatorName = (document.getElementById("InvestigatorName") as HTMLInputElement)?.value;
                        const institutionName = (document.getElementById("InstitutionName") as HTMLInputElement)?.value;
                        const attestationDate = (document.getElementById("attestationDate") as HTMLInputElement)?.value;
                        
                        if (!investigatorName || !institutionName || !attestationDate) {
                            alert("Please fill in all required fields");
                            return;
                        }
                        
                        try {
                            writePostGrantReport(report);
                            alert("Report submitted successfully!");
                            navigate("/applicant-dashboard");
                        } catch (error) {
                            console.error(error);
                            alert("Failed to submit report.");
                        }
                    }}>Save and Submit</button>
                </div>
            </div>
        </div>
    )
};

export default PostGrantReport;