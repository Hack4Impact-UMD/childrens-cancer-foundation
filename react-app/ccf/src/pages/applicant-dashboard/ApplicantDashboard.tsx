
import "./ApplicantDashboard.css";
import { useEffect, useState } from "react";
import { FaArrowDown, FaArrowUp, FaFileAlt, FaArrowRight, FaCheckCircle, FaEye } from "react-icons/fa";
import logo from "../../assets/ccf-logo.png";
import Button from "../../components/buttons/Button"
import FAQComponent from "../../components/faq/FaqComp";
import Sidebar from "../../components/sidebar/Sidebar";
import ContactUs from "../../components/contact/ContactUs";
import Banner from "../../components/banner/Banner";
import { useNavigate } from "react-router-dom";
import { getSidebarbyRole, getApplicantSidebarItems, SideBarTypes } from '../../types/sidebar-types';
import { getUsersCurrentCycleAppplications } from "../../backend/application-filters";
import { Application } from "../../types/application-types";
import { firstLetterCap } from "../../utils/stringfuncs"
import CoverPageModal from "../../components/applications/CoverPageModal";
import { FAQItem } from "../../types/faqTypes";
import { getFAQs } from "../../backend/faq-handler";
import { getCurrentCycle } from "../../backend/application-cycle";
import { getDecisionData } from "../../services/decision-data-service";
import { getReportsByUser } from "../../backend/post-grant-reports";
import ApplicationCycle from "../../types/applicationCycle-types";
import { auth } from "../../index";
import { PostGrantReport } from "../../types/post-grant-report-types";
import { getPDFDownloadURL } from "../../storage/storage";

type ApplicationWithDecision = Application & {
    isAccepted?: boolean;
    hasReportSubmitted?: boolean;
    submittedReport?: PostGrantReport;
};

