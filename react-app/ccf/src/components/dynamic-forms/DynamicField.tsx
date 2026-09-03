import { ChangeEvent } from "react";
import "./DynamicField.css";
import { FormField } from "../../types/form-template-types";

type DynamicFieldProps = {
  field: FormField;
  value: any;
  onChange: (fieldId: string, value: any) => void;
  error?: string;
  disabled?: boolean;
};

/**
 * Renders any field a template can describe. One component so that adding a
 * question in the builder needs no code, and so the builder's preview shows
 * exactly what an applicant will see.
 *
 * Bespoke pieces — the signature blocks and the PDF upload — are referenced by
 * the template rather than described by it, and stay their own components; the
 * caller renders those and does not pass them here.
 */
function DynamicField({ field, value, onChange, error, disabled }: DynamicFieldProps): JSX.Element {
  const label = field.shortLabel || field.label;
  const inputId = `field-${field.id}`;

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const target = e.target as HTMLInputElement;
    onChange(field.id, target.type === "checkbox" ? target.checked : target.value);
  };

  const describedBy = [field.helpText ? `${inputId}-help` : null, error ? `${inputId}-error` : null]
    .filter(Boolean)
    .join(" ");

  const shared = {
    id: inputId,
    name: field.id,
    disabled,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": describedBy || undefined,
    className: `text-input${error ? " dynamic-field-invalid" : ""}`,
  };

  const control = () => {
    switch (field.type) {
      case "textarea":
        return (
          <textarea
            {...shared}
            className={`text-input2${error ? " dynamic-field-invalid" : ""}`}
            value={value ?? ""}
            placeholder={field.placeholder}
            onChange={handleChange}
          />
        );

      case "checkbox":
        return (
          <div className="dynamic-field-checkbox">
            <input
              {...shared}
              className={error ? "dynamic-field-invalid" : undefined}
              type="checkbox"
              checked={Boolean(value)}
              onChange={handleChange}
            />
            <label htmlFor={inputId}>{label}</label>
          </div>
        );

      case "radio":
        return (
          <div className="radio-opts" role="radiogroup" aria-labelledby={`${inputId}-label`}>
            {(field.options || []).map((option) => (
              <div className="radio-opt" key={option}>
                <input
                  type="radio"
                  id={`${inputId}-${option}`}
                  name={field.id}
                  value={option}
                  checked={value === option}
                  disabled={disabled}
                  onChange={handleChange}
                />
                <label className="radio-label" htmlFor={`${inputId}-${option}`}>{option}</label>
              </div>
            ))}
          </div>
        );

      case "select":
        return (
          <select {...shared} value={value ?? ""} onChange={handleChange}>
            <option value="">Select…</option>
            {(field.options || []).map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        );

      case "date":
        return <input {...shared} type="date" value={value ?? ""} onChange={handleChange} />;

      case "number":
      case "currency":
        // Kept as text: currency answers have always been stored with their
        // formatting ("75,000"), and the engine reads through it.
        return (
          <input {...shared} type="text" inputMode="decimal" value={value ?? ""}
            placeholder={field.placeholder} onChange={handleChange} />
        );

      default:
        return (
          <input {...shared} type="text" value={value ?? ""}
            placeholder={field.placeholder} onChange={handleChange} />
        );
    }
  };

  return (
    <div className={`dynamic-field dynamic-field-${field.width || "full"}`}>
      {field.type !== "checkbox" && (
        <label className="text-label" id={`${inputId}-label`} htmlFor={inputId}>
          {label}
          {field.required && <span aria-hidden="true"> *</span>}
        </label>
      )}
      {field.helpText && (
        <p className="dynamic-field-help" id={`${inputId}-help`}>{field.helpText}</p>
      )}
      {control()}
      {error && (
        <p className="dynamic-field-error" id={`${inputId}-error`} role="alert">{error}</p>
      )}
    </div>
  );
}

export default DynamicField;
