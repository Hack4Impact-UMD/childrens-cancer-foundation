import { useState, useEffect } from "react";
import "./ApplicationReview.css";
import Sidebar from "../../components/sidebar/Sidebar";
import logo from "../../assets/ccf-logo.png";
import { getSidebarbyRole } from "../../types/sidebar-types";

function ApplicationReview(): JSX.Element {
  const sidebarItems = getSidebarbyRole("reviewer")

  const [feedback, setFeedback] = useState({
    significance: "",
    approach: "",
    feasibility: "",
    investigator: "",
    summary: "",
    internal: "",
  });

  const handleChange = (field: string, value: string) => {
    setFeedback({ ...feedback, [field]: value });
  };

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
              <select className="score-dropdown">
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
                  value={feedback[key as keyof typeof feedback]}
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
                value={feedback.internal}
                onChange={(e) => handleChange("internal", e.target.value)}
                placeholder="Enter Internal Comments."
              />
            </div>
          </div>

          <div className="button-group">
            <button className="save-button">Save Progress</button>
            <button className="submit-button">Submit</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ApplicationReview;