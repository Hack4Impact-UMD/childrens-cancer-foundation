import { useState, useEffect } from "react";
import "./AdminDatabase.css";
import Sidebar from "../../components/sidebar/Sidebar";
import { FaArrowDown, FaArrowUp, FaFileAlt } from "react-icons/fa";
import logo from "../../assets/ccf-logo.png";
import document from '../../assets/documentIcon.png';

interface Application {
    applicationTitle: string;
    applicationType: string;
    decision: string;
    cancerType: string;
}

function AdminApplicationsDatabase(): JSX.Element {
    const [applicationsData, setApplicationsData] = useState<{ [year: string]: { coverSheets: Application[], proposals: Application[] } }>({});
    const [collapseState, setCollapseState] = useState<{ [year: string]: { coverSheets: boolean; proposals: boolean; isYearCollapsed: boolean } }>({});
    const [searchTerm, setSearchTerm] = useState("");
    const [filters, setFilters] = useState({
        applicationCycle: "",
        decision: "",
        grantType: "",
        cancerType: ""
    });

    useEffect(() => {
        const initialData = {
            "2023": {
                coverSheets: [
                    { applicationTitle: "Application Title", applicationType: "Application Type (Next Gen/Research)", decision: "", cancerType: "" },
                    { applicationTitle: "Application Title", applicationType: "Application Type (Next Gen/Research)", decision: "", cancerType: "" },
                    { applicationTitle: "Application Title", applicationType: "Application Type (Next Gen/Research)", decision: "", cancerType: "" },
                ],
                proposals: [
                    { applicationTitle: "Application Title", applicationType: "Application Type (Next Gen/Research)", decision: "", cancerType: "" },
                    { applicationTitle: "Application Title", applicationType: "Application Type (Next Gen/Research)", decision: "", cancerType: "" },
                    { applicationTitle: "Application Title", applicationType: "Application Type (Next Gen/Research)", decision: "", cancerType: "" },
                ]
            }, 
            "2022": {
                coverSheets: [
                    { applicationTitle: "Application Title", applicationType: "Application Type (Next Gen/Research)", decision: "", cancerType: "" },
                    { applicationTitle: "Application Title", applicationType: "Application Type (Next Gen/Research)", decision: "", cancerType: "" },
                    { applicationTitle: "Application Title", applicationType: "Application Type (Next Gen/Research)", decision: "", cancerType: "" },
                ],
                proposals: [
                    { applicationTitle: "Application Title", applicationType: "Application Type (Next Gen/Research)", decision: "", cancerType: "" },
                    { applicationTitle: "Application Title", applicationType: "Application Type (Next Gen/Research)", decision: "", cancerType: "" },
                    { applicationTitle: "Application Title", applicationType: "Application Type (Next Gen/Research)", decision: "", cancerType: "" },
                ]
            }
        };

        setApplicationsData(initialData);

        const initialCollapseState = Object.keys(initialData).reduce((acc, year) => {
            acc[year] = { coverSheets: false, proposals: false, isYearCollapsed: false };
            return acc;
        }, {} as { [year: string]: { coverSheets: boolean; proposals: boolean; isYearCollapsed: boolean } });

        setCollapseState(initialCollapseState);
    }, []);

    const toggleSection = (year: string, section: "coverSheets" | "proposals") => {
        setCollapseState(prevState => ({
            ...prevState,
            [year]: {
                ...prevState[year],
                [section]: !prevState[year][section]
            }
        }));
    };

    const toggleYear = (year: string) => {
        setCollapseState(prevState => ({
            ...prevState, 
            [year]: {
                ...prevState[year],
                isYearCollapsed: !prevState[year].isYearCollapsed
            }
        }));
    };

    const filteredApplications = Object.keys(applicationsData).reduce((acc, year) => {
        const filteredYearData = {
            coverSheets: applicationsData[year].coverSheets.filter(app => 
                (filters.applicationCycle ? year === filters.applicationCycle : true) &&
                (filters.decision ? app.decision === filters.decision : true) &&
                (filters.grantType ? app.applicationType.includes(filters.grantType) : true) && 
                (filters.cancerType ? app.cancerType === filters.cancerType : true) && 
                (searchTerm ? app.applicationTitle.toLowerCase().includes(searchTerm.toLowerCase()) : true)
            ),
            proposals: applicationsData[year].proposals.filter(app => 
                (filters.applicationCycle ? year === filters.applicationCycle : true) &&
                (filters.decision ? app.decision === filters.decision : true) &&
                (filters.grantType ? app.applicationType.includes(filters.grantType) : true) && 
                (filters.cancerType ? app.cancerType === filters.cancerType : true) && 
                (searchTerm ? app.applicationTitle.toLowerCase().includes(searchTerm.toLowerCase()) : true)
            )
        };

        if (filteredYearData.coverSheets.length || filteredYearData.proposals.length) {
            acc[year] = filteredYearData;
        }
        return acc;
    }, {} as typeof applicationsData);

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
                        <h1 className="dashboard-header">Application Database</h1>
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

                        <select className="filter-dropdown" onChange={(e) => setFilters({ ...filters, cancerType: e.target.value})}>
                            <option value="">Cancer Type</option>
                            <option value="Lung Cancer">Lung Cancer</option>
                            <option value="Breast Cancer">Breast Cancer</option>
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
                                        {collapseState[year]?.isYearCollapsed ? <FaArrowDown /> : <FaArrowUp />}
                                    </button>
                                </div>

                                {!collapseState[year]?.isYearCollapsed && (
                                    <> 
                                        <div className="applications-container">
                                            <h3 onClick={() => toggleSection(year, "coverSheets")} className="section-toggle">
                                                Cover Sheets
                                                <button className="expand-collapse-btn">
                                                    {collapseState[year]?.coverSheets ? <FaArrowDown /> : <FaArrowUp />}
                                                </button>
                                            </h3>

                                            {!collapseState[year]?.coverSheets && applicationsData[year].coverSheets.map((coverSheet, index) => (
                                                <div key={index} className="single-application-box">
                                                    <div className="application-info">
                                                        <FaFileAlt className="application-icon" />
                                                        <div className="application-info-text">
                                                            <p>{coverSheet.applicationTitle}</p>
                                                            <p className="subtext">{coverSheet.applicationType}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="applications-container">
                                            <h3 onClick={() => toggleSection(year, "proposals")} className="section-toggle">
                                                Proposals
                                                <button className="expand-collapse-btn">
                                                    {collapseState[year]?.proposals ? <FaArrowDown /> : <FaArrowUp />}
                                                </button>
                                            </h3>

                                            {!collapseState[year]?.proposals && applicationsData[year].proposals.map((proposal, index) => (
                                                <div key={index} className="single-application-box">
                                                    <div className="application-info">
                                                        <FaFileAlt className="application-icon" />
                                                        <p>{proposal.applicationType}</p>
                                                    </div>
                                                </div>
                                            ))}
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