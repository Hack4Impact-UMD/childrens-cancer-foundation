import "../../pages/application-form/subquestions/SubForm.css";
import { toDisplaySections } from "../../form-templates/viewer";
import { FormLike } from "../../form-templates/engine";
import { Answers } from "../../types/form-template-types";

type DynamicReviewProps = {
  form: FormLike;
  answers: Answers;
  /** Drafts show the selected File; submitted applications show nothing. */
  hideFile?: boolean;
};

/**
 * A submitted or in-progress application, rendered against a form.
 *
 * Callers pass the published version the application was submitted under, so
 * an application keeps the wording it was filled in with however much the form
 * changes afterwards. Answers to questions that have since been removed are
 * shown under their own heading rather than dropped.
 */
function DynamicReview({ form, answers, hideFile }: DynamicReviewProps): JSX.Element {
  const sections = toDisplaySections(form, answers);

  return (
    <div className="review-form-container">
      <div className="proposal-text">
        {sections.map((section) => (
          <div className="detail-card" key={section.pageId}>
            <h3 className="card-title">{section.title}</h3>
            <div className="detail-grid">
              {section.rows
                .filter((row) => !(hideFile && row.fieldId === "file"))
                .map((row) => (
                  <div
                    className={`detail-item${row.width === "half" ? "" : " full-width"}`}
                    key={row.fieldId}
                  >
                    <span className="detail-label">{row.label}</span>
                    <span className="detail-value">{row.value}</span>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default DynamicReview;
