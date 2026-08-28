import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button, Snackbar } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
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
    const [snack, setSnack] = useState<string | null>(null);

    useEffect(() => {
        if (!templateId) return;
        getTemplate(templateId)
            .then((found) => {
                if (!found) {
                    setSnack("That form could not be found");
                    navigate("/admin/form-builder");
                    return;
                }
                setTemplate(found);
                setSelectedPageId(editablePages(found)[0]?.id ?? null);
            })
            .catch((error) => {
                console.error("Error loading form template:", error);
                setSnack("Could not load that form");
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
            setSnack("This version is published — start a new draft to make changes");
            return;
        }
        try {
            setTemplate(change(template));
            setDirty(true);
        } catch (error: any) {
            setSnack(error?.message || "That change is not allowed");
        }
    };

    const handleSave = async () => {
        if (!template) return;
        setSaving(true);
        try {
            await saveDraft(template, auth.currentUser?.email || "unknown");
            setDirty(false);
            setSnack("Draft saved");
        } catch (error: any) {
            console.error("Error saving draft:", error);
            setSnack(error?.message || "Could not save this draft");
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
                setSnack(`Not published — ${(result.errors || []).join(", ")}`);
                return;
            }
            setSnack(
                result.warning
                    ? `Published version ${result.version}. ${result.warning}`
                    : `Published version ${result.version} — applicants see it now`
            );
            setPublishOpen(false);
            setDirty(false);
            navigate("/admin/form-builder");
        } catch (error: any) {
            console.error("Error publishing template:", error);
            setSnack(error?.message || "Could not publish this form");
        } finally {
            setSaving(false);
        }
    };

    if (loading || !template) {
        return (
            <RoleDashboardShell sidebarItems={sidebarItems} title="Edit Form">
                <div className="fb-shelf">
                    <div className="fb-card">
                        <p className="fb-hint">{loading ? "Loading form…" : "Form not found."}</p>
                    </div>
                </div>
            </RoleDashboardShell>
        );
    }

    return (
        <>
        <RoleDashboardShell sidebarItems={sidebarItems} title="Edit Form">
            <div className="fb-shelf">
            <div className="fb-card">
            <div className="fb-panel">
            <div className="fb-panel-header">
                <EditIcon />
                <h2>{template.name}</h2>
            </div>
            <div className="fb-toolbar">
                <p className="fb-hint">
                    {template.grantType} · version {template.version} · {template.status}
                    {dirty && " · unsaved changes"}
                </p>
                <div className="fb-toolbar-actions">
                    <Button variant="outlined" onClick={() => setShowPreview((s) => !s)}>
                        {showPreview ? "Back to editing" : "Preview"}
                    </Button>
                    <Button variant="outlined" onClick={handleSave} disabled={saving || readOnly || !dirty}>
                        {saving ? "Saving…" : "Save draft"}
                    </Button>
                    <Button
                        variant="contained"
                        onClick={() => setPublishOpen(true)}
                        disabled={saving || readOnly || problems.length > 0}
                        title={problems.length > 0 ? "Fix the problems listed below first" : undefined}
                    >
                        Publish
                    </Button>
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
            </div>

            {showPreview ? (
                <FormPreview template={template} />
            ) : (
                <div className="fb-columns">
                    {/* ---- pages ---- */}
                    <aside className="fb-panel">
                        <div className="fb-panel-header"><h3>Pages</h3></div>
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
                        <Button
                            variant="outlined"
                            className="fb-full"
                            disabled={readOnly}
                            onClick={() => {
                                const title = window.prompt("Name for the new page:")?.trim();
                                if (title) edit((t) => addPage(t, title, selectedPageId ?? undefined));
                            }}
                        >
                            Add page
                        </Button>
                    </aside>

                    {/* ---- questions ---- */}
                    <section className="fb-panel">
                        <div className="fb-panel-header">
                            <h3>{page ? `Questions on ${page.title}` : "Questions"}</h3>
                        </div>
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
                                    <Button
                                        variant="outlined"
                                        disabled={readOnly}
                                        onClick={() => {
                                            const label = window.prompt("What should the question say?")?.trim();
                                            if (label) edit((t) => addField(t, page.id, { label, type: newFieldType }));
                                        }}
                                    >
                                        Add question
                                    </Button>
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
                        <Button variant="outlined" onClick={() => setPublishOpen(false)}>Cancel</Button>
                        <Button variant="contained" onClick={handlePublish} disabled={saving}>
                            {saving ? "Publishing…" : "Publish"}
                        </Button>
                    </div>
                </div>
            </Modal>
            </div>
            </div>
        </RoleDashboardShell>
        <Snackbar
            open={!!snack}
            autoHideDuration={4000}
            onClose={() => setSnack(null)}
            message={snack}
        />
        </>
    );
}

export default FormTemplateEditor;
