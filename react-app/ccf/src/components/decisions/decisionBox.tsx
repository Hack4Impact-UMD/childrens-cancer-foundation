import { Decision } from "../../types/decision-types";
import { firstLetterCap } from "../../utils/stringfuncs";
// import Confetti from "react-confetti";
import "./decisionBox.css";
import { useNavigate } from "react-router-dom";

export const DecisionBox = ({
  decision,
  inAdminView,
}: {
  decision: Decision;
  inAdminView?: boolean;
}) => {
  const getDecisionStatus = () => {
    // Use isAccepted boolean field to determine status
    if (decision.isAccepted === true) {
      return "accepted";
    } else {
      // If isAccepted is false or undefined, show as rejected
      return "rejected";
    }
  };

  const getStatusColor = () => {
    const status = getDecisionStatus();
    switch (status) {
      case "accepted":
        return "#22c55e"; // green
      case "rejected":
        return "#ef4444"; // red
      default:
        return "#6b7280"; // gray
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const status = getDecisionStatus();

  const navigate = useNavigate();

  const goToResults = () => {
    navigate("/applicant/results", { state: { decision } });
  };

  const showFunding =
    decision.isAccepted === true &&
    !!decision.fundingAmount &&
    decision.fundingAmount > 0;

  return (
    <div className="decision-box">
      <div className="decision-row">
        <span className="decision-label">Status</span>
        <span className={`decision-pill decision-pill--${status}`}>
          {firstLetterCap(status)}
        </span>
        {showFunding && (
          <>
            <span className="decision-divider" aria-hidden="true">·</span>
            <span className="decision-label">Funding</span>
            <span className="decision-amount">
              {formatCurrency(decision.fundingAmount || 0)}
            </span>
          </>
        )}
      </div>

      {status === "accepted" && decision.fundingAmount && decision.fundingAmount > 0 && (
        <p className="decision-note">
          {inAdminView
            ? "Approved for funding."
            : "Congratulations — your funding has been approved."}
        </p>
      )}

      {decision.comments && (
        <div className="decision-comments">
          <span className="decision-label">Comments</span>
          <p>{decision.comments}</p>
        </div>
      )}

      {!inAdminView && (
        <button
          type="button"
          onClick={goToResults}
          className="decision-results-button"
        >
          Go to Results
        </button>
      )}
    </div>
  );
};
