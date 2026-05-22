import { useState, useEffect, useMemo } from "react";
import "./AllApplications.css";
import RoleDashboardShell from "../../components/dashboard-layout/RoleDashboardShell";
import { FaSearch, FaChevronRight } from "react-icons/fa";
import blueDocument from "../../assets/blueDocumentIcon.png";
import yellowDocument from "../../assets/yellowDocumentIcon.png";
import { getFilteredApplications } from "../../backend/application-filters";
import { getCurrentCycle, checkAndUpdateCycleStageIfNeeded } from "../../backend/application-cycle";
import { ApplicationDetails, NonResearchApplication, ResearchApplication } from "../../types/application-types";
import CoverPageModal from "../../components/applications/CoverPageModal";
import { getSidebarbyRole } from "../../types/sidebar-types";
import { firstLetterCap } from "../../utils/stringfuncs";

type ReviewerApplication = (ResearchApplication | NonResearchApplication) & ApplicationDetails;

function formatGrantType(grantType: string): string {
  if (!grantType) return "";
  if (grantType.toLowerCase() === "nextgen") return "NextGen";
  if (grantType.toLowerCase() === "nonresearch") return "Non-Research";
  return firstLetterCap(grantType);
}

function AllApplications(): JSX.Element {
  const [applicationsData, setApplicationsData] = useState<ReviewerApplication[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [cycleName, setCycleName] = useState<string>("");
  const [openModal, setOpenModal] = useState<ReviewerApplication | null>(null);
  const [filters, setFilters] = useState({
    decision: "",
    grantType: "",
    institution: "",
  });
  const sidebarItems = getSidebarbyRole("reviewer");

  useEffect(() => {
    getCurrentCycle()
      .then(async (cycle) => {
        const updatedCycle = await checkAndUpdateCycleStageIfNeeded(cycle);
        setCycleName(updatedCycle.name);
        const apps = await getFilteredApplications({ date: updatedCycle.name });
        setApplicationsData(apps);
      })
      .catch((e) => {
        console.log(e);
      });
  }, []);

  const availableInstitutions = useMemo(() => {
    const set = new Set<string>();
    applicationsData.forEach((app) => {
      if (app.institution) set.add(app.institution);
    });
    return Array.from(set).sort();
  }, [applicationsData]);

  const filteredApplications = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return applicationsData.filter(
      (app) =>
        app.title &&
        app.title.toLowerCase().includes(term) &&
        (!filters.grantType || app.grantType === filters.grantType) &&
        (!filters.decision || app.decision === filters.decision) &&
        (!filters.institution || app.institution === filters.institution),
    );
  }, [applicationsData, searchTerm, filters]);

  return (
    <RoleDashboardShell
      sidebarItems={sidebarItems}
      title="Application Database"
      stackClassName="reviewer-database-page"
    >
      <div className="dashboard-sections-content">
        <div className="ccf-toolbar">
          <div className="ccf-toolbar-row">
            <div className="ccf-toolbar-search">
              <FaSearch className="ccf-toolbar-search-icon" />
              <input
                type="text"
                placeholder="Search by application title"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                aria-label="Search applications"
              />
            </div>
          </div>
          <div className="ccf-toolbar-row">
            <div className="ccf-toolbar-filters">
              <select
                value={filters.decision}
                onChange={(e) =>
                  setFilters({ ...filters, decision: e.target.value })
                }
                aria-label="Filter by decision"
              >
                <option value="">Decision</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="pending">Pending</option>
              </select>

              <select
                value={filters.grantType}
                onChange={(e) =>
                  setFilters({ ...filters, grantType: e.target.value })
                }
                aria-label="Filter by grant type"
              >
                <option value="">Grant Type</option>
                <option value="research">Research</option>
                <option value="nextgen">Next Gen</option>
                <option value="nonresearch">Non-Research</option>
              </select>

              <select
                value={filters.institution}
                onChange={(e) =>
                  setFilters({ ...filters, institution: e.target.value })
                }
                aria-label="Filter by institution"
              >
                <option value="">Institution</option>
                {availableInstitutions.map((institution) => (
                  <option key={institution} value={institution}>
                    {institution}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {filteredApplications.length === 0 ? (
          <div className="empty-state">No applications matching filters</div>
        ) : (
          <div className="dashboard-section">
            <div className="section-header">
              <div className="header-content">
                <img
                  src={blueDocument}
                  alt="Application Icon"
                  className="section-icon"
                />
                <h2>{cycleName || "Applications"}</h2>
              </div>
            </div>

            <div className="applications-container">
              {filteredApplications.map((coverSheet, index) => (
                <div
                  key={coverSheet.applicationId ?? index}
                  className="single-application-box clickable"
                  role="button"
                  tabIndex={0}
                  onClick={() => setOpenModal(coverSheet)}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setOpenModal(coverSheet); } }}
                >
                  <div className="application-summary-row">
                    <div className="application-header">
                      <div className="application-info">
                        <img
                          src={yellowDocument}
                          alt="Document Icon"
                          className="section-icon"
                        />
                        <div className="application-info-text">
                          <p className="application-title">{coverSheet.title}</p>
                          <p className="subtext">
                            {formatGrantType(coverSheet.grantType)}
                          </p>
                        </div>
                      </div>
                    </div>
                    <FaChevronRight className="application-open-icon" aria-hidden="true" />
                  </div>
                  <CoverPageModal
                    onClose={() => setOpenModal(null)}
                    isOpen={coverSheet === openModal}
                    application={coverSheet}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </RoleDashboardShell>
  );
}

export default AllApplications;
