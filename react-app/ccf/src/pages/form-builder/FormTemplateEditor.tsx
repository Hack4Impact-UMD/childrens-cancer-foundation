import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import "./FormBuilder.css";
import RoleDashboardShell from "../../components/dashboard-layout/RoleDashboardShell";
import { getSidebarbyRole } from "../../types/sidebar-types";
import { Modal } from "../../components/modal/modal";
import FieldProperties from "./FieldProperties";
import FormPreview from "./FormPreview";
import { auth } from "../../index";
import {
    getTemplate,
    publishTemplate,
    saveDraft,
} from "../../backend/form-template-service";
import {
    addField,
    addPage,
    deleteField,
    deletePage,
    editablePages,
    isEditablePage,
    moveField,
    movePage,
    renamePage,
    setFieldCondition,
    updateField,
    whyCannotDeleteField,
    whyCannotDeletePage,
    whyCannotMoveField,
    whyCannotMovePage,
} from "../../form-templates/builder-operations";
import { validateTemplate } from "../../form-templates/engine";
import { FieldType, FormField, FormTemplate } from "../../types/form-template-types";

const NEW_FIELD_TYPES: { value: FieldType; label: string }[] = [
    { value: "text", label: "Short text" },
    { value: "textarea", label: "Long text" },
    { value: "radio", label: "Choice" },
    { value: "currency", label: "Dollar amount" },
    { value: "date", label: "Date" },
    { value: "checkbox", label: "Checkbox" },
];

/**
 * The builder. Three panels — pages, the questions on the selected page, and
 * the properties of the selected question — over the pure operations in
 * `builder-operations`, which own every guard. Nothing here decides whether an
 * edit is allowed; it asks, and shows the reason when the answer is no.
 */
