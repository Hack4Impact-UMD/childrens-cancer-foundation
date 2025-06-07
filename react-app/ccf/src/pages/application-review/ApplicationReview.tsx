import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./ApplicationReview.css";
import Sidebar from "../../components/sidebar/Sidebar";
import logo from "../../assets/ccf-logo.png";
import { getSidebarbyRole } from "../../types/sidebar-types";
import {
  collection,
  doc,
  getDoc,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { db } from "../..";
import { auth } from "../../index"; // Adjust path as needed
import Review from "../../types/review-types";
import {
  findReviewForReviewerAndApplication,
  updateReview,
  submitReview
} from "../../services/review-service";
import Button from "../../components/buttons/Button";
import { Application, NonResearchApplication, ResearchApplication } from "../../types/application-types";
import { Modal } from "../../components/modal/modal";
import CoverPageModal from "../../components/applications/CoverPageModal";

function ApplicationReview(): JSX.Element {
  const sidebarItems = getSidebarbyRole("reviewer");
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser } = auth;

  // Extract application ID from URL query params
  const searchParams = new URLSearchParams(location.search);
  const applicationId = searchParams.get("id");

  const [application, setApplication] = useState<Application>();
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [reviewer, setReviewer] = useState<any>(null);
  const [currentReview, setCurrentReview] = useState<Review | null>(null);
  const [overall, setOverall] = useState<string>("");

  const [feedback, setFeedback] = useState({
    significance: "",
    approach: "",
    feasibility: "",
    investigator: "",
    summary: "",
    internal: "",
  });

  // Fetch application data and reviewer info
  useEffect(() => {
    const fetchApplicationAndReviewer = async () => {
      if (!applicationId || !currentUser) {
        setError("Missing application ID or user not authenticated");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // Fetch application data
        const applicationRef = doc(db, "applications", applicationId);
        const applicationDoc = await getDoc(applicationRef);

        if (!applicationDoc.exists()) {
          setError("Application not found");
          setLoading(false);
          return;
        }

        const applicationData = applicationDoc.data() as Application;
        setApplication(applicationData);

        // Find reviewer info
        const reviewersRef = collection(db, "reviewers");
        const reviewerQuery = query(
          reviewersRef,
          where("email", "==", currentUser.email)
        );

        const reviewerSnapshot = await getDocs(reviewerQuery);

        if (reviewerSnapshot.empty) {
          setError("Reviewer profile not found");
          setLoading(false);
          return;
        }

        const reviewerDoc = reviewerSnapshot.docs[0];
        const reviewerData = { id: reviewerDoc.id, ...reviewerDoc.data() };
        setReviewer(reviewerData);

        // Find existing review for this reviewer and application
        const existingReview = await findReviewForReviewerAndApplication(
          applicationId,
          reviewerDoc.id
        );

        if (existingReview) {
          setCurrentReview(existingReview);
          setFeedback({
            ...existingReview.feedback,
            internal: existingReview.feedback.internal || ""
          });
          if (existingReview.score) {
            setOverall(existingReview.score.toString());
          }
        } else {
          setError("No review assignment found for this application");
          setLoading(false);
          return;
        }

        setLoading(false);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load application data. Please try again.");
        setLoading(false);
      }
    };

    fetchApplicationAndReviewer();
  }, [applicationId, currentUser]);

  const handleChange = (field: string, value: string) => {
    setFeedback({ ...feedback, [field]: value });
  };

  const handleOverallScoreChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setOverall(e.target.value);
  };

  const saveProgress = async () => {
    if (!currentReview?.id || !applicationId) return;

    try {
      setSaveStatus('saving');

      await updateReview(applicationId, currentReview.id, {
        feedback,
        status: "in-progress",
        ...(overall && { score: Number(overall) })
      });

      setSaveStatus('saved');

      // Reset status after 3 seconds
      setTimeout(() => {
        setSaveStatus('idle');
      }, 3000);

    } catch (err) {
      console.error("Error saving review:", err);
      setSaveStatus('error');
    }
  };

  const submitReviewHandler = async () => {
    if (!currentReview?.id || !overall || !applicationId) {
      alert("Please provide an overall score before submitting");
      return;
    }

    try {
      setSaveStatus('saving');

      await submitReview(applicationId, currentReview.id, Number(overall), feedback);

      setSaveStatus('saved');

      // Navigate back to dashboard after submission
      alert("Review submitted successfully!");
      navigate("/reviewer/dashboard");

    } catch (err) {
      console.error("Error submitting review:", err);
      setSaveStatus('error');
      alert("Error submitting review. Please try again.");
    }
  };

  const closeModal = () => {
    setModalOpen(false)
  }

  if (loading) {
    return (
      <div>
        <Sidebar links={sidebarItems} />
        <div className="dashboard-container">
          <div className="dashboard-content">
            <div className="dashboard-header-container">
              <img src={logo} alt="Logo" className="dashboard-logo" />
              <h1 className="dashboard-header">Application Review</h1>
            </div>
            <div className="applications-container">
              <p>Loading application data...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <Sidebar links={sidebarItems} />
        <div className="dashboard-container">
          <div className="dashboard-content">
            <div className="dashboard-header-container">
              <img src={logo} alt="Logo" className="dashboard-logo" />
              <h1 className="dashboard-header">Application Review</h1>
            </div>
            <div className="applications-container">
              <p className="error-message">{error}</p>
              <button
                className="save-button"
                onClick={() => navigate("/reviewer/dashboard")}
              >
                Return to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Sidebar links={sidebarItems} />

      <div className="dashboard-container">
        <div className="dashboard-content">
          <div className="dashboard-header-container">
            <img src={logo} alt="Logo" className="dashboard-logo" />
            <h1 className="dashboard-header">Application Review</h1>
          </div>

          <div className="applications-container">
            {application && (
              <div>
                <h2>Title: {application.title}</h2>
                <p>Applicant: {application.grantType == "nonresearch" ? (application as NonResearchApplication).requestor : (application as ResearchApplication).principalInvestigator}</p>
                <p>Type: {application.grantType}</p>
              </div>
            )}

            <p className="view-app-link" onClick={() => setModalOpen(true)}>VIEW APPLICATION</p>
            <div className="score-section">
              <p className="score-label">
                Overall score: (1 <em>exceptional</em> - 5{" "}
                <em>poor quality, unrepairable</em>)
              </p>
              <select
                className="score-dropdown"
                value={overall}
                onChange={handleOverallScoreChange}
                aria-label="Overall score selection"
              >
                <option value="">Enter score.</option>
                {[1, 2, 3, 4, 5].map((score) => (
                  <option key={score} value={score}>
                    {score}
                  </option>
                ))}
              </select>
            </div>

            <p className="feedback-heading">
              Feedback: <br />
              <strong className="red-text">
                ALL information inputted (unless otherwise noted) WILL be sent
                to applicant.
              </strong>
            </p>

            {[
              {
                key: "significance",
                label: "SIGNIFICANCE",
                question:
                  "How significant is the childhood cancer problem addressed by this proposal? How will the proposed study add to or enhance the currently available methods to prevent, treat or manage childhood cancer?",
              },
              {
                key: "approach",
                label: "APPROACH",
                question:
                  "Is the study hypothesis-driven? Is this a novel hypothesis or research question? How well do existing data support the current hypothesis? Are the aims and objectives appropriate for the hypothesis being tested? Are the methodology and evaluation component adequate to provide a convincing test of the hypothesis? Have the applicants adequately accounted for potential confounders? Are there any methodological weaknesses? If there are methodological weaknesses, how may they be corrected? Is the statistical analysis adequate?",
              },
              {
                key: "feasibility",
                label: "FEASIBILITY",
                question:
                  "Comment on how well the research team is to carry out the study. Is it feasible to carry out the project in the proposed location(s)? Can the project be accomplished within the proposed time period?",
              },
              {
                key: "investigator",
                label: "INVESTIGATOR",
                question:
                  "What has the productivity of the PI been over the past 3 years? If successful, does the track record of the PI indicate that future peer-reviewed funding will allow the project to continue? Are there adequate collaborations for work outside the PI's expertise?",
              },
              {
                key: "summary",
                label: "SUMMARY",
                question:
                  "Please provide any additional comments that would be helpful to the applicant, such as readability, grantsponsorship, etc., especially if the application does not score well.",
              },
            ].map(({ key, label, question }) => (
              <div key={key} className="feedback-section">
                <label>
                  <strong>{label}:</strong> {question}
                </label>
                <textarea
                  value={feedback[key as keyof typeof feedback] || ""}
                  onChange={(e) => handleChange(key, e.target.value)}
                  placeholder="Enter feedback."
                />
              </div>
            ))}

            <div className="internal-section">
              <p className="internal-label">Internal Comments/Notes:</p>
              <p className="internal-warning">
                <strong>
                  Information entered in this textbox will NOT be shared with
                  the applicant.
                </strong>
                <br />
                It is reserved for reviewer to reference during review call.
              </p>
              <textarea
                value={feedback.internal || ""}
                onChange={(e) => handleChange("internal", e.target.value)}
                placeholder="Enter Internal Comments."
              />
            </div>
          </div>

          <div className="button-group">
            <Button onClick={saveProgress} disabled={saveStatus === 'saving'}>
              <div>{saveStatus === 'saving' ? 'Saving...' :
                saveStatus === 'saved' ? 'Saved!' :
                  saveStatus === 'error' ? 'Error Saving' : 'Save Progress'}</div>
            </Button>
            <Button onClick={submitReviewHandler} disabled={saveStatus === 'saving'} height="40px">
                Submit
            </Button>
            {application ? <CoverPageModal onClose={closeModal} isOpen={modalOpen} application={application}></CoverPageModal> : ""}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ApplicationReview;
