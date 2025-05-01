
import "./ApplicantDashboard.css";
import {useEffect, useState} from "react";
import {FaArrowDown, FaArrowUp, FaFileAlt, FaArrowRight} from "react-icons/fa";
import logo from "../../assets/ccf-logo.png";
import Button from "../../components/buttons/Button"
import FAQComponent from "../../components/faq/FaqComp";
import Sidebar from "../../components/sidebar/Sidebar";
import ContactUs from "../../components/contact/ContactUs";
import Banner from "../../components/banner/Banner";
import { useNavigate } from "react-router-dom";
import { getSidebarbyRole } from '../../types/sidebar-types';

function ApplicantUsersDashboard(): JSX.Element {
    const sidebarItems = getSidebarbyRole('applicant');

    const [isApplicationCollapsed, setApplicationCollapsed] = useState(false);
    const [isFAQCollapsed, setFAQCollapsed] = useState(true);
    const [isContactCollapsed, setContactCollapsed] = useState(true);

    const toggleApplication = () => setApplicationCollapsed(!isApplicationCollapsed);
    const toggleFAQ = () => setFAQCollapsed(!isFAQCollapsed);
    const toggleContact = () => setContactCollapsed(!isContactCollapsed);

    const [completedApplications, setCompletedApplications] = useState<any>([]);
    const [inProgressApplications, setInProgressApplications] = useState<any>([]);

    useEffect(() => {
        // Fetch data from the backend
        //setCompletedApplications(data);
        //setinProgressApplications(data);

        setCompletedApplications([{
            "applicationType": "NextGen",
            "status": "FUNDED"
        }, {"applicationType": "Research Grant", "status": "NOT FUNDED"}]);
        setInProgressApplications([{"applicationType": "Research Grant", "status": "SUBMITTED: MAY 5, 2024"}]);
    }, []);

    const faqData = [
        {question: 'What is React?', answer: 'React is a JavaScript library for building user interfaces.'},
        {
            question: 'What is TypeScript?',
            answer: 'TypeScript is a typed superset of JavaScript that compiles to plain JavaScript.'
        },
        {
            question: 'How do I use this component?',
            answer: 'Pass a list of questions and answers as props to the FAQComponent.'
        },
    ];

    const navigate = useNavigate();

    return (
        <div>
            <Sidebar links={sidebarItems}/>
            <div className={"dashboard-container"} style={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                <div className="ApplicantDashboard">
                    <div className="ApplicantDashboard-header-container">
                        <img src={logo} className="ApplicantDashboard-logo" alt="logo"/>
                        <h1 className="ApplicantDashboard-header">
                            Applicant Dashboard
                        </h1>
                    </div>
                    <Banner deadline={new Date('2024-12-31T23:59:59')}></Banner>
                    <div className="ApplicantDashboard-sections-content">
                        <div className="ApplicantDashboard-section">
                            <div className="ApplicantDashboard-section-header">
                                <div className="header-title">
                                    <FaFileAlt className="section-icon"/>
                                    <h2>Applications</h2>
                                </div>

                                <button onClick={toggleApplication} className="expand-collapse-btn">
                                    {isApplicationCollapsed ? <FaArrowDown/> : <FaArrowUp/>}
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
                                                        <FaFileAlt className="application-icon"/>
                                                        <p>{application.applicationType}</p>
                                                    </div>
                                                    <div className="ApplicantDashboard-application-status">
                                                        <p>{application.status}</p>
                                                        <FaArrowRight className="application-status-icon"/>
                                                    </div>
                                                </div>
                                            ))}
                                            <hr className="red-line"/>
                                        </>
                                    )}

                                    {completedApplications && Object.keys(completedApplications).length > 0 && (
                                        <>
                                            <h3>COMPLETED APPLICATIONS:</h3>
                                            {completedApplications.map((application: any, index: number) => (
                                                <div key={index} className="ApplicantDashboard-single-application-box">
                                                    <div className="application-info">
                                                        <FaFileAlt className="application-icon"/>
                                                        <p>{application.applicationType}</p>
                                                    </div>
                                                    <div className="ApplicantDashboard-application-status">
                                                        <p>{application.status}</p>
                                                        <FaArrowRight className="application-status-icon"/>
                                                    </div>
                                                </div>
                                            ))}
                                            <hr className="red-line"/>
                                        </>
                                    )}

                                    <h3>START YOUR APPLICATION:</h3>
                                    <div className="ApplicantDashboard-buttons">
                                       <Button width="25%" height="46px" onClick={() => {navigate("/applicant/application-form/nextgen")}}>NextGen</Button>
                                        <Button width="25%" height="46px" onClick={() => {navigate("/applicant/application-form/research")}}>Research Grant</Button>
                                        <Button width="25%" height="46px" onClick={() => {navigate("/applicant/application-form/nonresearch")}}>Non-Research Grant</Button>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="ApplicantDashboard-section">
                            <div className="ApplicantDashboard-section-header">
                                <div className="header-title">
                                    <FaFileAlt className="section-icon"/>
                                    <h2>Frequently Asked Questions</h2>
                                </div>
                                <button onClick={toggleFAQ} className="expand-collapse-btn">
                                    {isFAQCollapsed ? <FaArrowDown/> : <FaArrowUp/>}
                                </button>
                            </div>
                            {!isFAQCollapsed && (
                 
                                    <FAQComponent faqs={faqData}/>
                            )}

                        </div>

                        <div className="ApplicantDashboard-section">
                            <div className="ApplicantDashboard-section-header">
                                <div className="header-title">
                                    <FaFileAlt className="section-icon"/>
                                    <h2>Contact Us</h2>
                                </div>
                                <button onClick={toggleContact} className="expand-collapse-btn">
                                    {isContactCollapsed ? <FaArrowDown/> : <FaArrowUp/>}
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