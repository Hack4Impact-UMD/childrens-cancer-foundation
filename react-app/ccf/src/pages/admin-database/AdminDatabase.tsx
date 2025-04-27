import { useState, useEffect } from "react";
import "./AdminDatabase.css";
import Sidebar from "../../components/sidebar/Sidebar";
import { FaArrowDown, FaArrowUp, FaChevronRight } from "react-icons/fa";
import logo from "../../assets/ccf-logo.png";
import document from '../../assets/documentIcon.png';
import yellowDocument from '../../assets/yellowDocumentIcon.png';
import blueDocument from '../../assets/blueDocumentIcon.png';

interface Application {
    applicationTitle: string;
    applicationType: string;
    decision: string;
    institution: string;
    principalInvestigator: string;
    cancerType: string;
    amountRequested: string;
    continuationOfFunding: string;
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

    useEffect(() => {
        const initialData : { [year: string]: Application[] } = {
            "2023": [
                { applicationTitle: "Application Title", applicationType: "Application Type (Next Gen/Research)", decision: "", institution: "", principalInvestigator: "", cancerType: "", amountRequested: "", continuationOfFunding: "" },
                { applicationTitle: "Application Title", applicationType: "Application Type (Next Gen/Research)", decision: "", institution: "", principalInvestigator: "", cancerType: "", amountRequested: "", continuationOfFunding: "" },
                { applicationTitle: "Application Title", applicationType: "Application Type (Next Gen/Research)", decision: "", institution: "", principalInvestigator: "", cancerType: "", amountRequested: "", continuationOfFunding: "" }
            ],
            "2022": [
                { applicationTitle: "Application Title", applicationType: "Application Type (Next Gen/Research)", decision: "", institution: "", principalInvestigator: "", cancerType: "", amountRequested: "", continuationOfFunding: "" },
                { applicationTitle: "Application Title", applicationType: "Application Type (Next Gen/Research)", decision: "", institution: "", principalInvestigator: "", cancerType: "", amountRequested: "", continuationOfFunding: "" },
                { applicationTitle: "Application Title", applicationType: "Application Type (Next Gen/Research)", decision: "", institution: "", principalInvestigator: "", cancerType: "", amountRequested: "", continuationOfFunding: "" }
            ]
        };

        setApplicationsData(initialData);

        const initialCollapse: { [year: string]: boolean } = {};
        for (const year in initialData) {
            initialCollapse[year] = false;
        }

        setCollapseState(initialCollapse);

        const initialExpandedState: { [key: string]: boolean } = {};
        Object.keys(initialData).forEach(year => {
            initialData[year].forEach((app, index) => {
                initialExpandedState[`${year}-${index}`] = false;
            });
        });
        setExpandedApplications(initialExpandedState);
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
            (filters.grantType ? app.applicationType.includes(filters.grantType) : true) &&
            (filters.institution ? app.institution === filters.institution : true) &&
            (searchTerm ? app.applicationTitle.toLowerCase().includes(searchTerm.toLocaleLowerCase()) : true)
        );

        if (filtered.length) {
            acc[year] = filtered;
        }

        return acc;
    }, {} as { [year: string]: Application[] });

    const sidebarItems = [
        {name: "Home", path: "/"},
        {name: "Account Settings", path: "/settings"},
        {name: "Database", path: "/admin-database"},
        {name: "Logout", path: "/login"}
    ];

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
                            <option value="2023">2023</option>
                            <option value="2022">2022</option>
                        </select>

                        <select className="filter-dropdown" onChange={(e) => setFilters({ ...filters, decision: e.target.value})}>
                            <option value="">Decision</option>
                            <option value="Approved">Approved</option>
                            <option value="Rejected">Rejected</option>
                        </select>

                        <select className="filter-dropdown" onChange={(e) => setFilters({ ...filters, grantType: e.target.value})}>
                            <option value="">Grant Type</option>
                            <option value="Research">Research</option>
                            <option value="Next Gen">Next Gen</option>
                        </select>

                        <select className="filter-dropdown" onChange={(e) => setFilters({ ...filters, institution: e.target.value})}>
                            <option value="">Institution</option>
                            <option value="Institution 1">Institution 1</option>
                            <option value="Institution 2">Institution 2</option>
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
                                                                    <p className="subtext">{app.applicationType}</p>
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
                                                                            <span className="detail-value">{ app.applicationTitle || " N/A"}</span>
                                                                        </div>
                                                                        <div className="detail-item">
                                                                            <span className="detail-label">Application Type: </span>
                                                                            <span className="detail-value">{ app.applicationType || " N/A"}</span>
                                                                        </div>
                                                                        <div className="detail-item">
                                                                            <span className="detail-label">Principal Investigator: </span>
                                                                            <span className="detail-value">{ app.principalInvestigator || " N/A"}</span>
                                                                        </div>
                                                                        <div className="detail-item">
                                                                            <span className="detail-label">Institution: </span>
                                                                            <span className="detail-value">{ app.institution || " N/A"}</span>
                                                                        </div>
                                                                    </div>
                                                                    <div className="details-block">
                                                                        <div className="detail-item">
                                                                            <span className="detail-label">Cancer Type: </span>
                                                                            <span className="detail-value">{ app.cancerType || " N/A"}</span>
                                                                        </div>
                                                                        <div className="detail-item">
                                                                            <span className="detail-label">Amount Requested: </span>
                                                                            <span className="detail-value">{ app.amountRequested || " N/A"}</span>
                                                                        </div>
                                                                        <div className="detail-item">
                                                                            <span className="detail-label">Continuation of Funding: </span>
                                                                            <span className="detail-value">{ app.continuationOfFunding || " N/A"}</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div className="action-buttons">
                                                                    <button className="action-button cover-sheet">
                                                                        Cover Sheet Information
                                                                        <FaChevronRight className="button-icon" />
                                                                    </button>
                                                                    <button className="action-button completed-app">
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