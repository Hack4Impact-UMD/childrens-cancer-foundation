import { useState } from "react";
import { Button } from "@mui/material";
import "./FormBuilder.css";
import {
    VALIDATION_PRESETS,
    availableConditionSources,
    buildCondition,
    describeCondition,
    describeRule,
    findPreset,
    isEditableRule,
    operatorOf,
    operatorsFor,
    testPattern,
    validationKindFor,
    valueOf,
} from "../../form-templates/builder-operations";
import {
    FieldType,
    FormField,
    FormTemplate,
} from "../../types/form-template-types";

type FieldPropertiesProps = {
    template: FormTemplate;
    field: FormField;
    /** True when a published version is on screen: a record, not a draft. */
    readOnly?: boolean;
    onChange: (patch: Partial<FormField>) => void;
    onSetCondition: (rule: FormField["showWhen"]) => void;
    onDelete: () => void;
    deleteBlockedReason: string | null;
};

const FIELD_TYPES: { value: FieldType; label: string }[] = [
    { value: "text", label: "Short text" },
    { value: "textarea", label: "Long text" },
    { value: "radio", label: "Choice (one of)" },
    { value: "select", label: "Dropdown" },
    { value: "checkbox", label: "Checkbox" },
    { value: "number", label: "Number" },
    { value: "currency", label: "Dollar amount" },
    { value: "date", label: "Date" },
    { value: "email", label: "Email" },
    { value: "phone", label: "Phone" },
];

/**
 * The properties panel: everything about one question. Locked questions keep
 * their label control and lose the rest, with the reason shown rather than a
 * silently dead button.
 */
function FieldProperties({
    template,
    field,
    readOnly = false,
    onChange,
    onSetCondition,
    onDelete,
    deleteBlockedReason,
}: FieldPropertiesProps): JSX.Element {
    const [sample, setSample] = useState("");
    const sources = availableConditionSources(template, field.id);
    const condition = field.showWhen?.all?.[0];
    const sourceType = sources.find((s) => s.id === condition?.field)?.type;
    const preset = findPreset(field.validation);
    const isCustomPattern = Boolean(field.validation?.pattern) && !preset;
    // Only the rules this answer type can actually satisfy are offered; the
    // rest would be applied by the engine and reject every answer.
    const validationKind = validationKindFor(field.type);
    // A locked question keeps only its wording; a published version keeps
    // nothing at all.
    const frozen = readOnly || field.locked;
    // A rule the three controls cannot represent must not be edited through
    // them: rebuilding it would drop every condition but the first.
    const ruleIsEditable = isEditableRule(field.showWhen);
    const labelForSource = (fieldId: string) => {
        const source = sources.find((s) => s.id === fieldId);
        return source?.shortLabel || source?.label || fieldId;
    };
    const patternCheck = field.validation?.pattern && sample
        ? testPattern(field.validation.pattern, sample)
        : null;

    const setValidation = (patch: Partial<NonNullable<FormField["validation"]>>) =>
        onChange({ validation: { ...(field.validation || {}), ...patch } });

    return (
        <div className="fb-props">
            <div className="fb-panel-header"><h3>Question</h3></div>

            {field.locked && (
                <p className="fb-locked-note">
                    Used elsewhere in the app — Grant Awards, the reviewer screens or the export.
                    You can reword and move it, but not remove it or make it optional.
                </p>
            )}

            <label className="fb-label" htmlFor="fb-label-input">Question text</label>
            <textarea
                id="fb-label-input"
                className="fb-input fb-textarea"
                disabled={readOnly}
                value={field.label}
                onChange={(e) => onChange({ label: e.target.value })}
            />

            <label className="fb-label" htmlFor="fb-help-input">Help text (optional)</label>
            <input
                id="fb-help-input"
                className="fb-input"
                disabled={readOnly}
                value={field.helpText || ""}
                placeholder="Shown under the question"
                onChange={(e) => onChange({ helpText: e.target.value })}
            />

            <label className="fb-label" htmlFor="fb-placeholder-input">Placeholder (optional)</label>
            <input
                id="fb-placeholder-input"
                className="fb-input"
                disabled={readOnly}
                value={field.placeholder || ""}
                onChange={(e) => onChange({ placeholder: e.target.value })}
            />

            <label className="fb-label" htmlFor="fb-type-input">Answer type</label>
            <select
                id="fb-type-input"
                className="fb-input"
                value={field.type}
                disabled={frozen || Boolean(field.component)}
                onChange={(e) => onChange({ type: e.target.value as FieldType })}
            >
                {FIELD_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                ))}
            </select>

            {(field.type === "radio" || field.type === "select") && (
                <>
                    <label className="fb-label" htmlFor="fb-options-input">Choices (one per line)</label>
                    <textarea
                        id="fb-options-input"
                        className="fb-input fb-textarea"
                        disabled={readOnly}
                        value={(field.options || []).join("\n")}
                        onChange={(e) =>
                            onChange({ options: e.target.value.split("\n").map((o) => o.trim()).filter(Boolean) })
                        }
                    />
                </>
            )}

            <div className="fb-check-row">
                <input
                    id="fb-required-input"
                    type="checkbox"
                    checked={field.required}
                    disabled={frozen}
                    onChange={(e) => onChange({ required: e.target.checked })}
                />
                <label htmlFor="fb-required-input">Applicants must answer this</label>
            </div>

            {/* ---- conditional logic ---- */}
            <h4 className="fb-props-subtitle">Only show this question when…</h4>
            {sources.length === 0 ? (
                <p className="fb-hint">
                    This is the first question in the form, so there is nothing earlier to base it on.
                </p>
            ) : field.locked ? (
                <p className="fb-hint">This question is always asked, because other screens rely on its answer.</p>
            ) : !ruleIsEditable ? (
                <div className="fb-locked-note">
                    <p>
                        Shown when {describeRule(field.showWhen!, labelForSource)}.
                    </p>
                    <p>
                        This rule combines several conditions, which is more than this panel can edit without
                        losing part of it. It keeps working as written — change it in the form template itself.
                    </p>
                </div>
            ) : (
                <>
                    <div className="fb-condition-row">
                        <select
                            className="fb-input"
                            aria-label="Question this depends on"
                            disabled={readOnly}
                            value={condition?.field || ""}
                            onChange={(e) => {
                                if (!e.target.value) return onSetCondition(undefined);
                                const picked = sources.find((s) => s.id === e.target.value);
                                return onSetCondition({
                                    all: [buildCondition(
                                        e.target.value,
                                        operatorsFor(picked?.type).some((op) => op.value === operatorOf(condition))
                                            ? operatorOf(condition)
                                            : "equals",
                                        valueOf(condition),
                                        picked?.type
                                    )],
                                });
                            }}
                        >
                            <option value="">Always show it</option>
                            {sources.map((source) => (
                                <option key={source.id} value={source.id}>
                                    {source.shortLabel || source.label}
                                </option>
                            ))}
                        </select>

                        {condition && (
                            <>
                                <select
                                    className="fb-input"
                                    aria-label="Comparison"
                                    disabled={readOnly}
                                    value={operatorOf(condition)}
                                    onChange={(e) =>
                                        onSetCondition({
                                            all: [buildCondition(
                                                condition.field, e.target.value, valueOf(condition), sourceType
                                            )],
                                        })
                                    }
                                >
                                    {operatorsFor(sourceType).map((op) => (
                                        <option key={op.value} value={op.value}>{op.label}</option>
                                    ))}
                                </select>

                                {operatorOf(condition) !== "answered" && (
                                    sourceType === "checkbox" ? (
                                        <select
                                            className="fb-input"
                                            aria-label="Answer to match"
                                            disabled={readOnly}
                                            value={valueOf(condition) === "false" ? "false" : "true"}
                                            onChange={(e) =>
                                                onSetCondition({
                                                    all: [buildCondition(
                                                        condition.field, operatorOf(condition), e.target.value, sourceType
                                                    )],
                                                })
                                            }
                                        >
                                            <option value="true">checked</option>
                                            <option value="false">not checked</option>
                                        </select>
                                    ) : (
                                        <input
                                            className="fb-input"
                                            aria-label="Answer to match"
                                            disabled={readOnly}
                                            type={
                                                operatorOf(condition) === "greaterThan"
                                                    || operatorOf(condition) === "lessThan"
                                                    ? "number"
                                                    : "text"
                                            }
                                            value={valueOf(condition)}
                                            onChange={(e) =>
                                                onSetCondition({
                                                    all: [buildCondition(
                                                        condition.field, operatorOf(condition), e.target.value, sourceType
                                                    )],
                                                })
                                            }
                                        />
                                    )
                                )}
                            </>
                        )}
                    </div>
                    {condition && (
                        <p className="fb-hint">
                            Shown when {describeCondition(
                                condition,
                                sources.find((s) => s.id === condition.field)?.shortLabel
                                || sources.find((s) => s.id === condition.field)?.label
                                || condition.field
                            )}. Hidden questions are never required.
                        </p>
                    )}
                </>
            )}

            {/* ---- validation ---- */}
            {validationKind !== "none" && (
                <h4 className="fb-props-subtitle">Accepted answers</h4>
            )}

            {validationKind === "text" && (
                <>
                    <div className="fb-two-up">
                        <div>
                            <label className="fb-label" htmlFor="fb-minlen">Shortest</label>
                            <input
                                id="fb-minlen" className="fb-input" type="number" min={0} disabled={readOnly}
                                value={field.validation?.minLength ?? ""}
                                onChange={(e) => setValidation({ minLength: e.target.value ? Number(e.target.value) : undefined })}
                            />
                        </div>
                        <div>
                            <label className="fb-label" htmlFor="fb-maxlen">Longest</label>
                            <input
                                id="fb-maxlen" className="fb-input" type="number" min={0} disabled={readOnly}
                                value={field.validation?.maxLength ?? ""}
                                onChange={(e) => setValidation({ maxLength: e.target.value ? Number(e.target.value) : undefined })}
                            />
                        </div>
                    </div>
                    <p className="fb-hint">Number of characters. Leave blank for no limit.</p>

                    <label className="fb-label" htmlFor="fb-pattern-preset">Format</label>
                    <select
                        id="fb-pattern-preset"
                        className="fb-input"
                        disabled={readOnly}
                        value={isCustomPattern ? "custom" : preset?.id || "none"}
                        onChange={(e) => {
                            if (e.target.value === "custom") {
                                setValidation({ pattern: "^.*$", patternMessage: "" });
                                return;
                            }
                            const chosen = VALIDATION_PRESETS.find((p) => p.id === e.target.value);
                            onChange({
                                validation: {
                                    ...(field.validation || {}),
                                    pattern: chosen?.validation.pattern,
                                    patternMessage: chosen?.validation.patternMessage,
                                },
                            });
                        }}
                    >
                        {VALIDATION_PRESETS.map((p) => (
                            <option key={p.id} value={p.id}>{p.label}</option>
                        ))}
                        <option value="custom">Custom pattern…</option>
                    </select>

                    {isCustomPattern && (
                        <>
                            <label className="fb-label" htmlFor="fb-pattern">Pattern</label>
                            <input
                                id="fb-pattern"
                                className="fb-input fb-mono"
                                disabled={readOnly}
                                value={field.validation?.pattern || ""}
                                onChange={(e) => setValidation({ pattern: e.target.value })}
                            />
                            <label className="fb-label" htmlFor="fb-pattern-message">Message when it does not match</label>
                            <input
                                id="fb-pattern-message"
                                className="fb-input"
                                disabled={readOnly}
                                value={field.validation?.patternMessage || ""}
                                placeholder="Enter an EIN like 12-3456789"
                                onChange={(e) => setValidation({ patternMessage: e.target.value })}
                            />

                            <label className="fb-label" htmlFor="fb-pattern-test">Try an answer</label>
                            <input
                                id="fb-pattern-test"
                                className="fb-input"
                                disabled={readOnly}
                                value={sample}
                                placeholder="Type what an applicant might enter"
                                onChange={(e) => setSample(e.target.value)}
                            />
                            {patternCheck && (
                                <p className={patternCheck.ok ? "fb-test-ok" : "fb-test-bad"}>{patternCheck.message}</p>
                            )}
                            <p className="fb-hint">
                                Test before publishing — a pattern nobody can satisfy locks every applicant out of this
                                question.
                            </p>
                        </>
                    )}
                </>
            )}

            {validationKind === "number" && (
                <>
                    <div className="fb-two-up">
                        <div>
                            <label className="fb-label" htmlFor="fb-min">Smallest allowed</label>
                            <input
                                id="fb-min" className="fb-input" type="number" step="any" disabled={readOnly}
                                value={field.validation?.min ?? ""}
                                onChange={(e) => setValidation({ min: e.target.value ? Number(e.target.value) : undefined })}
                            />
                        </div>
                        <div>
                            <label className="fb-label" htmlFor="fb-max">Largest allowed</label>
                            <input
                                id="fb-max" className="fb-input" type="number" step="any" disabled={readOnly}
                                value={field.validation?.max ?? ""}
                                onChange={(e) => setValidation({ max: e.target.value ? Number(e.target.value) : undefined })}
                            />
                        </div>
                    </div>
                    <p className="fb-hint">
                        {field.type === "currency"
                            ? "In dollars. Leave blank for no limit."
                            : "Leave blank for no limit."}
                    </p>
                </>
            )}

            <div className="fb-props-footer">
                <Button
                    variant="outlined"
                    color="error"
                    onClick={onDelete}
                    disabled={readOnly || Boolean(deleteBlockedReason)}
                    title={deleteBlockedReason || undefined}
                >
                    Remove question
                </Button>
                {deleteBlockedReason && <p className="fb-hint">{deleteBlockedReason}</p>}
            </div>
        </div>
    );
}

export default FieldProperties;
