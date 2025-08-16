import { Decision } from "../../types/decision-types";
import { firstLetterCap } from "../../utils/stringfuncs";
import { useEffect, useState } from "react";
import Confetti from "react-confetti";
import "./decisionBox.css"
import { useNavigate } from "react-router-dom";

export const DecisionBox = ({ decision }: { decision: Decision }) => {
    console.log(decision);
    const [showConfetti, setShowConfetti] = useState(false);
    const [windowDimensions, setWindowDimensions] = useState({
        width: window.innerWidth,
        height: window.innerHeight
    });

    useEffect(() => {
        const handleResize = () => {
            setWindowDimensions({
                width: window.innerWidth,
                height: window.innerHeight
            });
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        if (decision.isAccepted === true) {
            setShowConfetti(true);
            const timer = setTimeout(() => {
                setShowConfetti(false);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [decision.isAccepted]);

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
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const status = getDecisionStatus();

    const navigate = useNavigate();

    const goToResults = () => {
        navigate("/applicant/results", { state: { decision } });
    };

    return (
        <>
            {showConfetti && (
                <Confetti
                    width={windowDimensions.width}
                    height={windowDimensions.height}
                    recycle={false}
                    numberOfPieces={200}
                />
            )}
            <div className="decision-box">
                <div className="decision-status-section">
                    <div className="status-header">
                        <h3 className="status-title">Decision Status</h3>
                    </div>
                    <div
                        className="status-badge"
                        style={{
                            backgroundColor: getStatusColor(),
                            color: 'white'
                        }}
                    >
                        {/* <span className="status-icon">{getStatusIcon()}</span> */}
                        <span className="status-text">{firstLetterCap(status)}</span>
                    </div>
                </div>

                <div className="decision-details">
                    {/* Only show funding section for accepted decisions */}
                    {(decision.isAccepted === true) && (
                        <div className="funding-section">
                            <div className="section-label">Funding Decision</div>
                            <div className="funding-amount">
                                {formatCurrency(decision.fundingAmount || 0)}
                            </div>
                            {status === "accepted" && decision.fundingAmount && decision.fundingAmount > 0 && (
                                <div className="funding-note">Congratulations! Your funding has been approved.</div>
                            )}
                        </div>
                    )}

                    {decision.comments && (
                        <div className="comments-section">
                            <div className="section-label">Additional Comments</div>
                            <div className="comments-content">
                                {decision.comments}
                            </div>
                        </div>
                    )}

                    <div className="button-to-results">
                        <button onClick={goToResults} className="results-button">Go to Results</button>
                        
                    </div>

                </div>
            </div>
        </>
    );
};