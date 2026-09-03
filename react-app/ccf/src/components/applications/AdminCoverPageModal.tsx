import { Application } from "../../types/application-types";
import { Modal } from "../modal/modal";
import "./CoverPageModal.css";
import "../../pages/application-form/subquestions/SubForm.css";
import DynamicReview from "../dynamic-forms/DynamicReview";
import { useApplicationForm } from "../dynamic-forms/useApplicationForm";
import { useEffect, useState } from "react";
import { downloadPDFsByName } from "../../storage/storage";
import { getReportByApplicationID } from "../../backend/post-grant-reports";
import { Decision } from "../../types/decision-types";
import { getDecisionData } from "../../services/decision-data-service";
import { DecisionBox } from "../decisions/decisionBox";
import blueDocument from "../../assets/blueDocumentIcon.png";

interface CoverPageModalProps {
  application: Application;
  isOpen: boolean;
  onClose: () => void;
}

const AdminCoverPageModal = ({
  application,
  isOpen,
  onClose,
}: CoverPageModalProps) => {
  const [reportLink, setReportLink] = useState<any>();
  const [reportMsg, setReportMsg] = useState<string>("");
  const [decision, setDecision] = useState<Decision>();
  const form = useApplicationForm(application);

  useEffect(() => {
    if (isOpen && application.applicationId) {
      // Fetch decision independently so DecisionBox always renders when a decision exists
      getDecisionData(application.applicationId)
        .then((decision) => {
          if (decision) setDecision(decision);
        })
        .catch((e) => {
          console.error(e);
        });

      // Fetch report separately — missing report should not block decision display
      getReportByApplicationID(application.applicationId)
        .then((report) => {
          const fileId = report.pdf || report.file;
          if (fileId) {
            downloadPDFsByName([fileId])
              .then((links) => {
                if (links && links[0]) setReportLink(links[0]);
              })
              .catch((e) => {
                console.error(e);
              });
          }
        })
        .catch((err) => {
          if (err.message === "Not Found") {
            setReportMsg("Post-Grant Report Not Submitted");
          } else {
            console.error(err);
          }
        });
    }
  }, [isOpen, application.applicationId]);

  const researchCoverPage = (
    <div className="cover-page-modal-child">
      <div className="header-row">
        <img src={blueDocument} alt="Document Icon" className="section-icon" />
        <div>
          <h2 className="title">{application.title}</h2>
          <p className="subtitle">{application.grantType}</p>
        </div>
      </div>
      {decision ? <DecisionBox decision={decision} inAdminView={true}></DecisionBox> : ""}
      <div className="post-grant-report-pdf-link">
        {reportLink ? (
          <a target="_blank" rel="noopener noreferrer" href={reportLink.url}>
            Post Grant Report
          </a>
        ) : (
          reportMsg
        )}
      </div>
      {form && <DynamicReview form={form} answers={application as any} hideFile={true} />}
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      children={researchCoverPage}
      fullscreen={true}
    ></Modal>
  );
};

export default AdminCoverPageModal;
