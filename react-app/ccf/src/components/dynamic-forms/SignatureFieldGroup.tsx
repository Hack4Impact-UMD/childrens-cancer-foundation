import "../../pages/application-form/subquestions/SubForm.css";
import "./DynamicField.css";
import DynamicField from "./DynamicField";
import { Answers, FieldErrors, FormField } from "../../types/form-template-types";

type SignatureFieldGroupProps = {
  fields: FormField[];
  answers: Answers;
  errors: FieldErrors;
  onChange: (fieldId: string, value: any) => void;
  disabled?: boolean;
};

/**
 * The electronic signature block: identifying details, then the certification
 * an applicant agrees to.
 *
 * The five fields are ordinary template fields — that is what keeps their
 * labels, order and required flags editable, and their answers keyed the way
 * they always have been. Only the surrounding wording is special, and it
 * travels on the field's own `componentProps` so this component stays generic.
 */
function SignatureFieldGroup({
  fields,
  answers,
  errors,
  onChange,
  disabled,
}: SignatureFieldGroupProps): JSX.Element {
  const props = fields[0]?.componentProps || {};
  const agreeField = fields.find((f) => f.componentProps?.role === "agree");
  const detailFields = fields.filter((f) => f.componentProps?.role !== "agree");

  return (
    <div className="signature-block">
      {props.heading && <h3 className="signature-block-heading">{props.heading}*</h3>}
      {props.help && <p className="signature-block-help">{props.help}</p>}

      <div className="signature-grid">
        {detailFields.map((field) => (
          <DynamicField
            key={field.id}
            field={field}
            value={answers[field.id]}
            onChange={onChange}
            error={errors[field.id]}
            disabled={disabled}
          />
        ))}
      </div>

      {agreeField && (
        <>
          <p className="text-label">Signature*</p>
          {props.certification && (
            <p className="signature-block-certification">{props.certification}</p>
          )}
          <div className="checkbox-row">
            <DynamicField
              field={agreeField}
              value={answers[agreeField.id]}
              onChange={onChange}
              error={errors[agreeField.id]}
              disabled={disabled}
            />
          </div>
        </>
      )}
    </div>
  );
}

export default SignatureFieldGroup;
