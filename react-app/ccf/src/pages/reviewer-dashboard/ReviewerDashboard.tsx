import React, { useEffect, useState } from "react";
import { FaFileAlt, FaArrowUp, FaArrowDown, FaArrowRight } from "react-icons/fa";
import logo from "../../assets/ccf-logo.png";
import Phone from '../../assets/call.png';
import Email from '../../assets/mail.png';
import document from '../../assets/documentIcon.png';
// import faqImage from '../assests/faqimage.png'
import "./ReviewerDashboard.css";
import Sidebar from "../../components/sidebar/Sidebar";
import FAQComponent from "../../components/faq/FaqComp";
import faqComp from "../../components/faq/FaqComp";

interface Application {
    applicationType: string;
    dueDate: string;
    status?: string;
}

interface FAQItem {
    question: string;
    answer: string;
}

interface ReviewerProp {
    faqData: FAQItem[];
    email: string;
    phone: string;
    hours: string;
}

function ReviewerDashboard({ faqData, email, phone, hours }: ReviewerProp): JSX.Element {
    // State for expandable sections
    const [isApplicationCollapsed, setApplicationCollapsed] = useState(false);
    const [isFAQCollapsed, setFAQCollapsed] = useState(true);
    const [isContactCollapsed, setContactCollapsed] = useState(false);

    // State for sidebar
    const [isCollapsed, setIsCollapsed] = useState(false);

    // State for reminder banner
    const [showReminder, setShowReminder] = useState(true);
    const currentDueDate = "May 5, 2024";
    const reviewCount = 4;

    // State for applications
    const [pendingReviews, setPendingReviews] = useState<Application[]>([]);
    const [inProgressReviews, setInProgressReviews] = useState<Application[]>([]);
    const [completedReviews, setCompletedReviews] = useState<Application[]>([]);

    // State for FAQ
    const [openFAQIndex, setOpenFAQIndex] = useState<number | null>(null);
    const [activePage, setActivePage] = useState("Applications");

    // Toggle functions
    const toggleApplication = () => setApplicationCollapsed(!isApplicationCollapsed);
    const toggleFAQ = () => setFAQCollapsed(!isFAQCollapsed);
    const toggleContact = () => setContactCollapsed(!isContactCollapsed);
    const handleQuestionClick = (index: number) => {
        setOpenFAQIndex(openFAQIndex === index ? null : index);
    };

    const handleDueDateClick = (dueDate: string) => {
        console.log(`Due date clicked: ${dueDate}`);
    };

    useEffect(() => {
        setPendingReviews([
            {
                applicationType: "Application Type",
                dueDate: "DUE MAY 5, 2024"
            },
            {
                applicationType: "Application Type",
                dueDate: "DUE MAY 12, 2024"
            }
        ]);

        setInProgressReviews([
            {
                applicationType: "Application Type",
                dueDate: "DUE MAY 5, 2024"
            },
            {
                applicationType: "Application Type",
                dueDate: "DUE MAY 5, 2024"
            }
        ]);

        setCompletedReviews([
            {
                applicationType: "Application Type",
                dueDate: "SUBMITTED: APRIL 4, 2023"
            },
            {
                applicationType: "Application Type",
                dueDate: "SUBMITTED: APRIL 4, 2023"
            }
        ]);
    }, []);

    const sidebarItems = [
        {name: "Home", path: "/"},
        {name: "Account Settings", path: "/settings"},
        {name: "Logout", path: "/login"}
      ];

    const faqData2 = [
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
    return (
        <div>
            <Sidebar links={sidebarItems}/>
            <div className="dashboard-container">
            {/*<div className={`dashboard-sidebar ${isCollapsed ? "collapsed" : ""}`}>*/}
            {/*    <div className="collapse-arrow" onClick={() => setIsCollapsed(!isCollapsed)}>*/}
            {/*        {isCollapsed ? ">>>" : "<<<"}*/}
            {/*    </div>*/}
            {/*    <nav className="sidebar-nav">*/}
            {/*        {sidebarItems.map((item) => (*/}
            {/*            <button*/}
            {/*                key={item}*/}
            {/*                className={`nav-item ${item === activePage ? "active" : ""}`}*/}
            {/*                onClick={() => setActivePage(item)}*/}
            {/*            >*/}
            {/*                {item}*/}
            {/*            </button>*/}
            {/*        ))}*/}
            {/*    </nav>*/}
            {/*</div>*/}


            <div className="dashboard-content" style={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>

                <div className="dashboard-header-container">
                    <img src={logo} alt="Logo" className="dashboard-logo" />
                    <h1 className="dashboard-header">Reviewer Dashboard</h1>
                </div>

                {/*{showReminder && (*/}
                {/*    // <div className="reminder-banner">*/}
                {/*    //     <div> REMINDER: {reviewCount} Reviews Due {currentDueDate}.*/}
                {/*    //     </div>*/}
                {/*    //*/}
                {/*    //     <button className="close-button" onClick={() => setShowReminder(false)}>*/}
                {/*    //         ×*/}
                {/*    //     </button>*/}
                {/*    //*/}
                {/*    //*/}
                {/*    // </div>*/}
                {/*)}*/}

                <div className="dashboard-sections-content" style={{flexGrow: 1}}>
                    <div className="dashboard-section">
                        <div className="section-header">
                            <div className="header-content">
                                <img src={document} alt="Document Icon" className="section-icon" />
                                <h2>Applications to Review</h2>
                            </div>
                            <button onClick={toggleApplication} className="expand-collapse-btn">
                                {isApplicationCollapsed ? <FaArrowDown /> : <FaArrowUp />}
                            </button>
                        </div>

                        {!isApplicationCollapsed && (
                            <div className="applications-container">
                                {pendingReviews.length > 0 && (
                                    <>
                                        <h3>NOT STARTED REVIEWS:</h3>
                                        {pendingReviews.map((application, index) => (
                                            <div key={index} className="single-application-box">
                                                <div className="application-info">
                                                    <FaFileAlt className="application-icon" />
                                                    <p>{application.applicationType}</p>
                                                </div>
                                                <button
                                                    className="due-date-button"
                                                    onClick={() => handleDueDateClick(application.dueDate)}
                                                >
                                                    {application.dueDate}
                                                    <FaArrowRight className="arrow" />
                                                </button>
                                            </div>
                                        ))}
                                        <hr className="red-line" />
                                    </>
                                )}

                                {inProgressReviews.length > 0 && (
                                    <>
                                        <h3>IN PROGRESS REVIEWS:</h3>
                                        {inProgressReviews.map((application, index) => (
                                            <div key={index} className="single-application-box">
                                                <div className="application-info">
                                                    <FaFileAlt className="application-icon" />
                                                    <p>{application.applicationType}</p>
                                                </div>
                                                <button
                                                    className="due-date-button"
                                                    onClick={() => handleDueDateClick(application.dueDate)}
                                                >
                                                    {application.dueDate}
                                                    <FaArrowRight className="arrow" />
                                                </button>
                                            </div>
                                        ))}
                                        <hr className="red-line" />
                                    </>
                                )}

                                {completedReviews.length > 0 && (
                                    <>
                                        <h3>COMPLETED REVIEWS:</h3>
                                        {completedReviews.map((application, index) => (
                                            <div key={index} className="single-application-box">
                                                <div className="application-info">
                                                    <FaFileAlt className="application-icon" />
                                                    <p>{application.applicationType}</p>
                                                </div>
                                                <button
                                                    className="due-date-button"
                                                    onClick={() => handleDueDateClick(application.dueDate)}
                                                >
                                                    {application.dueDate}
                                                    <FaArrowRight className="arrow" />
                                                </button>
                                            </div>
                                        ))}
                                    </>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="dashboard-section">
                        <div className="section-header">
                            <div className="header-content">
                                <img src={document} alt="Document Icon" className="section-icon" />
                                <h2>Frequently Asked Questions</h2>
                            </div>
                            <button onClick={toggleFAQ} className="expand-collapse-btn">
                                {isFAQCollapsed ? <FaArrowDown /> : <FaArrowUp />}
                            </button>
                        </div>
                        {!isFAQCollapsed && (
                            <div className="faq-content-wrapper">

                                <FAQComponent faqs={faqData2}/>
                                {/*{faqData.map((faq, index) => (*/}
                                {/*    <div key={index} className="faq-item">*/}
                                {/*        <button*/}
                                {/*            className={`faq-question ${openFAQIndex === index ? "open" : ""}`}*/}
                                {/*            onClick={() => handleQuestionClick(index)}*/}
                                {/*        >*/}
                                {/*            <div className="question-content">*/}
                                {/*                <img src={document} alt="FAQ Icon" className="question-icon" />*/}
                                {/*                <span className="question-text">{faq.question}</span>*/}
                                {/*            </div>*/}
                                {/*        </button>*/}
                                {/*        {openFAQIndex === index && (*/}
                                {/*            <div className="faq-answer">*/}
                                {/*                <p>{faq.answer}</p>*/}
                                {/*            </div>*/}
                                {/*        )}*/}
                                {/*    </div>*/}
                                {/*))}*/}
                            </div>
                        )}
                    </div>

                    <div className="dashboard-section">
                        <div className="section-header">
                            <div className="header-content">
                                <img src={document} alt="Document Icon" className="section-icon" />
                                <h2>Contact Us</h2>
                            </div>
                            <button onClick={toggleContact} className="expand-collapse-btn">
                                {isContactCollapsed ? <FaArrowDown /> : <FaArrowUp />}
                            </button>
                        </div>
                        {!isContactCollapsed && (
                            <div className="contact-box">
                                <div className="contact-method">
                                    <div className="contact-method-header">
                                        <img src={Email} alt="Email Icon" className="contact-icon" />
                                        <h2 className="contact-method-title">Email Support</h2>
                                    </div>
                                    <p className="contact-text">Email us and we'll get back to you as soon as possible.</p>
                                    <a href={`mailto:${email}`} className="contact-link">
                                        {email}
                                    </a>
                                </div>

                                <div className="contact-method">
                                    <div className="contact-method-header">
                                        <img src={Phone} alt="Phone Icon" className="contact-icon" />
                                        <h2 className="contact-method-title">Call Support</h2>
                                    </div>
                                    <p className="contact-text">Call us and we'll get back to you as soon as possible.</p>
                                    <a href={`tel:${phone}`} className="contact-link">
                                        {phone}
                                    </a>
                                    <p className="contact-hours">{hours}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
        </div>
    );
}

export default ReviewerDashboard;