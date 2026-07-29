import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../..";
import RoleDashboardShell from "../../components/dashboard-layout/RoleDashboardShell";
import {
  getSidebarbyRole,
  getApplicantSidebarItems,
  SideBarTypes,
} from "../../types/sidebar-types";
import { getReviewsForApplication } from "../../services/review-service";
import { getDecisionData } from "../../services/decision-data-service";
import { getCurrentCycle } from "../../backend/application-cycle";
import { ReviewSummary } from "../../types/review-types";
import { Decision } from "../../types/decision-types";
import { Application } from "../../types/application-types";
import { getDecisionStatus, DecisionStatus } from "../../utils/decision-status";
import { firstLetterCap } from "../../utils/stringfuncs";
import "./ResultsPage.css";

// Criteria shown to the applicant, in the same order as the reviewer form.
// Internal reviewer notes are deliberately absent — getApplicationReviews
// strips them server-side, so they can never reach this page.
const FEEDBACK_CRITERIA = [
  { key: "significance", label: "Significance" },
  { key: "approach", label: "Approach" },
  { key: "feasibility", label: "Feasibility" },
  { key: "investigator", label: "Investigator(s)" },
  { key: "summary", label: "Summary" },
] as const;

const LETTERS: Record<DecisionStatus, { heading: string; body: string[] }> = {
  accepted: {
    heading: "Congratulations!",
    body: [
      "We are delighted to inform you that your application has been selected for funding. Your proposal stood out for its innovation, potential impact, and the clarity of your research goals. We are honored to support your work and look forward to the advancements your project promises to bring.",
      "You and your grant administrator will receive further communication regarding the agreement and disbursement of funds via email from our office.",
      "This grant represents our confidence in your vision and dedication. Please be in touch with any questions as you move forward with your project.",
    ],
  },
  rejected: {
    heading: "Thank you for your application",
    body: [
      "Thank you for submitting an application for CCF funding. After careful review by an independent committee, we regret to inform you that your proposal was not selected for funding this cycle. We received an extraordinary number of applications, making the selection process highly competitive, and while we were impressed by the vision and potential impact of your project, we were unable to fund all deserving proposals.",
      "Please know that this decision is not wholly a reflection on the quality of your work. We encourage you to apply again in the future, as each cycle brings new opportunities and priorities.",
      "We wish you all the best.",
    ],
  },
  pending: {
    heading: "Under review",
    body: [
      "Your application is still under review and a decision has not been finalized yet. Please check back later.",
    ],
  },
};

const formatCurrency = (amount: number): string =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);

