import { useState } from "react";
import "./ApplicationReview.css";
import Sidebar from "../../components/sidebar/Sidebar";
import logo from "../../assets/ccf-logo.png";
import { getSidebarbyRole } from "../../types/sidebar-types";

const PencilIcon = () => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ marginRight: "4px" }}
  >
    <path
      d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM21.41 6.34l-3.75-3.75-2.53 2.54 3.75 3.75 2.53-2.54z"
      fill="currentColor"
    />
  </svg>
);

function ApplicationReviewReadOnly(): JSX.Element {
  const sidebarItems = getSidebarbyRole("reviewer");

  const [editingSections, setEditingSections] = useState<{
    [key: string]: boolean;
  }>({});

  const [feedback, setFeedback] = useState({
    significance: "Example feedback for significance...",
    approach: "Example feedback for approach...",
    feasibility: "Example feedback for feasibility...",
    investigator: "Example feedback for investigator...",
    summary: "Example feedback for summary...",
    internal: "Example internal comments...",
  });

  const handleEdit = (section: string) => {
    setEditingSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const renderEditButton = (section: string) => (
    <button
      onClick={() => handleEdit(section)}
      className="edit-button"
      style={{
        backgroundColor: editingSections[section] ? "#d72626" : "#666666",
        color: "white",
        border: "none",
        padding: "4px 8px",
        borderRadius: "4px",
        cursor: "pointer",
        marginLeft: "auto",
        fontSize: "12px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "24px",
        width: "70px",
        minWidth: "70px",
      }}
    >
      {editingSections[section] ? (
        "Editing"
      ) : (
        <>
          <PencilIcon />
          Edit
        </>
      )}
    </button>
  );

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
            <p className="view-app-link">VIEW APPLICATION</p>
            <div className="score-section">
              <p className="score-label">
                Overall score: (1 <em>exceptional</em> - 5{" "}
                <em>poor quality, unrepairable</em>)
              </p>
              <div className="score-display">Score</div>
            </div>

            <p className="feedback-heading">
              Feedback: <br />
              <span
                style={{
                  color: "#d72626",
                  fontWeight: 900,
                  display: "block",
                  marginTop: "5px",
                }}
              >
                ALL information inputted (unless otherwise noted) WILL be sent
                to applicant.
              </span>
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
                <div
                  style={{ display: "flex", alignItems: "center", gap: "10px" }}
                >
                  <label style={{ flex: 1 }}>
                    <strong>{label}:</strong> {question}
                  </label>
                  {renderEditButton(key)}
                </div>
                <div className="feedback-content">
                  {editingSections[key] ? (
                    <textarea
                      value={feedback[key as keyof typeof feedback]}
                      onChange={(e) =>
                        setFeedback((prev) => ({
                          ...prev,
                          [key]: e.target.value,
                        }))
                      }
                      placeholder="Enter feedback."
                    />
                  ) : (
                    <div className="feedback-text">
                      {feedback[key as keyof typeof feedback]}
                    </div>
                  )}
                </div>
              </div>
            ))}

            <div className="internal-section">
              <div style={{ display: "flex", alignItems: "center" }}>
                <p className="internal-label">Internal Comments/Notes:</p>
                {renderEditButton("internal")}
              </div>
              <p className="internal-warning">
                <strong>
                  Information entered in this textbox will NOT be shared with
                  the applicant.
                </strong>
                <br />
                It is reserved for reviewer to reference during review call.
              </p>
              {editingSections.internal ? (
                <textarea
                  value={feedback.internal}
                  onChange={(e) =>
                    setFeedback((prev) => ({
                      ...prev,
                      internal: e.target.value,
                    }))
                  }
                  placeholder="Enter Internal Comments."
                />
              ) : (
                <div className="feedback-text">{feedback.internal}</div>
              )}
            </div>
          </div>

          <div className="button-group">
            <button className="submit-button">Submit Changes</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ApplicationReviewReadOnly;