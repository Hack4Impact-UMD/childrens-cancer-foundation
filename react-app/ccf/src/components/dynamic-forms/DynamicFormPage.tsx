import "../../pages/application-form/subquestions/SubForm.css";
import "./DynamicField.css";
import DynamicField from "./DynamicField";
import SignatureFieldGroup from "./SignatureFieldGroup";
import FileUploadSection from "../../pages/application-form/Components/FileUploadSection";
import MarkdownPreviewer from "../markdown/Markdown";
import { getVisibleFields } from "../../form-templates/engine";
import { Answers, FieldErrors, FormField, FormPage } from "../../types/form-template-types";

type DynamicFormPageProps = {
  page: FormPage;
  answers: Answers;
  errors: FieldErrors;
  onChange: (fieldId: string, value: any) => void;
  disabled?: boolean;
};

/**
 * One page of a template-driven form.
 *
 * Visibility comes from the engine, so a question hidden here is the same
 * question the validator skips and the server does not require — there is no
 * second opinion about what the applicant was asked.
 *
 * Consecutive fields belonging to the same signature block are gathered into
 * one component; the PDF upload keeps its existing uploader. Everything else
 * is an ordinary field.
 */
function DynamicFormPage({
  page,
  answers,
  errors,
  onChange,
  disabled,
}: DynamicFormPageProps): JSX.Element {
  const visible = getVisibleFields(page, answers);

  // Group runs of signature fields so each signer renders as one block.
  const groups: { key: string; block?: string; fields: FormField[] }[] = [];
  visible.forEach((field) => {
    const block = field.component === "signatureBlock" ? field.componentProps?.block : undefined;
    const last = groups[groups.length - 1];
    if (block && last && last.block === block) {
      last.fields.push(field);
    } else {
      groups.push({ key: field.id, block, fields: [field] });
    }
  });

  return (
    <div className="form-container dynamic-form-page">
      <div className="proposal-text">
        {page.description && (
          <MarkdownPreviewer _previewOnly={true} _text={page.description} _minRows={4} />
        )}

        <div className="dynamic-form-fields">
          {groups.map((group) => {
            if (group.block) {
              return (
                <SignatureFieldGroup
                  key={group.key}
                  fields={group.fields}
                  answers={answers}
                  errors={errors}
                  onChange={onChange}
                  disabled={disabled}
                />
              );
            }

            const [field] = group.fields;

            if (field.component === "fileUpload") {
              return (
                <div className="dynamic-field dynamic-field-full" key={field.id}>
                  <FileUploadSection
                    formData={answers}
                    setFormData={(next: any) => onChange(field.id, next.file)}
                  />
                  {errors[field.id] && (
                    <p className="dynamic-field-error" role="alert">{errors[field.id]}</p>
                  )}
                </div>
              );
            }

            return (
              <DynamicField
                key={field.id}
                field={field}
                value={answers[field.id]}
                onChange={onChange}
                error={errors[field.id]}
                disabled={disabled}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default DynamicFormPage;
