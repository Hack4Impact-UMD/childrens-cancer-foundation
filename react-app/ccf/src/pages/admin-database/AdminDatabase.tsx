import { useState, useEffect } from "react";
import "./AdminDatabase.css";
import Sidebar from "../../components/sidebar/Sidebar";
import { FaArrowDown, FaArrowUp, FaChevronRight } from "react-icons/fa";
import logo from "../../assets/ccf-logo.png";
import document from '../../assets/documentIcon.png';
import yellowDocument from '../../assets/yellowDocumentIcon.png';
import blueDocument from '../../assets/blueDocumentIcon.png';
import { getSidebarbyRole } from "../../types/sidebar-types";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../..";

interface Application {
    id: string;
    applicationTitle: string;
    applicationType: string;
    decision: string;
    institution: string;
    principalInvestigator: string;
    cancerType: string;
    amountRequested: string;
    continuationOfFunding: string;
    applicationYear: string; // Added to store the year
    documentUrl: string; // Added to store the document URL
}

function AdminApplicationsDatabase(): JSX.Element {
    const [applicationsData, setApplicationsData] = useState<{ [year: string]: Application[] }>({});
    const [collapseState, setCollapseState] = useState<{ [year: string]: boolean }>({});
    const [expandedApplications, setExpandedApplications] = useState<{ [key: string]: boolean }>({});
    const [searchTerm, setSearchTerm] = useState("");
    const [filters, setFilters] = useState({
        applicationCycle: "",
        decision: "",
        grantType: "",
        institution: ""
    });
    const [availableYears, setAvailableYears] = useState<string[]>([]);
    const [availableInstitutions, setAvailableInstitutions] = useState<string[]>([]);

    useEffect(() => {
        const fetchApplications = async () => {
            try {
                const applicationsRef = collection(db, "applications");
                const querySnapshot = await getDocs(applicationsRef);
                console.log(querySnapshot.docs);
                // Group applications by year
                const applications: { [year: string]: Application[] } = {};
                const institutions = new Set<string>();
                const years = new Set<string>();

                querySnapshot.forEach((doc) => {
                    const data = doc.data();
                    // Extract the year from timestamp or application cycle field
                    const timestamp = Number(doc.id);
                    const date = new Date(timestamp);
                    const year = data.applicationCycle?.split('-')[0] || date.getFullYear().toString();

                    // Map Firestore data to Application interface
                    const application: Application = {
                        id: doc.id,
                        applicationTitle: data.title + " | " + data.principalInvestigator + " - " + data.institution || "No Title",
                        applicationType: data.grantType || "Unknown",
                        decision: data.decision || "pending",
                        institution: data.institution || "Unknown Institution",
                        principalInvestigator: data.principalInvestigator || "Unknown PI",
                        cancerType: data.typesOfCancerAddressed || "Not Specified",
                        amountRequested: data.amountRequested || "0",
                        continuationOfFunding: data.continuation || "No",
                        applicationYear: data.applicationYear,
                        documentUrl: data.pdf || ""
                    };

                    console.log(application);

                    // Add to applications by year
                    if (!applications[year]) {
                        applications[year] = [];
                    }
                    applications[year].push(application);

                    // Add to unique sets
                    institutions.add(application.institution);
                    years.add(year);
                });

                setApplicationsData(applications);
                console.log(applications);
                setAvailableYears(Array.from(years).sort((a, b) => Number(b) - Number(a)));
                setAvailableInstitutions(Array.from(institutions).sort());

                // Initialize collapse state for each year
                const initialCollapse: { [year: string]: boolean } = {};
                for (const year in applications) {
                    initialCollapse[year] = false;
                }
                setCollapseState(initialCollapse);

                // Initialize expanded state for each application
                const initialExpandedState: { [key: string]: boolean } = {};
                Object.keys(applications).forEach(year => {
                    applications[year].forEach((app, index) => {
                        initialExpandedState[`${year}-${index}`] = false;
                    });
                });
                setExpandedApplications(initialExpandedState);

            } catch (error) {
                console.error("Error fetching applications:", error);
            }
        };

        fetchApplications();
    }, []);

    const toggleYear = (year: string) => {
        setCollapseState(prev => ({
            ...prev,
            [year]: !prev[year]
        }));
    };

    const toggleApplication = (year: string, index: number) => {
        const key = `${year}-${index}`;
        setExpandedApplications(prev => ({
            ...prev,
            [key]: !prev[key]
        }));
    };

    const filteredApplications = Object.keys(applicationsData).reduce((acc, year) => {
        const filtered = applicationsData[year].filter(app =>
            (filters.applicationCycle ? year === filters.applicationCycle : true) &&
            (filters.decision ? app.decision === filters.decision : true) &&
            (filters.grantType ? app.applicationType.toLowerCase().includes(filters.grantType.toLowerCase()) : true) &&
            (filters.institution ? app.institution === filters.institution : true) &&
            (searchTerm ? app.applicationTitle.toLowerCase().includes(searchTerm.toLowerCase()) : true)
        );

        if (filtered.length) {
            acc[year] = filtered;
        }

        return acc;
    }, {} as { [year: string]: Application[] });

    const sidebarItems = getSidebarbyRole("admin");

    // Function to open the application document
    const openApplicationDocument = (url: string) => {
        if (url) {
            window.open(url, '_blank');
        } else {
            alert("No document available");
        }
    };

    return (
        <div>
            <Sidebar links={sidebarItems}/>

            <div className="dashboard-container">
                <div className="dashboard-content">
                    <div className="dashboard-header-container">
                        <img src={logo} alt="Logo" className="dashboard-logo" />
                        <h1 className="dashboard-header">Administrator Dashboard</h1>
                    </div>

                    <input
                        type="text"
                        placeholder="Search"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="search-input"
                    />

                    <div className="filter-container">
                        <select className="filter-dropdown" onChange={(e) => setFilters({ ...filters, applicationCycle: e.target.value})}>
                            <option value="">Application Cycle</option>
                            {availableYears.map((year) => (
                                <option key={year} value={year}>{year}</option>
                            ))}
                        </select>

                        <select className="filter-dropdown" onChange={(e) => setFilters({ ...filters, decision: e.target.value})}>
                            <option value="">Decision</option>
                            <option value="accepted">Approved</option>
                            <option value="rejected">Rejected</option>
                            <option value="pending">Pending</option>
                        </select>

                        <select className="filter-dropdown" onChange={(e) => setFilters({ ...filters, grantType: e.target.value})}>
                            <option value="">Grant Type</option>
                            <option value="research">Research</option>
                            <option value="nextgen">Next Gen</option>
                        </select>

                        <select className="filter-dropdown" onChange={(e) => setFilters({ ...filters, institution: e.target.value})}>
                            <option value="">Institution</option>
                            {availableInstitutions.map((institution) => (
                                <option key={institution} value={institution}>{institution}</option>
                            ))}
                        </select>
                    </div>

                    <div className="dashboard-sections-content">
                        {Object.keys(filteredApplications).sort((a, b) => Number(b) - Number(a)).map((year) => (
                            <div key={year} className="dashboard-section">
                                <div className="section-header" onClick={() => toggleYear(year)}>
                                    <div className="header-content">
                                        <img src={document} alt="Document Icon" className="section-icon" />
                                        <h2>{year}</h2>
                                    </div>
                                    <button className="expand-collapse-btn">
                                        {collapseState[year] ? <FaArrowDown /> : <FaArrowUp />}
                                    </button>
                                </div>

                                {!collapseState[year] && (
                                    <>
                                        <div className="applications-container">
                                            {filteredApplications[year].map((app, index) => {
                                                const isExpanded = expandedApplications[`${year}-${index}`];
                                                const iconColor = isExpanded ? blueDocument : yellowDocument;
                                                return (
                                                    <div key={index} className={`single-application-box ${isExpanded ? 'expanded' : ''}`}>
                                                        <div className="application-header" onClick={() => toggleApplication(year, index)}>
                                                            <div className="application-info">
                                                                <img src={iconColor} alt="Document Icon" className="section-icon" />
                                                                <div className="application-info-text">
                                                                    <p className="application-title">{app.applicationTitle}</p>
                                                                    <p className="subtext">{app.applicationType} - {app.decision.charAt(0).toUpperCase() + app.decision.slice(1)}</p>
                                                                </div>
                                                            </div>
                                                            <button className="expand-collapse-btn">
                                                                {isExpanded ? <FaArrowUp /> : <FaArrowDown />}
                                                            </button>
                                                        </div>

                                                        {isExpanded && (
                                                            <div className="application-details">
                                                                <hr className="divider"/>
                                                                <div className="details-two-columns">
                                                                    <div className="details-block">
                                                                        <div className="detail-item">
                                                                            <span className="detail-label">Application Title: </span>
                                                                            <span className="detail-value">{app.applicationTitle || " N/A"}</span>
                                                                        </div>
                                                                        <div className="detail-item">
                                                                            <span className="detail-label">Application Type: </span>
                                                                            <span className="detail-value">{app.applicationType || " N/A"}</span>
                                                                        </div>
                                                                        <div className="detail-item">
                                                                            <span className="detail-label">Principal Investigator: </span>
                                                                            <span className="detail-value">{app.principalInvestigator || " N/A"}</span>
                                                                        </div>
                                                                        <div className="detail-item">
                                                                            <span className="detail-label">Institution: </span>
                                                                            <span className="detail-value">{app.institution || " N/A"}</span>
                                                                        </div>
                                                                    </div>
                                                                    <div className="details-block">
                                                                        <div className="detail-item">
                                                                            <span className="detail-label">Cancer Type: </span>
                                                                            <span className="detail-value">{app.cancerType || " N/A"}</span>
                                                                        </div>
                                                                        <div className="detail-item">
                                                                            <span className="detail-label">Amount Requested: </span>
                                                                            <span className="detail-value">${app.amountRequested || " N/A"}</span>
                                                                        </div>
                                                                        <div className="detail-item">
                                                                            <span className="detail-label">Continuation of Funding: </span>
                                                                            <span className="detail-value">{app.continuationOfFunding || " N/A"}</span>
                                                                        </div>
                                                                        <div className="detail-item">
                                                                            <span className="detail-label">Status: </span>
                                                                            <span className="detail-value">{app.decision.charAt(0).toUpperCase() + app.decision.slice(1)}</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div className="action-buttons">
                                                                    <button className="action-button cover-sheet">
                                                                        Cover Sheet Information
                                                                        <FaChevronRight className="button-icon" />
                                                                    </button>
                                                                    <button
                                                                        className="action-button completed-app"
                                                                        onClick={() => openApplicationDocument(app.documentUrl)}
                                                                    >
                                                                        Completed Application
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminApplicationsDatabase;