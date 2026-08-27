import "../subquestions/SubForm.css";

// Field names the block writes into formData. Each signer owns a name/title/
// institution/date trio plus the "I Agree" attestation flag.
export type SignatureFields = {
  name: string;
  title: string;
  institution: string;
  date: string;
  agreed: string;
};

type SignatureBlockProps = {
  heading: string;
  namePlaceholder: string;
  fields: SignatureFields;
  formData: any;
  setFormData: (data: any) => void;
};

/**
 * Electronic signature block: identifying details plus the "I Agree"
 * certification checkbox that makes the typed signature an attestation.
 */
function SignatureBlock({
  heading,
  namePlaceholder,
  fields,
  formData,
  setFormData,
}: SignatureBlockProps): JSX.Element {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prevData: any) => ({
      ...prevData,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  return (
    <div className="signature-block">
      <h3 className="signature-block-heading">{heading}*</h3>
      <p className="signature-block-help">
        Enter the full name, business title, institution, and the date of submission.
      </p>

      <div className="signature-row">
        <div className="signature-field">
          <p className="text-label">Full Name*</p>
          <input
            type="text"
            name={fields.name}
            value={formData[fields.name] || ""}
            onChange={handleChange}
            placeholder={namePlaceholder}
            required
            className="text-input"
          />
        </div>
        <div className="signature-field">
          <p className="text-label">Title*</p>
          <input
            type="text"
            name={fields.title}
            value={formData[fields.title] || ""}
            onChange={handleChange}
            placeholder="Enter business title"
            required
            className="text-input"
          />
        </div>
      </div>

      <div className="signature-row">
        <div className="signature-field">
          <p className="text-label">Institution*</p>
          <input
            type="text"
            name={fields.institution}
            value={formData[fields.institution] || ""}
            onChange={handleChange}
            placeholder="Enter institution"
            required
            className="text-input"
          />
        </div>
        <div className="signature-field">
          <p className="text-label">Date*</p>
          <input
            type="date"
            name={fields.date}
            value={formData[fields.date] || ""}
            onChange={handleChange}
            required
            className="text-input"
          />
        </div>
      </div>

      <p className="text-label">Signature*</p>
      <p className="signature-block-certification">
        By entering the signature information above and checking "I Agree" below, you
        certify that the statements contained in this application are true and correct
        to the best of your knowledge and belief.
      </p>
      <div className="checkbox-row">
        <input
          type="checkbox"
          id={fields.agreed}
          name={fields.agreed}
          checked={Boolean(formData[fields.agreed])}
          onChange={handleChange}
          className="checkbox-input"
        />
        <label className="text-label" htmlFor={fields.agreed}>I Agree*</label>
      </div>
    </div>
  );
}

export default SignatureBlock;
