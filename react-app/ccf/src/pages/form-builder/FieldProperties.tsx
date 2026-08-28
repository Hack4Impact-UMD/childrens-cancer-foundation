import { useState } from "react";
import { Button } from "@mui/material";
import "./FormBuilder.css";
import {
    VALIDATION_PRESETS,
    availableConditionSources,
    describeCondition,
    findPreset,
    testPattern,
} from "../../form-templates/builder-operations";
import {
    Condition,
    FieldType,
    FormField,
    FormTemplate,
} from "../../types/form-template-types";

type FieldPropertiesProps = {
    template: FormTemplate;
    field: FormField;
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

const OPERATORS = [
    { value: "equals", label: "is" },
    { value: "notEquals", label: "is not" },
    { value: "answered", label: "is answered" },
    { value: "greaterThan", label: "is more than" },
    { value: "lessThan", label: "is less than" },
] as const;

const operatorOf = (condition?: Condition): typeof OPERATORS[number]["value"] => {
    if (!condition) return "equals";
    if (condition.answered !== undefined) return "answered";
    if (condition.notEquals !== undefined) return "notEquals";
    if (condition.greaterThan !== undefined) return "greaterThan";
    if (condition.lessThan !== undefined) return "lessThan";
    return "equals";
};

const valueOf = (condition?: Condition): string => {
    if (!condition) return "";
    const raw = condition.equals ?? condition.notEquals ?? condition.greaterThan ?? condition.lessThan;
    return raw === undefined ? "" : String(raw);
};

const buildCondition = (field: string, operator: string, value: string): Condition => {
    switch (operator) {
        case "answered": return { field, answered: true };
        case "notEquals": return { field, notEquals: value };
        case "greaterThan": return { field, greaterThan: Number(value) };
        case "lessThan": return { field, lessThan: Number(value) };
        default: return { field, equals: value };
    }
};

/**
 * The properties panel: everything about one question. Locked questions keep
 * their label control and lose the rest, with the reason shown rather than a
 * silently dead button.
 */
function FieldProperties({
    template,
    field,
    onChange,
    onSetCondition,
    onDelete,
    deleteBlockedReason,
}: FieldPropertiesProps): JSX.Element {
    const [sample, setSample] = useState("");
    const sources = availableConditionSources(template, field.id);
    const condition = field.showWhen?.all?.[0];
    const preset = findPreset(field.validation);
    const isCustomPattern = Boolean(field.validation?.pattern) && !preset;
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
                value={field.label}
                onChange={(e) => onChange({ label: e.target.value })}
            />

            <label className="fb-label" htmlFor="fb-help-input">Help text (optional)</label>
            <input
                id="fb-help-input"
                className="fb-input"
                value={field.helpText || ""}
                placeholder="Shown under the question"
                onChange={(e) => onChange({ helpText: e.target.value })}
            />

            <label className="fb-label" htmlFor="fb-placeholder-input">Placeholder (optional)</label>
            <input
                id="fb-placeholder-input"
                className="fb-input"
                value={field.placeholder || ""}
                onChange={(e) => onChange({ placeholder: e.target.value })}
            />

            <label className="fb-label" htmlFor="fb-type-input">Answer type</label>
            <select
                id="fb-type-input"
                className="fb-input"
                value={field.type}
                disabled={field.locked || Boolean(field.component)}
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
                    disabled={field.locked}
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
            ) : (
                <>
                    <div className="fb-condition-row">
                        <select
                            className="fb-input"
                            aria-label="Question this depends on"
                            value={condition?.field || ""}
                            onChange={(e) =>
                                e.target.value
                                    ? onSetCondition({
                                        all: [buildCondition(e.target.value, operatorOf(condition), valueOf(condition))],
                                    })
                                    : onSetCondition(undefined)
                            }
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
                                    value={operatorOf(condition)}
                                    onChange={(e) =>
                                        onSetCondition({
                                            all: [buildCondition(condition.field, e.target.value, valueOf(condition))],
                                        })
                                    }
                                >
                                    {OPERATORS.map((op) => (
                                        <option key={op.value} value={op.value}>{op.label}</option>
                                    ))}
                                </select>

                                {operatorOf(condition) !== "answered" && (
                                    <input
                                        className="fb-input"
                                        aria-label="Answer to match"
                                        value={valueOf(condition)}
                                        onChange={(e) =>
                                            onSetCondition({
                                                all: [buildCondition(condition.field, operatorOf(condition), e.target.value)],
                                            })
                                        }
                                    />
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
            <h4 className="fb-props-subtitle">Accepted answers</h4>
            <div className="fb-two-up">
                <div>
                    <label className="fb-label" htmlFor="fb-minlen">Shortest</label>
                    <input
                        id="fb-minlen" className="fb-input" type="number" min={0}
                        value={field.validation?.minLength ?? ""}
                        onChange={(e) => setValidation({ minLength: e.target.value ? Number(e.target.value) : undefined })}
                    />
                </div>
                <div>
                    <label className="fb-label" htmlFor="fb-maxlen">Longest</label>
                    <input
                        id="fb-maxlen" className="fb-input" type="number" min={0}
                        value={field.validation?.maxLength ?? ""}
                        onChange={(e) => setValidation({ maxLength: e.target.value ? Number(e.target.value) : undefined })}
                    />
                </div>
            </div>

            <label className="fb-label" htmlFor="fb-pattern-preset">Format</label>
            <select
                id="fb-pattern-preset"
                className="fb-input"
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
                        value={field.validation?.pattern || ""}
                        onChange={(e) => setValidation({ pattern: e.target.value })}
                    />
                    <label className="fb-label" htmlFor="fb-pattern-message">Message when it does not match</label>
                    <input
                        id="fb-pattern-message"
                        className="fb-input"
                        value={field.validation?.patternMessage || ""}
                        placeholder="Enter an EIN like 12-3456789"
                        onChange={(e) => setValidation({ patternMessage: e.target.value })}
                    />

                    <label className="fb-label" htmlFor="fb-pattern-test">Try an answer</label>
                    <input
                        id="fb-pattern-test"
                        className="fb-input"
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

            <div className="fb-props-footer">
                <Button
                    variant="outlined"
                    color="error"
                    onClick={onDelete}
                    disabled={Boolean(deleteBlockedReason)}
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
