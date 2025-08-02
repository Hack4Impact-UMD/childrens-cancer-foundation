import React, { useState, useEffect } from "react";
import { FaExclamationTriangle, FaFileAlt } from "react-icons/fa";
import logo from "../../assets/ccf-logo.png";
import Sidebar from "../../components/sidebar/Sidebar";
import { getSidebarbyRole, getApplicantSidebarItems, SideBarTypes } from "../../types/sidebar-types";
import { getUsersCurrentCycleAppplications } from "../../backend/application-filters";
import { getDecisionData } from "../../services/decision-data-service";
import { getCurrentCycle } from "../../backend/application-cycle";
import { Application } from "../../types/application-types";
import { Decision } from "../../types/decision-types";
import { DecisionBox } from "../../components/decisions/decisionBox";
import { firstLetterCap } from "../../utils/stringfuncs";
import "./ApplicantDecisions.css";

interface ApplicationWithDecision extends Application {
    decision?: Decision;
    hasDecision: boolean;
}

function ApplicantDecisions(): JSX.Element {
    const [sidebarItems, setSidebarItems] = useState<SideBarTypes[]>(getSidebarbyRole('applicant'));
    const [applications, setApplications] = useState<ApplicationWithDecision[]>([]);
    const [selectedApplication, setSelectedApplication] = useState<ApplicationWithDecision | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Fetch dynamic sidebar items
        getApplicantSidebarItems().then((items) => {
            setSidebarItems(items);
        }).catch((e) => {
            console.error('Error loading sidebar items:', e);
        });

        const fetchApplicationsAndDecisions = async () => {
            try {
                setLoading(true);

                // Check if we're in Final Decisions stage
                const currentCycle = await getCurrentCycle();
                if (currentCycle.stage !== "Final Decisions") {
                    setError("Decisions are not yet available. Please check back during the Final Decisions stage.");
                    setLoading(false);
                    return;
                }

                // Get user's applications for current cycle
                const userApplications = await getUsersCurrentCycleAppplications();

                if (userApplications.length === 0) {
                    setError("No applications found for the current cycle.");
                    setLoading(false);
                    return;
                }

                // Efficiently fetch decisions for all applications
                const applicationsWithDecisions: ApplicationWithDecision[] = await Promise.all(
                    userApplications.map(async (app) => {
                        try {
                            const decision = await getDecisionData(app.id);
                            return {
                                ...app,
                                decision: decision || undefined,
                                hasDecision: !!decision
                            };
                        } catch (error) {
                            console.warn(`No decision found for application ${app.id}`);
                            return {
                                ...app,
                                decision: undefined,
                                hasDecision: false
                            };
                        }
                    })
                );

                setApplications(applicationsWithDecisions);

                // Auto-select first application if only one, or first with decision
                if (applicationsWithDecisions.length === 1) {
                    setSelectedApplication(applicationsWithDecisions[0]);
                } else {
                    const firstWithDecision = applicationsWithDecisions.find(app => app.hasDecision);
                    if (firstWithDecision) {
                        setSelectedApplication(firstWithDecision);
                    } else {
                        setSelectedApplication(applicationsWithDecisions[0]);
                    }
                }

            } catch (error) {
                console.error("Error fetching applications and decisions:", error);
                setError("Failed to load applications and decisions. Please try again later.");
            } finally {
                setLoading(false);
            }
        };

        fetchApplicationsAndDecisions();
    }, []);

    if (loading) {
        return (
            <div>
                <Sidebar links={sidebarItems} />
                <div className="decisions-container">
                    <div className="decisions-content">
                        <div className="decisions-header-container">
                            <img src={logo} className="decisions-logo" alt="logo" />
                            <h1 className="decisions-header">Application Decisions</h1>
                        </div>
                        <div className="loading-message">Loading your decisions...</div>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div>
                <Sidebar links={sidebarItems} />
                <div className="decisions-container">
                    <div className="decisions-content">
                        <div className="decisions-header-container">
                            <img src={logo} className="decisions-logo" alt="logo" />
                            <h1 className="decisions-header">Application Decisions</h1>
                        </div>
                        <div className="error-message">
                            <FaExclamationTriangle className="error-icon" />
                            <p>{error}</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div>
            <Sidebar links={sidebarItems} />
            <div className="decisions-container">
                <div className="decisions-content">
                    <div className="decisions-header-container">
                        <img src={logo} className="decisions-logo" alt="logo" />
                        <h1 className="decisions-header">Application Decisions</h1>
                    </div>

                    <div className="decisions-layout">
                        {/* Application Selection Panel */}
                        <div className="applications-panel">
                            <h2>Your Applications</h2>
                            {applications.map((app) => (
                                <div
                                    key={app.id}
                                    className={`application-item ${selectedApplication?.id === app.id ? 'selected' : ''} ${app.hasDecision ? 'has-decision' : 'no-decision'}`}
                                    onClick={() => setSelectedApplication(app)}
                                >
                                    <div className="application-item-header">
                                        <FaFileAlt className="application-icon" />
                                        <span className="application-type">{firstLetterCap(app.grantType)}</span>
                                        {app.hasDecision && <FaExclamationTriangle className="decision-indicator" />}
                                    </div>
                                    <div className="application-title">
                                        {app.title || `${firstLetterCap(app.grantType)} Application`}
                                    </div>
                                    <div className="application-status">
                                        {app.hasDecision ? (
                                            <span className="status-with-decision">
                                                Decision Available
                                            </span>
                                        ) : (
                                            <span className="status-pending">
                                                Decision Pending
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Decision Display Panel */}
                        <div className="decision-panel">
                            {selectedApplication ? (
                                <div>
                                    <h2>Decision for {firstLetterCap(selectedApplication.grantType)} Application</h2>
                                    {selectedApplication.title && (
                                        <h3 className="application-title-detail">{selectedApplication.title}</h3>
                                    )}

                                    {selectedApplication.hasDecision && selectedApplication.decision ? (
                                        <DecisionBox decision={selectedApplication.decision} />
                                    ) : (
                                        <div className="no-decision-message">
                                            <FaExclamationTriangle className="pending-icon" />
                                            <h3>Decision Pending</h3>
                                            <p>
                                                The decision for this application has not been finalized yet.
                                                Please check back later or contact the administration if you have questions.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="no-selection-message">
                                    <p>Select an application from the left to view its decision.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ApplicantDecisions;