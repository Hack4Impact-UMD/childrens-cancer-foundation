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
import CoverPageModal from "../../components/applications/CoverPageModal";
import { Application, NonResearchApplication, ResearchApplication } from "../../types/application-types";
import { firstLetterCap } from "../../utils/stringfuncs";
import { getFilteredApplications } from "../../backend/application-filters";
import Button from "../../components/buttons/Button";
import AdminCoverPageModal from "../../components/applications/AdminCoverPageModal";
import DynamicApplicationPreview from "../../components/dynamic-forms/DynamicApplicationPreview";
import { dynamicFieldsEngine } from "../../services/dynamic-fields-engine";

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
    const [openModal, setOpenModal] = useState<Application | null>();
    const [openDynamicFieldsModal, setOpenDynamicFieldsModal] = useState<Application | null>();
    
    // Dynamic fields state - no longer needed since we show all by default

    const closeModal = () => {
        setOpenModal(null)
    }

    const closeDynamicFieldsModal = () => {
        setOpenDynamicFieldsModal(null)
    }

    useEffect(() => {
        const fetchApplications = async () => {
            try {
                const apps = await getFilteredApplications({})
                // Group applications by year
                const applications: { [year: string]: Application[] } = {};
                const institutions = new Set<string>();
                const years = new Set<string>();

                apps.forEach((data) => {
                    // Extract the year from timestamp or application cycle field
                    const year = data.applicationCycle

                    // Map Firestore data to Application interface
                    const application: Application = data as Application
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
                        const key = `${year}-${index}`;
                        initialExpandedState[key] = false;
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

    // toggleDynamicFields function removed - no longer needed

    const filteredApplications = Object.keys(applicationsData).reduce((acc, year) => {
        const filtered = applicationsData[year].filter(app =>
            (filters.applicationCycle ? year === filters.applicationCycle : true) &&
            (filters.decision ? app.decision === filters.decision : true) &&
            (filters.grantType ? app.grantType.toLowerCase().includes(filters.grantType.toLowerCase()) : true) &&
            (filters.institution ? app.institution === filters.institution : true) &&
            (searchTerm ? app.title.toLowerCase().includes(searchTerm.toLowerCase()) : true)
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
        }
    };

    return (
        <div>
            <Sidebar links={sidebarItems} />

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
                        <select className="filter-dropdown" onChange={(e) => setFilters({ ...filters, applicationCycle: e.target.value })}>
                            <option value="">Application Cycle</option>
                            {availableYears.map((year) => (
                                <option key={year} value={year}>{year}</option>
                            ))}
                        </select>

                        <select className="filter-dropdown" onChange={(e) => setFilters({ ...filters, decision: e.target.value })}>
                            <option value="">Decision</option>
                            <option value="accepted">Approved</option>
                            <option value="rejected">Rejected</option>
                            <option value="pending">Pending</option>
                        </select>

                        <select className="filter-dropdown" onChange={(e) => setFilters({ ...filters, grantType: e.target.value })}>
                            <option value="">Grant Type</option>
                            <option value="research">Research</option>
                            <option value="nextgen">Next Gen</option>
                        </select>

                        <select className="filter-dropdown" onChange={(e) => setFilters({ ...filters, institution: e.target.value })}>
                            <option value="">Institution</option>
                            {availableInstitutions.map((institution) => (
                                <option key={institution} value={institution}>{institution}</option>
                            ))}
                        </select>
                    </div>





                    {Object.keys(filteredApplications).length == 0 ? "No applications matching filters" :

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
                                            <div className="applications-container" >
                                                {filteredApplications[year].map((app, index) => {
                                                    const isExpanded = expandedApplications[`${year}-${index}`];
                                                    const iconColor = isExpanded ? blueDocument : yellowDocument;
                                                    return (
                                                        <div key={index} className={`single-application-box ${isExpanded ? 'expanded' : ''}`}>
                                                            <div className="application-header">
                                                                <div className="application-info">
                                                                    <img src={iconColor} alt="Document Icon" className="section-icon" />
                                                                    <div className="application-info-text">
                                                                        <p className="application-title">{app.title}</p>
                                                                        <p className="subtext">{app.grantType} - {app.decision.charAt(0).toUpperCase() + app.decision.slice(1)}</p>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {isExpanded && (
                                                                <div className="application-details">
                                                                    <hr className="divider" />
                                                                    {/* Dynamic Application Summary - First 6 Fields */}
                                                                    <DynamicApplicationPreview 
                                                                        application={app}
                                                                        showAllFields={false}
                                                                        maxFields={6}
                                                                        className="summary-preview"
                                                                        onShowAllFields={() => setOpenDynamicFieldsModal(app)}
                                                                    />
                                                                    
                                                                    <div className="action-buttons">
                                                                        <Button className="action-button cover-sheet" onClick={(event) => { event.stopPropagation(); setOpenModal(app) }}>
                                                                            Cover Sheet Information
                                                                            <FaChevronRight className="button-icon" />
                                                                        </Button>
                                                                        {/* <button
                                                                        className="action-button completed-app"
                                                                        onClick={() => openApplicationDocument(app.file)}
                                                                    >
                                                                        Completed Application
                                                                    </button> */}
                                                                    </div>
                                                                    <AdminCoverPageModal application={app} isOpen={openModal == app} onClose={closeModal}></AdminCoverPageModal>
                                                                </div>
                                                            )}
                                                            <button className="expand-collapse-btn" onClick={() => toggleApplication(year, index)}>
                                                                {isExpanded ? <FaArrowUp /> : <FaArrowDown />}
                                                            </button>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>
                    }
                </div>
            </div>

            {/* Dynamic Fields Modal */}
            {openDynamicFieldsModal && (
                <div className="dynamic-fields-modal">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h3>Complete Application Data</h3>
                            <button 
                                className="close-button"
                                onClick={closeDynamicFieldsModal}
                            >
                                ×
                            </button>
                        </div>
                        <div className="modal-body">
                            <DynamicApplicationPreview 
                                application={openDynamicFieldsModal}
                                showAllFields={true}
                                maxFields={100}
                                className="modal-preview"
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminApplicationsDatabase;