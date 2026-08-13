import { useState, useEffect, useMemo } from "react";
import "./AllApplications.css";
import RoleDashboardShell from "../../components/dashboard-layout/RoleDashboardShell";
import { FaSearch, FaChevronRight, FaArrowUp, FaArrowDown } from "react-icons/fa";
import blueDocument from "../../assets/blueDocumentIcon.png";
import yellowDocument from "../../assets/yellowDocumentIcon.png";
import { getFilteredApplications } from "../../backend/application-filters";
import { getAllCycles } from "../../backend/application-cycle";
import { ApplicationDetails, NonResearchApplication, ResearchApplication } from "../../types/application-types";
import CoverPageModal from "../../components/applications/CoverPageModal";
import { getSidebarbyRole } from "../../types/sidebar-types";
import { formatGrantType } from "../../utils/stringfuncs";
import { compareCycleNamesDesc, groupApplicationsByCycle } from "../../utils/cycleGrouping";

type ReviewerApplication = (ResearchApplication | NonResearchApplication) & ApplicationDetails;

function AllApplications(): JSX.Element {
  const [applicationsByCycle, setApplicationsByCycle] = useState<{
    [cycle: string]: ReviewerApplication[];
  }>({});
  const [availableYears, setAvailableYears] = useState<string[]>([]);
  const [collapseState, setCollapseState] = useState<{ [cycle: string]: boolean }>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [openModal, setOpenModal] = useState<ReviewerApplication | null>(null);
  const [filters, setFilters] = useState({
    applicationCycle: "",
    decision: "",
    grantType: "",
    institution: "",
  });
  const sidebarItems = getSidebarbyRole("reviewer");

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        // Fetch every submitted application across all cycles (matches the
        // admin database), then group by cycle name.
        const allApps = (await getFilteredApplications({})).filter(
          (app) => (app as any).status !== "draft" && (app as any).applicationCycle,
        ) as ReviewerApplication[];

        const grouped = groupApplicationsByCycle(allApps);
        setApplicationsByCycle(grouped);

        const years = new Set<string>(Object.keys(grouped));

        // The filter dropdown should list every cycle, not just cycles that
        // already have submitted applications (matches the admin database).
        try {
          const cycles = await getAllCycles();
          cycles.forEach((cycle) => {
            if (cycle.name) years.add(cycle.name);
          });
        } catch (e) {
          console.error("Error fetching cycles for filter:", e);
        }
        setAvailableYears(Array.from(years).sort(compareCycleNamesDesc));

        // Start every cycle expanded.
        const initialCollapse: { [cycle: string]: boolean } = {};
        Object.keys(grouped).forEach((cycle) => {
          initialCollapse[cycle] = false;
        });
        setCollapseState(initialCollapse);
      } catch (e) {
        console.log(e);
      }
    };

    fetchApplications();
  }, []);

  const availableInstitutions = useMemo(() => {
    const set = new Set<string>();
    Object.values(applicationsByCycle).forEach((apps) => {
      apps.forEach((app) => {
        if (app.institution) set.add(app.institution);
      });
    });
    return Array.from(set).sort();
  }, [applicationsByCycle]);

  const filteredByCycle = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return Object.keys(applicationsByCycle).reduce(
      (acc, cycle) => {
        if (filters.applicationCycle && cycle !== filters.applicationCycle) {
          return acc;
        }
        const filtered = applicationsByCycle[cycle].filter(
          (app) =>
            (!term || (app.title && app.title.toLowerCase().includes(term))) &&
            (!filters.grantType || app.grantType === filters.grantType) &&
            (!filters.decision || app.decision === filters.decision) &&
            (!filters.institution || app.institution === filters.institution),
        );
        if (filtered.length) {
          acc[cycle] = filtered;
        }
        return acc;
      },
      {} as { [cycle: string]: ReviewerApplication[] },
    );
  }, [applicationsByCycle, searchTerm, filters]);

  const toggleCycle = (cycle: string) => {
    setCollapseState((prev) => ({ ...prev, [cycle]: !prev[cycle] }));
  };

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
                value={filters.applicationCycle}
                onChange={(e) =>
                  setFilters({ ...filters, applicationCycle: e.target.value })
                }
                aria-label="Filter by application cycle"
              >
                <option value="">Application Cycle</option>
                {availableYears.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>

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

        {Object.keys(filteredByCycle).length === 0 ? (
          <div className="empty-state">No applications matching filters</div>
        ) : (
          Object.keys(filteredByCycle)
            .sort(compareCycleNamesDesc)
            .map((cycle) => (
              <div key={cycle} className="dashboard-section">
                <div
                  className="section-header"
                  onClick={() => toggleCycle(cycle)}
                >
                  <div className="header-content">
                    <img
                      src={blueDocument}
                      alt="Application Icon"
                      className="section-icon"
                    />
                    <h2>{cycle}</h2>
                  </div>
                  <button className="expand-collapse-btn" aria-label="Toggle cycle">
                    {collapseState[cycle] ? <FaArrowDown /> : <FaArrowUp />}
                  </button>
                </div>

                {!collapseState[cycle] && (
                  <div className="applications-container">
                    {filteredByCycle[cycle].map((coverSheet, index) => (
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
                )}
              </div>
            ))
        )}
      </div>
    </RoleDashboardShell>
  );
}

export default AllApplications;
