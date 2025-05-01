import { useState, useEffect } from "react";
import "./AllApplications.css";
import Sidebar from "../../components/sidebar/Sidebar";
import { FaArrowDown, FaArrowUp, FaFileAlt } from "react-icons/fa";
import logo from "../../assets/ccf-logo.png";
import document from "../../assets/documentIcon.png";
import { getFilteredApplications } from "../../backend/application-filters";
import { getCurrentCycle } from "../../backend/application-cycle";
import { ApplicationDetails, NonResearchApplication, ResearchApplication } from "../../types/application-types";
import CoverPageModal from "../../components/applications/CoverPageModal";
import { getSidebarbyRole } from "../../types/sidebar-types";

function AllApplications(): JSX.Element {
  const [applicationsData, setApplicationsData] = useState<((ResearchApplication | NonResearchApplication) & ApplicationDetails)[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<((ResearchApplication | NonResearchApplication) & ApplicationDetails)[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [openModal, setOpenModal] = useState<((ResearchApplication | NonResearchApplication) & ApplicationDetails) | null>(null);
  const [filters, setFilters] = useState({
    applicationCycle: "",
    decision: "",
    grantType: "",
    institution: "",
  });
  const sidebarItems = getSidebarbyRole("reviewer")

  /*Make use of application box component instead, also retrieve applications from firebase*/
  useEffect(() => {
    getCurrentCycle().then((cycle) => {
      getFilteredApplications({date: cycle.name}).then((apps) => {
        setApplicationsData(apps)
        setFilteredApplications(apps)
      })
    }).catch((e) => {
      console.log(e)
    });
  }, []);

  useEffect(() => {
    const filteredApps = applicationsData
      .filter((app) => app.title.toLowerCase().includes(searchTerm.toLowerCase())
        && (app.grantType == filters["grantType"] || !filters["grantType"])
        && (app.decision == filters["decision"] || !filters["decision"])
        && (app.institution == filters["institution"] || !filters["institution"])
      )
      setFilteredApplications(filteredApps)
  }, [filters, searchTerm])


  return (
    <div>
      <Sidebar links={sidebarItems} />

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

            <select
              className="filter-dropdown"
              onChange={(e) =>
                setFilters({ ...filters, decision: e.target.value })
              }
            >
              <option value="">Decision</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="pending">Pending</option>
            </select>

            <select
              className="filter-dropdown"
              onChange={(e) =>
                setFilters({ ...filters, grantType: e.target.value })
              }
            >
              <option value="">Grant Type</option>
              <option value="research">Research</option>
              <option value="nextgen">Next Gen</option>
              <option value="nonresearch">Non-Research</option>
            </select>

            <select
              className="filter-dropdown"
              onChange={(e) =>
                setFilters({ ...filters, institution: e.target.value })
              }
            >
              <option value="">Institution</option>
              <option value="Institution1">Institution1</option>
              <option value="Institution2">Institution2</option>
            </select>
          </div>
            {filteredApplications.map(
              (coverSheet, index) => (
                <div>
                <div
                  key={index}
                  className="single-application-box clickable"
                  onClick={() => {setOpenModal(coverSheet)}}
                >
                  <div className="application-info">
                    <FaFileAlt className="application-icon" />
                    <div className="application-info-text">
                      <p>{coverSheet.title}</p>
                      <p className="subtext">
                        {coverSheet.grantType.toUpperCase()}
                      </p>
                    </div>
                  </div>
                  </div>
                  <CoverPageModal onClose={() => {setOpenModal(null)}} isOpen={coverSheet == openModal} application={coverSheet}></CoverPageModal>
                </div>
              )
            )}
        </div>
      </div>
    </div>
  );
}

export default AllApplications;
