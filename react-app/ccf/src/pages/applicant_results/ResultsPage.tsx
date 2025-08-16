import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import "./ResultsPage.css";
import Sidebar from "../../components/sidebar/Sidebar";
import { getSidebarbyRole, getApplicantSidebarItems, SideBarTypes } from "../../types/sidebar-types";
import { Decision } from "../../types/decision-types";
import { ReviewSummary } from "../../types/review-types"; 
import { getReviewsForApplication } from "../../services/review-service"; 
import { useNavigate } from "react-router-dom";

function ResultsPage(): JSX.Element {
    const [sidebarItems, setSidebarItems] = useState<SideBarTypes[]>(getSidebarbyRole('applicant')); //to get applicaant info in sidebar
    const [reviewsSummary, setReviewsSummary] = useState<ReviewSummary | null>(null); //for review summary

     useEffect(() => {
            // to get decision tab in the sidebar as well - copied from Applicant Decisions page
            getApplicantSidebarItems().then((items) => {
                setSidebarItems(items);
            }).catch((e) => {
                console.error('Error loading sidebar items:', e);
            });
    })

    //get decision info
    const location = useLocation();
    const decision = location.state.decision;
    const applicationId = decision?.applicationId;

    useEffect(() => {
    if (!applicationId) return;

    const fetchReviews = async () => {
      try {
        const summary = await getReviewsForApplication(applicationId);
        setReviewsSummary(summary);
      } catch (error) {
        console.error("Error fetching reviews:", error);
      }
    };

    fetchReviews();
    }, [applicationId]);

    const navigate = useNavigate();
    
    const goDashboard = () => {
        navigate("/applicant/dashboard");
    };

    return(
        <div>
            <Sidebar links={sidebarItems} />
            <div className="main-container">
                <h1 className="main-header">Grant Results</h1>
                <div className="form-container">
                    <div>
                    {decision?.isAccepted ? (
                        <div>
                        <h1 className="decision-title">Congratulations!</h1>
                        <div>
                            <div className="letter-content">
                                <p>We are delighted to inform you that your application has been selected for funding! Your proposal stood out for its innovation, potential impact, and clarity of your research goals. We are honored to support your work and look forward to the significant advancements your project promises to bring.</p>
                                <p>
                                You and your grant administrator will receive further communication regarding the agreement and funds disbursement via email from our office.
                                </p>
                                <p>
                                This grant represents our confidence in your vision and dedication, and we are excited to see how this support will empower your research journey. Please be in touch with questions as you move forward with your project.
                                </p>
                                <p>
                                Congratulations on this well-deserved award!
                                </p>
                                <p>Warm regards, <br /> The Children’s Cancer Foundation, Inc.</p>
                            </div>
                        </div>
                        <h2 className="decision-labels">Funding Amount:</h2>
                        <p className="reward-money">Reward Money Amount: <b>${decision.fundingAmount}</b></p>
                        </div>
                    ) : (
                        <div>
                        <h1 className="decision-title">Thank you.</h1>
                        <div>
                            <div className="letter-content">
                                <p>
                                Thank you for submitting an application for CCF funding. After careful review by an independent committee, we regret to inform you that your proposal was not selected for funding this cycle. We received an extraordinary number of applications, making the selection process highly competitive, and while we were deeply impressed by the vision and potential impact of your project, we were unable to fund all deserving proposals.
                                </p>
                                <p>
                                Please know that this decision is not wholly a reflection on the quality of your work. We encourage you to apply again in the future, as each cycle brings new opportunities and priorities.
                                </p>
                                <p>
                                We wish you all the best.
                                </p>
                                <p>Warm regards, <br /> The Children’s Cancer Foundation, Inc.</p>
                                </div>
                            </div>
                        </div>
                    )}
                    <h2 className="decision-labels">Feedback from Reviewers:</h2>
                    <div className="reviews-container">
                        <div className="review-section">
                            <h3 className="review-text"><b>SIGNIFICANCE:</b> How significant is the childhood cancer problem addressed by this proposal? How will the proposed study add to or enhance the currently available methods to prevent, treat or manage childhood cancer?</h3>
                            <div className="reviews">
                                <h2>Reviewer 1:</h2>
                                <div className="review-box">
                                    <p>{reviewsSummary?.primaryReview?.feedback.significance ?? "No review available"}</p>
                                </div>
                                <h2>Reviewer 2:</h2>
                                <div className="review-box">
                                    <p>{reviewsSummary?.secondaryReview?.feedback.significance ?? "No review available"}</p>
                                </div>
                            </div>
                        </div>
                        <div className="review-section">
                            <h3 className="review-text"><b>APPROACH:</b> Is the study hypothesis-driven? Is this a novel hypothesis or research question?  How well do existing data support the current hypothesis? Are the aims and objectives appropriate for the hypothesis being tested? Are the methodology and evaluation component adequate to provide a convincing test of the hypothesis?  Have the applicants adequately accounted for potential confounders?  Are there any methodological weaknesses? If there are methodological weaknesses, how may they be corrected?  Is the statistical analysis adequate? </h3>
                            <div className="reviews">
                                <h2>Reviewer 1:</h2>
                                <div className="review-box">
                                    <p>{reviewsSummary?.primaryReview?.feedback.approach ?? "No review available"}</p>
                                </div>
                                <h2>Reviewer 2:</h2>
                                <div className="review-box">
                                    <p>{reviewsSummary?.secondaryReview?.feedback.approach ?? "No review available"}</p>
                                </div>
                            </div>
                        </div>
                        <div className="review-section">
                            <h3 className="review-text"><b>FEASIBILITY:</b> Comment on how well the research team is to carry out the study.  Is it feasible to carry out the project in the proposed location(s)?  Can the project be accomplished within the proposed time period?</h3>
                            <div className="reviews">
                                <h2>Reviewer 1:</h2>
                                <div className="review-box">
                                    <p>{reviewsSummary?.primaryReview?.feedback.feasibility ?? "No review available"}</p>
                                </div>
                                <h2>Reviewer 2:</h2>
                                <div className="review-box">
                                    <p>{reviewsSummary?.secondaryReview?.feedback.feasibility ?? "No review available"}</p>
                                </div>
                            </div>
                        </div>
                        <div className="review-section">
                            <h3 className="review-text"><b>INVESTIGATOR:</b> What has the productivity of the PI been over the past 3 years? If successful, does the track record of the PI indicate that future peer-reviewed funding will allow the project to continue? Are there adequate collaborations for work outside the PI’s expertise?</h3>
                            <div className="reviews">
                                <h2>Reviewer 1:</h2>
                                <div className="review-box">
                                    <p>{reviewsSummary?.primaryReview?.feedback.investigator ?? "No review available"}</p>
                                </div>
                                <h2>Reviewer 2:</h2>
                                <div className="review-box">
                                    <p>{reviewsSummary?.secondaryReview?.feedback.investigator ?? "No review available"}</p>
                                </div>
                            </div>
                        </div>
                        <div className="review-section">
                            <h3 className="review-text"><b>SUMMARY:</b> Please provide any additional comments that would be helpful to the applicant, such as readability, grantspersonship, etc., especially if the application does not score well.</h3>
                            <div className="reviews">
                                <h2>Reviewer 1:</h2>
                                <div className="review-box">
                                    <p>{reviewsSummary?.primaryReview?.feedback.summary ?? "No review available"}</p>
                                </div>
                                <h2>Reviewer 2:</h2>
                                <div className="review-box">
                                    <p>{reviewsSummary?.secondaryReview?.feedback.summary ?? "No review available"}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    </div>
                </div>
                <button onClick={goDashboard} className="button">Return to Dashboard</button>
            </div>
        </div>  
    );
};

export default ResultsPage;