function ResultsPage(): JSX.Element {
  const [sidebarItems, setSidebarItems] = useState<SideBarTypes[]>(
    getSidebarbyRole("applicant"),
  );
  const location = useLocation();
  const navigate = useNavigate();

  // Prefer the id in the URL so the page survives a refresh or a shared link;
  // fall back to the decision handed over in router state by the decision box.
  const searchParams = new URLSearchParams(location.search);
  const applicationId =
    searchParams.get("id") ?? location.state?.decision?.applicationId ?? null;

  const [application, setApplication] = useState<Application | null>(null);
  const [decision, setDecision] = useState<Decision | null>(null);
  const [reviews, setReviews] = useState<ReviewSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getApplicantSidebarItems()
      .then(setSidebarItems)
      .catch((e) => console.error("Error loading sidebar items:", e));
  }, []);

  useEffect(() => {
    if (!applicationId) {
      setError("No application selected. Please open your results from the dashboard.");
      setLoading(false);
      return;
    }

    let isActive = true;

    const fetchResults = async () => {
      try {
        setLoading(true);

        // Results follow the same gate as the decisions list — nothing is shown
        // before an admin moves the cycle into Release Decisions.
        const cycle = await getCurrentCycle();
        if (!isActive) return;

        if (cycle.stage !== "Release Decisions") {
          setError("Results are not yet available. Please check back once decisions have been released.");
          setLoading(false);
          return;
        }

        const applicationDoc = await getDoc(doc(db, "applications", applicationId));
        if (!isActive) return;

        if (!applicationDoc.exists()) {
          setError("Application not found.");
          setLoading(false);
          return;
        }
        setApplication(applicationDoc.data() as Application);

        // Reviews come from a callable that verifies ownership; a failure there
        // should not hide the decision letter, so it is handled separately.
        const decisionData = await getDecisionData(applicationId);
        if (!isActive) return;
        setDecision(decisionData);

        try {
          const summary = await getReviewsForApplication(applicationId);
          if (isActive) setReviews(summary);
        } catch (reviewError) {
          console.error("Error fetching reviews:", reviewError);
        }

        if (isActive) setLoading(false);
      } catch (err) {
        console.error("Error loading results:", err);
        if (isActive) {
          setError("Failed to load your results. Please try again.");
          setLoading(false);
        }
      }
    };

    fetchResults();

    return () => {
      isActive = false;
    };
  }, [applicationId]);

  const renderCard = (children: JSX.Element) => (
    <RoleDashboardShell
      sidebarItems={sidebarItems}
      title="Grant Results"
      stackClassName="res-results-page"
    >
      <div className="dashboard-sections-content">
        <div className="res-card">{children}</div>
      </div>
    </RoleDashboardShell>
  );

  if (loading) {
    return renderCard(<p className="res-muted">Loading your results…</p>);
  }

  if (error) {
    return renderCard(
      <>
        <p className="res-error">{error}</p>
        <button
          className="res-btn res-btn-primary"
          onClick={() => navigate("/applicant/dashboard")}
        >
          Return to Dashboard
        </button>
      </>,
    );
  }

  const status: DecisionStatus = decision ? getDecisionStatus(decision) : "pending";
  const letter = LETTERS[status];
  const showFunding =
    status === "accepted" && !!decision?.fundingAmount && decision.fundingAmount > 0;
  const hasAnyReview = !!(reviews?.primaryReview || reviews?.secondaryReview);

  return (
    <RoleDashboardShell
      sidebarItems={sidebarItems}
      title="Grant Results"
      stackClassName="res-results-page"
    >
      <div className="dashboard-sections-content">
        <button className="res-back-btn" onClick={() => navigate("/applicant/dashboard")}>
          ← Back to Dashboard
        </button>

        {/* Decision */}
        <div className="res-card">
          <div className="res-card-head">
            <div className="res-app-meta">
              <h2>{application?.title || "Your application"}</h2>
              {application?.grantType && (
                <p>{firstLetterCap(application.grantType)} grant</p>
              )}
            </div>
            <span className={`res-pill res-pill--${status}`}>
              {firstLetterCap(status)}
            </span>
          </div>

          <h3 className="res-letter-heading">{letter.heading}</h3>
          <div className="res-letter">
            {letter.body.map((paragraph, i) => (
              <p key={i}>{paragraph}</p>
            ))}
            <p className="res-signoff">
              Warm regards,
              <br />
              The Children's Cancer Foundation, Inc.
            </p>
          </div>

          {showFunding && (
            <div className="res-funding">
              <span className="res-label">Funding awarded</span>
              <span className="res-amount">
                {formatCurrency(decision?.fundingAmount || 0)}
              </span>
            </div>
          )}

          {/* decision.comments is deliberately not rendered — admin award
              comments are internal. Reviewer feedback below is the only
              written commentary applicants see. */}
        </div>

        {/* Reviewer feedback */}
        <div className="res-card">
          <h3 className="res-section-title">Reviewer Feedback</h3>

          {hasAnyReview ? (
            FEEDBACK_CRITERIA.map(({ key, label }) => (
              <div key={key} className="res-criterion">
                <h4 className="res-criterion-label">{label}</h4>
                <div className="res-reviewer-grid">
                  <div className="res-reviewer">
                    <span className="res-label">Reviewer 1</span>
                    <p className="res-feedback">
                      {reviews?.primaryReview?.feedback?.[key] || "No feedback provided."}
                    </p>
                  </div>
                  <div className="res-reviewer">
                    <span className="res-label">Reviewer 2</span>
                    <p className="res-feedback">
                      {reviews?.secondaryReview?.feedback?.[key] || "No feedback provided."}
                    </p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="res-empty">
              Reviewer feedback for this application is not available.
            </p>
          )}
        </div>
      </div>
    </RoleDashboardShell>
  );
}

export default ResultsPage;