function ApplicantUsersDashboard(): JSX.Element {
    const [sidebarItems, setSidebarItems] = useState<SideBarTypes[]>(getSidebarbyRole('applicant'));

    const [isApplicationCollapsed, setApplicationCollapsed] = useState(false);
    const [isFAQCollapsed, setFAQCollapsed] = useState(true);
    const [isContactCollapsed, setContactCollapsed] = useState(true);

    const toggleApplication = () => setApplicationCollapsed(!isApplicationCollapsed);
    const toggleFAQ = () => setFAQCollapsed(!isFAQCollapsed);
    const toggleContact = () => setContactCollapsed(!isContactCollapsed);

    const [completedApplications, setCompletedApplications] = useState<ApplicationWithDecision[]>();
    const [inProgressApplications, setInProgressApplications] = useState<Application[]>([]);
    const [openModal, setOpenModal] = useState<Application | null>();
    const [faqData, setFAQData] = useState<FAQItem[]>([]);
    const [appCycle, setAppCycle] = useState<ApplicationCycle>();
    const [applicationsOpen, setApplicationsOpen] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        const initializeData = async () => {
            try {
                setLoading(true);

                // Fetch dynamic sidebar items
                getApplicantSidebarItems().then((items) => {
                    setSidebarItems(items);
                }).catch((e) => {
                    console.error('Error loading sidebar items:', e);
                });

                getCurrentCycle().then((cycle) => {
                    setAppCycle(cycle)
                    setApplicationsOpen(cycle.stage == "Applications Open")
                }).catch((e) => {
                    console.error(e)
                })

                // Fetch FAQ data
                getFAQs().then((faqs) => {
                    console.log('FAQ data loaded:', faqs);
                    setFAQData(faqs);
                }).catch((e) => {
                    console.error('Error loading FAQ data:', e);
                });

                // Get user applications and check decisions
                const apps = await getUsersCurrentCycleAppplications();

                const appsWithDecisions: ApplicationWithDecision[] = await Promise.all(
                    apps.map(async (app: any) => {
                        try {
                            const decision = await getDecisionData(app.id);

                            // Use the same logic as PostGrantReportPage.tsx
                            let hasReportSubmitted = false;
                            let submittedReport = null;

                            const user = auth.currentUser;
                            if (user) {
                                const userReports = await getReportsByUser(user.uid);
                                const existingReport = userReports.find(report => report.applicationId === app.id);
                                if (existingReport) {
                                    hasReportSubmitted = true;
                                    submittedReport = existingReport;

                                    // Get the PDF URL for viewing
                                    try {
                                        const fileId = existingReport.pdf || existingReport.file;
                                        if (fileId) {
                                            const pdfUrl = await getPDFDownloadURL(fileId);
                                            submittedReport.file = pdfUrl;
                                        }
                                    } catch (error) {
                                        console.error('Error getting PDF URL for dashboard:', error);
                                    }
                                }
                            }

                            return {
                                ...app,
                                isAccepted: decision?.isAccepted === true,
                                hasReportSubmitted,
                                submittedReport
                            };
                        } catch (error) {
                            return {
                                ...app,
                                isAccepted: false,
                                hasReportSubmitted: false
                            };
                        }
                    })
                );

                setCompletedApplications(appsWithDecisions);
            } catch (error) {
                console.error('Error initializing dashboard:', error);
            } finally {
                setLoading(false);
            }
        };

        initializeData();
    }, []);

    const closeModal = () => {
        setOpenModal(null)
    }

    const navigate = useNavigate();

    // Get accepted applications that need post-grant reports
    const acceptedApplications = completedApplications?.filter(app => app.isAccepted) || [];
    const applicationsNeedingReports = acceptedApplications.filter(app => !app.hasReportSubmitted);
    const submittedReports = acceptedApplications.filter(app => app.hasReportSubmitted);

    const formatDate = (dateString: string | Date | undefined | null) => {
        if (!dateString) {
            return 'N/A';
        }

        try {
            if (typeof dateString === 'string') {
                const date = new Date(dateString);
                if (isNaN(date.getTime())) {
                    return 'Invalid Date';
                }
                return date.toLocaleDateString();
            }

            if (dateString instanceof Date) {
                return dateString.toLocaleDateString();
            }

            return 'Invalid Date';
        } catch (error) {
            console.error('Error formatting date:', error);
            return 'Error';
        }
    };

    return (
        <div>
            <Sidebar links={sidebarItems} />
            <div className={"dashboard-container"} style={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                <div className="ApplicantDashboard">
                    <div className="ApplicantDashboard-header-container">
                        <img src={logo} className="ApplicantDashboard-logo" alt="logo" />
                        <h1 className="ApplicantDashboard-header">
                            Applicant Dashboard
                        </h1>
                    </div>
                    {
                        appCycle?.stage == "Applications Open" ?
                            <Banner>{`REMINDER: Research applications due on ${appCycle?.researchDeadline.toLocaleDateString()}, Nextgen applications due on ${appCycle?.nextGenDeadline.toLocaleDateString()}, Nonresearch applications due on ${appCycle?.nonResearchDeadline.toLocaleDateString()}`}</Banner> :
                            <Banner>ALERT: Applications Are Closed for this Year</Banner>
                    }

                    {/* Post-Grant Reports Section */}
                    {acceptedApplications.length > 0 && (
                        <div className="post-grant-reports-section">
                            <div className="post-grant-reports-header">
                                <h2>📋 Post-Grant Reports</h2>
                                <p>You have {acceptedApplications.length} accepted application{acceptedApplications.length > 1 ? 's' : ''}.</p>
                                {applicationsNeedingReports.length > 0 && (
                                    <p>{applicationsNeedingReports.length} application{applicationsNeedingReports.length > 1 ? 's' : ''} require{applicationsNeedingReports.length > 1 ? '' : 's'} post-grant report{applicationsNeedingReports.length > 1 ? 's' : ''}.</p>
                                )}
                                {appCycle?.postGrantReportDeadline && (
                                    <div className="deadline-info">
                                        <p><strong>Deadline:</strong> {appCycle.postGrantReportDeadline.toLocaleDateString()} at 11:59 PM</p>
                                        {new Date() > appCycle.postGrantReportDeadline && (
                                            <p className="overdue-notice">⚠️ Reports are overdue!</p>
                                        )}
                                    </div>
                                )}
                            </div>
                            <div className="post-grant-reports-list">
                                {acceptedApplications.map((application, index) => (
                                    <div key={index} className="post-grant-report-item">
                                        <div className="report-item-info">
                                            <FaFileAlt className="report-icon" />
                                            <span className="report-title">{(application as any).title || `${firstLetterCap((application as any).grantType)} Application`}</span>
                                        </div>
                                        {application.hasReportSubmitted ? (
                                            <button
                                                className="post-grant-report-btn submitted"
                                                onClick={() => navigate(`/applicant/post-grant-report/${(application as any).id}`)}
                                            >
                                                Report Already Submitted ✓
                                            </button>
                                        ) : (
                                            <button
                                                className="post-grant-report-btn"
                                                onClick={() => navigate(`/applicant/post-grant-report/${(application as any).id}`)}
                                            >
                                                Submit Report
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}



                    <div className="ApplicantDashboard-sections-content">
                        <div className="ApplicantDashboard-section">
                            <div className="ApplicantDashboard-section-header">
                                <div className="header-title">
                                    <FaFileAlt className="section-icon" />
                                    <h2>Applications</h2>
                                </div>

                                <button onClick={toggleApplication} className="expand-collapse-btn">
                                    {isApplicationCollapsed ? <FaArrowDown /> : <FaArrowUp />}
                                </button>
                            </div>


                            {!isApplicationCollapsed && (
                                <div className="ApplicantDashboard-application-box">
                                    {inProgressApplications && Object.keys(inProgressApplications).length > 0 && (
                                        <>
                                            <h3>IN PROGRESS APPLICATIONS:</h3>
                                            {inProgressApplications.map((application: any, index: number) => (
                                                <div key={index} className="ApplicantDashboard-single-application-box">
                                                    <div className="application-info">
                                                        <FaFileAlt className="application-icon" />
                                                        <p>{application.applicationType}</p>
                                                    </div>
                                                    <div className="ApplicantDashboard-application-status">
                                                        <p>{application.status}</p>
                                                        <FaArrowRight className="application-status-icon" />
                                                    </div>
                                                </div>
                                            ))}
                                            <hr className="red-line" />
                                        </>
                                    )}

                                    {completedApplications && Object.keys(completedApplications).length > 0 && (
                                        <>
                                            <h3>COMPLETED APPLICATIONS:</h3>
                                            {completedApplications.map((application, index) => (
                                                <div key={index} className="ApplicantDashboard-single-application-box">
                                                    <div className="application-info" >
                                                        <FaFileAlt className="application-icon" />
                                                        <p>{firstLetterCap((application as any).grantType)}</p>
                                                    </div>
                                                    <div className="ApplicantDashboard-application-status" onClick={() => { setOpenModal(application as Application) }}>
                                                        <p>{firstLetterCap((application as any).decision)}</p>
                                                        <FaArrowRight className="application-status-icon" />
                                                    </div>
                                                    <CoverPageModal application={application as Application} isOpen={openModal == application} onClose={closeModal}></CoverPageModal>
                                                </div>
                                            ))}
                                            <hr className="red-line" />
                                        </>
                                    )}

                                    <h3>START YOUR APPLICATION:</h3>
                                    <div className="ApplicantDashboard-buttons">
                                        <Button disabled={!applicationsOpen} width="25%" height="46px" onClick={() => { navigate("/applicant/application-form/nextgen") }}>NextGen</Button>
                                        <Button disabled={!applicationsOpen} width="25%" height="46px" onClick={() => { navigate("/applicant/application-form/research") }}>Research Grant</Button>
                                        <Button disabled={!applicationsOpen} width="25%" height="46px" onClick={() => { navigate("/applicant/application-form/nonresearch") }}>Non-Research Grant</Button>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="ApplicantDashboard-section">
                            <div className="ApplicantDashboard-section-header">
                                <div className="header-title">
                                    <FaFileAlt className="section-icon" />
                                    <h2>Frequently Asked Questions</h2>
                                </div>
                                <button onClick={toggleFAQ} className="expand-collapse-btn">
                                    {isFAQCollapsed ? <FaArrowDown /> : <FaArrowUp />}
                                </button>
                            </div>
                            {!isFAQCollapsed && (

                                <FAQComponent faqs={faqData} />
                            )}

                        </div>

                        <div className="ApplicantDashboard-section">
                            <div className="ApplicantDashboard-section-header">
                                <div className="header-title">
                                    <FaFileAlt className="section-icon" />
                                    <h2>Contact Us</h2>
                                </div>
                                <button onClick={toggleContact} className="expand-collapse-btn">
                                    {isContactCollapsed ? <FaArrowDown /> : <FaArrowUp />}
                                </button>
                            </div>
                            {!isContactCollapsed && (
                                <ContactUs email={"contact@ccf.org"} phone={"111-222-3333"} hours={"Monday - Friday 10AM - 5PM"} />
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )

};

export default ApplicantUsersDashboard;