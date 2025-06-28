import { Decision } from "../../types/decision-types";
import { firstLetterCap } from "../../utils/stringfuncs";
import "./decisionBox.css"

export const DecisionBox = ({decision}: {decision: Decision}) => {
    return (
        <div className="decision-box-border">
            <div className="decision-title">Decision Information</div>
            <div className="decision-text">Decision: {firstLetterCap(decision.decision || "")}</div>
            <div className="funding-text">Funding Amount: ${decision.fundingAmount}</div>
            <div className="comments">Comments: {decision.comments}</div>
        </div>
    )
}