function FormTemplateEditor(): JSX.Element {
    const { templateId } = useParams<{ templateId: string }>();
    const navigate = useNavigate();
    const sidebarItems = getSidebarbyRole("admin");

    const [template, setTemplate] = useState<FormTemplate | null>(null);
    const [loading, setLoading] = useState(true);
    const [dirty, setDirty] = useState(false);
    const [saving, setSaving] = useState(false);
    const [selectedPageId, setSelectedPageId] = useState<string | null>(null);
    const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
    const [showPreview, setShowPreview] = useState(false);
    const [newFieldType, setNewFieldType] = useState<FieldType>("text");
    const [publishOpen, setPublishOpen] = useState(false);
    const [changeNote, setChangeNote] = useState("");

    useEffect(() => {
        if (!templateId) return;
        getTemplate(templateId)
            .then((found) => {
                if (!found) {
                    toast.error("That form could not be found.");
                    navigate("/admin/form-builder");
                    return;
                }
                setTemplate(found);
                setSelectedPageId(editablePages(found)[0]?.id ?? null);
            })
            .catch((error) => {
                console.error("Error loading form template:", error);
                toast.error("Could not load that form.");
            })
            .finally(() => setLoading(false));
    }, [templateId, navigate]);

    const problems = useMemo(() => (template ? validateTemplate(template) : []), [template]);
    const page = template?.pages.find((p) => p.id === selectedPageId) ?? null;
    const field = page?.fields.find((f) => f.id === selectedFieldId) ?? null;
    const readOnly = template?.status === "published";

    /** Every edit funnels through here, so a refused edit is reported once. */
    const edit = (change: (current: FormTemplate) => FormTemplate) => {
        if (!template) return;
        if (readOnly) {
            toast.warn("This version is published. Start a new draft to make changes.");
            return;
        }
        try {
            setTemplate(change(template));
            setDirty(true);
        } catch (error: any) {
            toast.warn(error?.message || "That change is not allowed.");
        }
    };

    const handleSave = async () => {
        if (!template) return;
        setSaving(true);
        try {
            await saveDraft(template, auth.currentUser?.email || "unknown");
            setDirty(false);
            toast.success("Draft saved.");
        } catch (error: any) {
            console.error("Error saving draft:", error);
            toast.error(error?.message || "Could not save this draft.");
        } finally {
            setSaving(false);
        }
    };

    const handlePublish = async () => {
        if (!template) return;
        setSaving(true);
        try {
            await saveDraft(template, auth.currentUser?.email || "unknown");
            const result = await publishTemplate(template.id, auth.currentUser?.email || "unknown", {
                changeNote: changeNote.trim() || undefined,
            });
            if (!result.ok) {
                toast.error(`Not published: ${(result.errors || []).join(", ")}`);
                return;
            }
            if (result.warning) toast.warn(result.warning);
            toast.success(`Published version ${result.version}. Applicants see it now.`);
            setPublishOpen(false);
            setDirty(false);
            navigate("/admin/form-builder");
        } catch (error: any) {
            console.error("Error publishing template:", error);
            toast.error(error?.message || "Could not publish this form.");
        } finally {
            setSaving(false);
        }
    };

    if (loading || !template) {
        return (
            <RoleDashboardShell sidebarItems={sidebarItems} title="Edit Form" stackClassName="fb-page">
                <p className="fb-hint">{loading ? "Loading form…" : "Form not found."}</p>
            </RoleDashboardShell>
        );
    }

    return (
        <RoleDashboardShell sidebarItems={sidebarItems} title="Edit Form" stackClassName="fb-page">
            <div className="fb-toolbar">
                <div>
                    <h2 className="fb-form-name">{template.name}</h2>
                    <p className="fb-hint">
                        {template.grantType} · version {template.version} · {template.status}
                        {dirty && " · unsaved changes"}
                    </p>
                </div>
                <div className="fb-toolbar-actions">
                    <button type="button" className="fb-btn fb-btn-quiet" onClick={() => setShowPreview((s) => !s)}>
                        {showPreview ? "Back to editing" : "Preview"}
                    </button>
                    <button type="button" className="fb-btn" onClick={handleSave} disabled={saving || readOnly || !dirty}>
                        {saving ? "Saving…" : "Save draft"}
                    </button>
                    <button
                        type="button"
                        className="fb-btn fb-btn-primary"
                        onClick={() => setPublishOpen(true)}
                        disabled={saving || readOnly || problems.length > 0}
                        title={problems.length > 0 ? "Fix the problems listed below first" : undefined}
                    >
                        Publish
                    </button>
                </div>
            </div>

            {problems.length > 0 && (
                <div className="fb-problems" role="alert">
                    <strong>Fix before publishing</strong>
                    <ul>
                        {problems.map((p, i) => <li key={i}>{p.message}</li>)}
                    </ul>
                </div>
            )}

            {showPreview ? (
                <FormPreview template={template} />
            ) : (
                <div className="fb-columns">
                    {/* ---- pages ---- */}
                    <aside className="fb-panel">
                        <h3 className="fb-panel-title">Pages</h3>
                        <ul className="fb-list">
                            {template.pages.map((p) => (
                                <li key={p.id}>
                                    <button
                                        type="button"
                                        className={`fb-list-item${p.id === selectedPageId ? " is-selected" : ""}`}
                                        onClick={() => { setSelectedPageId(p.id); setSelectedFieldId(null); }}
                                        disabled={!isEditablePage(p)}
                                    >
                                        <span>{p.title}</span>
                                        <span className="fb-count">
                                            {isEditablePage(p) ? `${p.fields.length}` : "generated"}
                                        </span>
                                    </button>
                                    {isEditablePage(p) && p.id === selectedPageId && (
                                        <div className="fb-row-actions">
                                            <button type="button" className="fb-mini" title={whyCannotMovePage(template, p.id, -1) || "Move up"}
                                                disabled={Boolean(whyCannotMovePage(template, p.id, -1))}
                                                onClick={() => edit((t) => movePage(t, p.id, -1))}>↑</button>
                                            <button type="button" className="fb-mini" title={whyCannotMovePage(template, p.id, 1) || "Move down"}
                                                disabled={Boolean(whyCannotMovePage(template, p.id, 1))}
                                                onClick={() => edit((t) => movePage(t, p.id, 1))}>↓</button>
                                            <button type="button" className="fb-mini fb-mini-danger"
                                                title={whyCannotDeletePage(template, p.id) || "Remove page"}
                                                disabled={Boolean(whyCannotDeletePage(template, p.id))}
                                                onClick={() => {
                                                    edit((t) => deletePage(t, p.id));
                                                    setSelectedPageId(editablePages(template).find((x) => x.id !== p.id)?.id ?? null);
                                                }}>✕</button>
                                        </div>
                                    )}
                                </li>
                            ))}
                        </ul>
                        <button
                            type="button"
                            className="fb-btn fb-btn-quiet fb-full"
                            disabled={readOnly}
                            onClick={() => {
                                const title = window.prompt("Name for the new page:")?.trim();
                                if (title) edit((t) => addPage(t, title, selectedPageId ?? undefined));
                            }}
                        >
                            + Add page
                        </button>
                    </aside>

                    {/* ---- questions ---- */}
                    <section className="fb-panel">
                        <h3 className="fb-panel-title">
                            {page ? `Questions on ${page.title}` : "Questions"}
                        </h3>
                        {page && (
                            <>
                                <label className="fb-label" htmlFor="fb-page-title">Page title</label>
                                <input
                                    id="fb-page-title"
                                    className="fb-input"
                                    value={page.title}
                                    disabled={readOnly}
                                    onChange={(e) => edit((t) => renamePage(t, page.id, e.target.value))}
                                />

                                <ul className="fb-list fb-list-fields">
                                    {page.fields.map((f: FormField) => (
                                        <li key={f.id}>
                                            <button
                                                type="button"
                                                className={`fb-list-item${f.id === selectedFieldId ? " is-selected" : ""}`}
                                                onClick={() => setSelectedFieldId(f.id)}
                                            >
                                                <span className="fb-field-label">
                                                    {f.shortLabel || f.label}
                                                    {f.required && <span className="fb-req"> *</span>}
                                                </span>
                                                <span className="fb-tags">
                                                    {f.locked && <span className="fb-tag fb-tag-locked">locked</span>}
                                                    {f.showWhen && <span className="fb-tag fb-tag-cond">conditional</span>}
                                                    <span className="fb-tag">{f.type}</span>
                                                </span>
                                            </button>
                                            {f.id === selectedFieldId && (
                                                <div className="fb-row-actions">
                                                    <button type="button" className="fb-mini"
                                                        title={whyCannotMoveField(template, f.id, -1) || "Move up"}
                                                        disabled={Boolean(whyCannotMoveField(template, f.id, -1))}
                                                        onClick={() => edit((t) => moveField(t, f.id, -1))}>↑</button>
                                                    <button type="button" className="fb-mini"
                                                        title={whyCannotMoveField(template, f.id, 1) || "Move down"}
                                                        disabled={Boolean(whyCannotMoveField(template, f.id, 1))}
                                                        onClick={() => edit((t) => moveField(t, f.id, 1))}>↓</button>
                                                </div>
                                            )}
                                        </li>
                                    ))}
                                </ul>

                                <div className="fb-add-field">
                                    <select
                                        className="fb-input"
                                        aria-label="Type of question to add"
                                        value={newFieldType}
                                        onChange={(e) => setNewFieldType(e.target.value as FieldType)}
                                    >
                                        {NEW_FIELD_TYPES.map((t) => (
                                            <option key={t.value} value={t.value}>{t.label}</option>
                                        ))}
                                    </select>
                                    <button
                                        type="button"
                                        className="fb-btn fb-btn-quiet"
                                        disabled={readOnly}
                                        onClick={() => {
                                            const label = window.prompt("What should the question say?")?.trim();
                                            if (label) edit((t) => addField(t, page.id, { label, type: newFieldType }));
                                        }}
                                    >
                                        + Add question
                                    </button>
                                </div>
                            </>
                        )}
                    </section>

                    {/* ---- properties ---- */}
                    <aside className="fb-panel">
                        {field ? (
                            <FieldProperties
                                template={template}
                                field={field}
                                onChange={(patch) => edit((t) => updateField(t, field.id, patch))}
                                onSetCondition={(rule) => edit((t) => setFieldCondition(t, field.id, rule))}
                                onDelete={() => {
                                    edit((t) => deleteField(t, field.id));
                                    setSelectedFieldId(null);
                                }}
                                deleteBlockedReason={whyCannotDeleteField(template, field.id)}
                            />
                        ) : (
                            <p className="fb-hint">Select a question to edit it.</p>
                        )}
                    </aside>
                </div>
            )}

            <Modal isOpen={publishOpen} onClose={() => setPublishOpen(false)} title="Publish this form">
                <div className="fb-publish">
                    <p>
                        Publishing freezes this draft as version {template.version + 1} and makes it the form
                        applicants fill in for {template.grantType} grants. Published versions are kept forever so
                        past applications keep their original wording.
                    </p>
                    <label className="fb-label" htmlFor="fb-change-note">What changed? (optional)</label>
                    <input
                        id="fb-change-note"
                        className="fb-input"
                        value={changeNote}
                        placeholder="Reworded the EIN question, removed continuation years"
                        onChange={(e) => setChangeNote(e.target.value)}
                    />
                    <div className="fb-publish-actions">
                        <button type="button" className="fb-btn fb-btn-quiet" onClick={() => setPublishOpen(false)}>
                            Cancel
                        </button>
                        <button type="button" className="fb-btn fb-btn-primary" onClick={handlePublish} disabled={saving}>
                            {saving ? "Publishing…" : "Publish"}
                        </button>
                    </div>
                </div>
            </Modal>
        </RoleDashboardShell>
    );
}

export default FormTemplateEditor;
