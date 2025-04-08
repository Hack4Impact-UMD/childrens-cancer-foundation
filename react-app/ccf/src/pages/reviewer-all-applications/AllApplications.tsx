import { useState, useEffect } from "react";
import "./AllApplications.css";
import Sidebar from "../../components/sidebar/Sidebar";
import { FaArrowDown, FaArrowUp, FaFileAlt } from "react-icons/fa";
import logo from "../../assets/ccf-logo.png";
import document from '../../assets/documentIcon.png';

interface Application {
    applicationTitle: string;
    applicationType: string;
    decision: string;
    //cancerType: string; /*dont know if cancer type is needed or not */
    institution?: string; /*don't know how institution is sorted, is it by name or a list */
}

function AllApplications(): JSX.Element {
    const [applicationsData, setApplicationsData] = useState<{ [year: string]: { coverSheets: Application[]} }>({});
    const [collapseState, setCollapseState] = useState<{ [year: string]: { coverSheets: boolean; isYearCollapsed: boolean } }>({});
    const [searchTerm, setSearchTerm] = useState("");
    const [filters, setFilters] = useState({
        applicationCycle: "",
        decision: "",
        grantType: "",
        institution: ""
    });

    /*Make use of application box component instead, also retrieve applications from firebase*/
    useEffect(() => {
        const initialData = {
            "All Applications for 2024 Cycle": {
                coverSheets: [
                    { applicationTitle: "Application Title", applicationType: "Application Type (Next Gen/Research)", decision: "", cancerType: "" },
                    { applicationTitle: "Application Title", applicationType: "Application Type (Next Gen/Research)", decision: "", cancerType: "" },
                    { applicationTitle: "Application Title", applicationType: "Application Type (Next Gen/Research)", decision: "", cancerType: "" },
                ]
            }, 
            "All Applications for 2023 Cycle": {
                coverSheets: [
                    { applicationTitle: "Application Title", applicationType: "Application Type (Next Gen/Research)", decision: "", cancerType: "" },
                    { applicationTitle: "Application Title", applicationType: "Application Type (Next Gen/Research)", decision: "", cancerType: "" },
                    { applicationTitle: "Application Title", applicationType: "Application Type (Next Gen/Research)", decision: "", cancerType: "" },
                ]
            }
        };

        setApplicationsData(initialData);

        const initialCollapseState = Object.keys(initialData).reduce((acc, year) => {
            acc[year] = { coverSheets: false, isYearCollapsed: false };
            return acc;
        }, {} as { [year: string]: { coverSheets: boolean; isYearCollapsed: boolean } });

        setCollapseState(initialCollapseState);
    }, []);

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
                (filters.institution ? app.institution === filters.institution : true) && 
                (searchTerm ? app.applicationTitle.toLowerCase().includes(searchTerm.toLowerCase()) : true)
            ),
        };

        if (filteredYearData.coverSheets.length) {
            acc[year] = filteredYearData;
        }
        return acc;
    }, {} as typeof applicationsData);

    const sidebarItems = [
        {name: "Home", path: "/"},
        {name: "Account Settings", path: "/settings"},
        {name: "Assigned Applications", path: "/"}, //need to fill a path for this
        {name: "All Applications", path: "/reviewer-dashboard/all-applications"}
    ];

    return (
        <div>
            <Sidebar links={sidebarItems}/>

            <div className="dashboard-container">
                <div className="dashboard-content">
                    <div className="dashboard-header-container">
                        <img src={logo} alt="Logo" className="dashboard-logo" />
                        <h1 className="dashboard-header">All Applications</h1>
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
                            <option value="Institution1">Institution1</option>
                            <option value="Institution2">Institution2</option>
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

export default AllApplications;