
import "./ApplicantDashboard.css";
import { useEffect, useState } from "react";
import { FaArrowDown, FaArrowUp, FaFileAlt, FaArrowRight } from "react-icons/fa";
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
import ApplicationCycle from "../../types/applicationCycle-types";

function ApplicantUsersDashboard(): JSX.Element {
    const [sidebarItems, setSidebarItems] = useState<SideBarTypes[]>(getSidebarbyRole('applicant'));

    const [isApplicationCollapsed, setApplicationCollapsed] = useState(false);
    const [isFAQCollapsed, setFAQCollapsed] = useState(true);
    const [isContactCollapsed, setContactCollapsed] = useState(true);

    const toggleApplication = () => setApplicationCollapsed(!isApplicationCollapsed);
    const toggleFAQ = () => setFAQCollapsed(!isFAQCollapsed);
    const toggleContact = () => setContactCollapsed(!isContactCollapsed);

    const [completedApplications, setCompletedApplications] = useState<Application[]>();
    const [inProgressApplications, setInProgressApplications] = useState<Application[]>([]);
    const [openModal, setOpenModal] = useState<Application | null>();
    const [faqData, setFAQData] = useState<FAQItem[]>([]);
    const [appCycle, setAppCycle] = useState<ApplicationCycle>();
    const [applicationsOpen, setApplicationsOpen] = useState<boolean>(false);

    useEffect(() => {
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
        getUsersCurrentCycleAppplications().then((apps) => {
            setCompletedApplications(apps)
        }).catch((e) => {
            console.error(e)
        });
        getFAQs().then(faqs => {
            setFAQData(faqs)
        })
    }, []);

    const closeModal = () => {
        setOpenModal(null)
    }

    const navigate = useNavigate();

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
                                                        <p>{firstLetterCap(application.grantType)}</p>
                                                    </div>
                                                    <div className="ApplicantDashboard-application-status" onClick={() => { setOpenModal(application) }}>
                                                        <p>{firstLetterCap(application.decision)}</p>
                                                        <FaArrowRight className="application-status-icon" />
                                                    </div>
                                                    <CoverPageModal application={application} isOpen={openModal == application} onClose={closeModal}></CoverPageModal>
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