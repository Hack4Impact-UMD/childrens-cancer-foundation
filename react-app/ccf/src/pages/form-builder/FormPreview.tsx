import { useState } from "react";
import "./FormBuilder.css";
import DynamicField from "../../components/dynamic-forms/DynamicField";
import { getVisibleFields, getVisiblePages, validateAnswers } from "../../form-templates/engine";
import { Answers, FormTemplate } from "../../types/form-template-types";

type FormPreviewProps = {
  template: FormTemplate;
};

/**
 * The form as an applicant would meet it, driven by the same engine that
 * validates the real thing. Answers typed here are throwaway — the point is to
 * let an admin see a condition fire before publishing it, rather than
 * discovering it on a live application.
 */
function FormPreview({ template }: FormPreviewProps): JSX.Element {
  const [answers, setAnswers] = useState<Answers>({});
  const [showErrors, setShowErrors] = useState(false);

  const pages = getVisiblePages(template, answers).filter((p) => (p.kind ?? "fields") === "fields");
  const errors = validateAnswers(template, answers);
  const hiddenCount =
    template.pages.reduce((n, p) => n + (p.fields || []).length, 0) -
    pages.reduce((n, p) => n + getVisibleFields(p, answers).length, 0);

  const setAnswer = (fieldId: string, value: any) =>
    setAnswers((prev) => ({ ...prev, [fieldId]: value }));

  return (
    <div className="fb-preview">
      <div className="fb-preview-bar">
        <span>
          Preview — {pages.length} page{pages.length === 1 ? "" : "s"} shown
          {hiddenCount > 0 && `, ${hiddenCount} question${hiddenCount === 1 ? "" : "s"} hidden by conditions`}
        </span>
        <div className="fb-preview-actions">
          <button type="button" className="fb-btn fb-btn-quiet" onClick={() => setShowErrors((s) => !s)}>
            {showErrors ? "Hide validation" : "Check validation"}
          </button>
          <button type="button" className="fb-btn fb-btn-quiet" onClick={() => { setAnswers({}); setShowErrors(false); }}>
            Clear answers
          </button>
        </div>
      </div>

      {showErrors && (
        <p className="fb-preview-summary">
          {Object.keys(errors).length === 0
            ? "This form is complete as filled in."
            : `${Object.keys(errors).length} question(s) still needed.`}
        </p>
      )}

      {pages.map((page) => (
        <section className="fb-preview-page" key={page.id}>
          <h3>{page.title}</h3>
          {page.description && <p className="fb-preview-description">{page.description}</p>}
          <div className="fb-preview-fields">
            {getVisibleFields(page, answers).map((field) =>
              field.component ? (
                <div className="fb-preview-placeholder" key={field.id}>
                  {field.label}
                  <span>
                    {field.component === "fileUpload" ? "PDF upload" : "signature block"} — rendered by its own component
                  </span>
                </div>
              ) : (
                <DynamicField
                  key={field.id}
                  field={field}
                  value={answers[field.id]}
                  onChange={setAnswer}
                  error={showErrors ? errors[field.id] : undefined}
                />
              )
            )}
          </div>
        </section>
      ))}
    </div>
  );
}

export default FormPreview;
