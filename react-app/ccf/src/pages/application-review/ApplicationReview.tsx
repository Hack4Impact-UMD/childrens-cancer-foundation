import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./ApplicationReview.css";
import RoleDashboardShell from "../../components/dashboard-layout/RoleDashboardShell";
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
import { getCurrentCycle } from "../../backend/application-cycle";
import Button from "../../components/buttons/Button";
import { Application, NonResearchApplication, ResearchApplication } from "../../types/application-types";
import CoverPageModal from "../../components/applications/CoverPageModal";

// Old NIH scale: 1.0 (best) through 5.0 (worst) in 0.1 increments.
// Built from tenths so the option values are free of float artifacts.
const SCORE_OPTIONS = Array.from({ length: 41 }, (_, i) => ((10 + i) / 10).toFixed(1));

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
  const [currentReview, setCurrentReview] = useState<Review | null>(null);
  const [overall, setOverall] = useState<string>("");
  const [isReviewLocked, setIsReviewLocked] = useState(false);

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
    if (!applicationId || !currentUser) {
      setError("Missing application ID or user not authenticated");
      setLoading(false);
      return;
    }

    let isActive = true;

    const refreshCycleLockState = async () => {
      try {
        const cycle = await getCurrentCycle();

        if (!isActive) {
          return;
        }

        // Locked in every stage except the open review period ("Review").
        setIsReviewLocked(cycle.stage !== "Review");
      } catch (error) {
        console.error("Error refetching cycle:", error);
      }
    };

    const fetchApplicationAndReviewer = async () => {
      try {
        setLoading(true);

        // Fetch current cycle to check if reviews are locked
        await refreshCycleLockState();

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
            // Normalise to one decimal so scores saved under the old integer
            // scale (e.g. 3) still match a dropdown option ("3.0").
            setOverall(existingReview.score.toFixed(1));
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

    // Refetch cycle every 30 seconds to detect admin stage changes while page is open
    const cycleRefreshInterval = setInterval(() => {
      refreshCycleLockState();
    }, 30000);

    return () => {
      isActive = false;
      clearInterval(cycleRefreshInterval);
    };
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
      return;
    }

    try {
      setSaveStatus('saving');

      await submitReview(applicationId, currentReview.id, Number(overall), feedback);

      setSaveStatus('saved');

      // Navigate back to dashboard after submission
      navigate("/reviewer/dashboard");

    } catch (err) {
      console.error("Error submitting review:", err);
      setSaveStatus('error');
    }
  };

  const closeModal = () => {
    setModalOpen(false)
  }

  if (loading) {
    return (
      <RoleDashboardShell sidebarItems={sidebarItems} title="Application Review" stackClassName="arr-review-page">
        <div className="dashboard-sections-content">
          <div className="arr-review-card">
            <p>Loading application data...</p>
          </div>
        </div>
      </RoleDashboardShell>
    );
  }

  if (error) {
    return (
      <RoleDashboardShell sidebarItems={sidebarItems} title="Application Review" stackClassName="arr-review-page">
        <div className="dashboard-sections-content">
          <div className="arr-review-card">
            <p className="error-message">{error}</p>
            <button
              className="save-button"
              onClick={() => navigate("/reviewer/dashboard")}
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      </RoleDashboardShell>
    );
  }

  return (
    <RoleDashboardShell sidebarItems={sidebarItems} title="Application Review" stackClassName="arr-review-page">
      <div className="dashboard-sections-content">
          <div className="arr-review-card">
            {application && (
              <div className="arr-app-meta">
                <h2>{application.title}</h2>
                <p>Applicant: {application.grantType === "nonresearch" ? (application as NonResearchApplication).requestor : (application as ResearchApplication).principalInvestigator}</p>
                <p>Type: {application.grantType}</p>
              </div>
            )}

            <button className="arr-view-btn" onClick={() => setModalOpen(true)}>View Application</button>
            <div className="score-section">
              <p className="score-label">
                Overall score: Please use the <strong>legacy NIH scoring scale</strong>,
                where 1.0 indicates the highest merit and 5.0 the lowest. Scores may be
                assigned in 0.1 increments — for example, 1.1 denotes an outstanding
                application and 4.9 a very weak one.
              </p>
              <select
                className="score-dropdown"
                value={overall}
                onChange={handleOverallScoreChange}
                aria-label="Overall score selection"
                disabled={isReviewLocked}
              >
                <option value="">Enter score.</option>
                {SCORE_OPTIONS.map((score) => (
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
                  disabled={isReviewLocked}
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
                disabled={isReviewLocked}
              />
            </div>
          </div>

          <div className="review-actions">
            {isReviewLocked && (
              <div className="review-locked-note">
                Review submissions are now locked, please contact CCF if you need to submit a review
              </div>
            )}
            <div className="review-actions-buttons">
              <Button
                className={`review-save${saveStatus === 'saved' ? ' is-saved' : saveStatus === 'error' ? ' is-error' : ''}`}
                onClick={saveProgress}
                disabled={saveStatus === 'saving' || isReviewLocked}
                borderRadius="8px"
                fontWeight={600}
              >
                {saveStatus === 'saving' ? 'Saving…' :
                  saveStatus === 'saved' ? 'Saved!' :
                    saveStatus === 'error' ? 'Error Saving' : 'Save Progress'}
              </Button>
              <Button
                className="review-submit"
                onClick={submitReviewHandler}
                disabled={
                  saveStatus === 'saving' ||
                  isReviewLocked ||
                  !overall ||
                  !feedback.significance.trim() ||
                  !feedback.approach.trim() ||
                  !feedback.feasibility.trim() ||
                  !feedback.investigator.trim() ||
                  !feedback.summary.trim()
                }
                borderRadius="8px"
                fontWeight={600}
              >
                Submit
              </Button>
            </div>
            {application ? <CoverPageModal onClose={closeModal} isOpen={modalOpen} application={application}></CoverPageModal> : ""}
          </div>
      </div>
    </RoleDashboardShell>
  );
}

export default ApplicationReview;
