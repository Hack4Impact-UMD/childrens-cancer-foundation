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
    discardDraft,
    getTemplate,
    listVersions,
    publishTemplate,
    saveDraft,
    setActiveVersion,
    startNewDraft,
} from "../../backend/form-template-service";
import {
    hasUnpublishedChanges,
    liveVersionNumber,
    versionAsTemplate,
} from "../../form-templates/versioning";
import { grantLabel } from "../../form-templates/grant-labels";
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
import {
    FieldType,
    FormField,
    FormTemplate,
    PublishedVersion,
} from "../../types/form-template-types";

const NEW_FIELD_TYPES: { value: FieldType; label: string }[] = [
    { value: "text", label: "Short text" },
    { value: "textarea", label: "Long text" },
    { value: "radio", label: "Choice" },
    { value: "currency", label: "Dollar amount" },
    { value: "date", label: "Date" },
    { value: "checkbox", label: "Checkbox" },
];

const publishedOn = (version: PublishedVersion): string =>
    new Date(version.publishedAt).toLocaleDateString();

/**
 * The builder. Three panels — pages, the questions on the selected page, and
 * the properties of the selected question — over the pure operations in
 * `builder-operations`, which own every guard. Nothing here decides whether an
 * edit is allowed; it asks, and shows the reason when the answer is no.
 *
 * The panels render whichever form is *being viewed*, which is not always the
 * one being edited: an admin with a draft open still needs to see what
 * applicants are filling in right now, and what earlier versions asked. Only
 * the working copy is ever editable, so viewing a published version puts the
 * whole screen into read-only, exactly as an already-published working copy
 * does.
 */
function FormTemplateEditor(): JSX.Element {
    const { templateId } = useParams<{ templateId: string }>();
    const navigate = useNavigate();
    const sidebarItems = getSidebarbyRole("admin");

    const [template, setTemplate] = useState<FormTemplate | null>(null);
    const [versions, setVersions] = useState<PublishedVersion[]>([]);
    /** Which published version is on screen; null means the working copy. */
    const [viewingVersion, setViewingVersion] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [dirty, setDirty] = useState(false);
    const [saving, setSaving] = useState(false);
    const [selectedPageId, setSelectedPageId] = useState<string | null>(null);
    const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
    const [showPreview, setShowPreview] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
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

        // History is useful but never essential, so a failure here leaves the
        // builder working rather than blocking the edit an admin came to make.
        listVersions(templateId)
            .then(setVersions)
            .catch((error) => console.error("Error loading published versions:", error));
    }, [templateId, navigate]);

    const liveVersion = template ? liveVersionNumber(template) : null;
    const draftInProgress = template ? hasUnpublishedChanges(template) : false;

    // What is on screen. A version that cannot be found falls back to the
    // working copy rather than blanking the builder.
    const viewedVersion = viewingVersion === null
        ? null
        : versions.find((v) => v.version === viewingVersion) ?? null;
    const shown: FormTemplate | null = viewedVersion
        ? versionAsTemplate(viewedVersion, viewedVersion.version === liveVersion)
        : template;

    const problems = useMemo(() => (template ? validateTemplate(template) : []), [template]);
    const page = shown?.pages.find((p) => p.id === selectedPageId) ?? null;
    const field = page?.fields.find((f) => f.id === selectedFieldId) ?? null;
    // The working copy is editable only while it is a draft. A published
    // template is the record of what applicants are filling in, so changing it
    // starts a new draft rather than editing history.
    const readOnly = viewedVersion !== null || template?.status === "published";
    const viewingAVersion = viewedVersion !== null;
    const backToWorkingCopyFirst = "Go back to the working copy to do this";

    /** Put a published version — or the working copy, for null — on screen. */
    const showVersion = (version: number | null) => {
        const next = version === null
            ? template
            : versions.find((v) => v.version === version);
        setViewingVersion(version);
        // Page IDs are not shared across versions, so the old selection may not
        // exist in what is now on screen.
        setSelectedPageId(next ? editablePages(next as FormTemplate)[0]?.id ?? null : null);
        setSelectedFieldId(null);
    };

    /** Every edit funnels through here, so a refused edit is reported once. */
    const edit = (change: (current: FormTemplate) => FormTemplate) => {
        if (!template) return;
        if (viewedVersion) {
            setSnack(`You are looking at version ${viewedVersion.version} — switch to the draft to make changes`);
            return;
        }
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

    const handleStartDraft = async () => {
        if (!template) return;
        setSaving(true);
        try {
            const draft = await startNewDraft(template.id, auth.currentUser?.email || "unknown");
            setTemplate(draft);
            setViewingVersion(null);
            setSelectedPageId(editablePages(draft)[0]?.id ?? null);
            setSelectedFieldId(null);
            setDirty(false);
            setSnack(`Draft started — applicants keep seeing version ${liveVersion ?? template.version} until you publish`);
        } catch (error: any) {
            console.error("Error starting a new draft:", error);
            setSnack(error?.message || "Could not start a new draft");
        } finally {
            setSaving(false);
        }
    };

    const handleDiscardDraft = async () => {
        if (!template) return;
        if (!window.confirm("Discard this draft and go back to the published form? This cannot be undone.")) return;

        setSaving(true);
        try {
            const reverted = await discardDraft(template.id, auth.currentUser?.email || "unknown");
            setTemplate(reverted);
            setViewingVersion(null);
            setSelectedPageId(editablePages(reverted)[0]?.id ?? null);
            setSelectedFieldId(null);
            setDirty(false);
            setSnack("Draft discarded");
        } catch (error: any) {
            console.error("Error discarding draft:", error);
            setSnack(error?.message || "Could not discard this draft");
        } finally {
            setSaving(false);
        }
    };

    const handleMakeLive = async (version: number) => {
        if (!template) return;
        if (!window.confirm(
            `Make version ${version} the form applicants fill in? ` +
            `Version ${liveVersion} stays saved and can be brought back the same way.`
        )) return;

        setSaving(true);
        try {
            const rolled = await setActiveVersion(template.id, version, auth.currentUser?.email || "unknown");
            setTemplate(rolled);
            setViewingVersion(null);
            setSelectedPageId(editablePages(rolled)[0]?.id ?? null);
            setSelectedFieldId(null);
            setDirty(false);
            setSnack(`Applicants now fill in version ${version}`);
        } catch (error: any) {
            console.error("Error changing the live version:", error);
            setSnack(error?.message || "Could not change the live version");
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

    if (loading || !template || !shown) {
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
                <h2>{shown.name}</h2>
            </div>
            <div className="fb-toolbar">
                <p className="fb-hint">
                    {grantLabel(template.grantType)}
                    {liveVersion
                        ? ` · applicants are filling in version ${liveVersion}`
                        : " · never published"}
                    {template.status === "published"
                        ? " · no draft in progress"
                        : ` · editing draft for version ${template.version}`}
                    {dirty && " · unsaved changes"}
                </p>
                <div className="fb-toolbar-actions">
                    <Button variant="outlined" onClick={() => setShowPreview((s) => !s)}>
                        {showPreview ? "Back to editing" : "Preview"}
                    </Button>
                    {template.status === "published" ? (
                        <Button
                            variant="contained"
                            onClick={handleStartDraft}
                            disabled={saving || viewingAVersion}
                            title={viewingAVersion ? backToWorkingCopyFirst : undefined}
                        >
                            {saving ? "Working…" : "Start new draft"}
                        </Button>
                    ) : (
                        <Button
                            variant="outlined"
                            onClick={handleSave}
                            disabled={saving || !dirty || readOnly}
                            title={viewingAVersion ? backToWorkingCopyFirst : undefined}
                        >
                            {saving ? "Saving…" : "Save draft"}
                        </Button>
                    )}
                    {draftInProgress && (
                        <Button
                            variant="outlined"
                            color="error"
                            onClick={handleDiscardDraft}
                            disabled={saving || viewingAVersion}
                            title={viewingAVersion ? backToWorkingCopyFirst : undefined}
                        >
                            Discard draft
                        </Button>
                    )}
                    <Button
                        variant="contained"
                        onClick={() => setPublishOpen(true)}
                        disabled={saving || template.status === "published" || problems.length > 0 || viewingAVersion}
                        title={
                            viewingAVersion
                                ? backToWorkingCopyFirst
                                : problems.length > 0
                                    ? "Fix the problems listed below first"
                                    : undefined
                        }
                    >
                        Publish
                    </Button>
                </div>
            </div>

            {/* Editing a draft hides what applicants are actually filling in,
                so the two are one click apart rather than a publish apart. */}
            {draftInProgress && liveVersion && versions.some((v) => v.version === liveVersion) && (
                <div className="fb-view-switch" role="group" aria-label="Which version to show">
                    <button
                        type="button"
                        className={viewingVersion === null ? "is-selected" : ""}
                        onClick={() => showVersion(null)}
                    >
                        Draft · version {template.version}
                    </button>
                    <button
                        type="button"
                        className={viewingVersion === liveVersion ? "is-selected" : ""}
                        onClick={() => showVersion(liveVersion)}
                    >
                        Live · version {liveVersion}
                    </button>
                </div>
            )}

            {viewedVersion && (
                <p className="fb-locked-note">
                    Showing version {viewedVersion.version}, published {publishedOn(viewedVersion)} by{" "}
                    {viewedVersion.publishedBy}. Nothing here can be edited.{" "}
                    <button type="button" className="fb-inline-link" onClick={() => showVersion(null)}>
                        {draftInProgress ? "Back to the draft" : "Back to the working copy"}
                    </button>
                </p>
            )}

            {!viewedVersion && template.status === "published" && (
                <p className="fb-locked-note">
                    This is the published form. Start a new draft to change it — applicants keep filling in
                    the live version until you publish the draft.
                </p>
            )}

            {!viewedVersion && draftInProgress && (
                <p className="fb-locked-note">
                    You are editing a draft. Applicants still see version {liveVersion} until you publish.
                </p>
            )}

            {!viewedVersion && problems.length > 0 && (
                <div className="fb-problems" role="alert">
                    <strong>Fix before publishing</strong>
                    <ul>
                        {problems.map((p, i) => <li key={i}>{p.message}</li>)}
                    </ul>
                </div>
            )}
            </div>

            {versions.length > 0 && (
                <div className="fb-panel">
                    <div className="fb-panel-header fb-history-header">
                        <h3>Version history</h3>
                        <Button variant="outlined" size="small" onClick={() => setShowHistory((s) => !s)}>
                            {showHistory ? "Hide" : `Show all ${versions.length}`}
                        </Button>
                    </div>
                    {!showHistory ? (
                        <p className="fb-hint">
                            {versions.length} published version{versions.length === 1 ? "" : "s"}, kept so past
                            applications keep their original wording. Any of them can be read, or made live again.
                        </p>
                    ) : (
                        <ul className="fb-versions">
                            {versions.slice().reverse().map((v) => (
                                <li key={v.version} className="fb-version">
                                    <div className="fb-version-main">
                                        <div className="fb-version-title">
                                            <strong>Version {v.version}</strong>
                                            {v.version === liveVersion && (
                                                <span className="fb-tag fb-tag-live">Live</span>
                                            )}
                                            {v.version === viewingVersion && (
                                                <span className="fb-tag fb-tag-cond">Showing</span>
                                            )}
                                        </div>
                                        <p className="fb-hint">
                                            {publishedOn(v)} · {v.publishedBy}
                                        </p>
                                        <p className="fb-version-note">
                                            {v.changeNote || <em>No note was left for this version.</em>}
                                        </p>
                                    </div>
                                    <div className="fb-version-actions">
                                        <Button
                                            variant="outlined"
                                            size="small"
                                            onClick={() => showVersion(v.version === viewingVersion ? null : v.version)}
                                        >
                                            {v.version === viewingVersion ? "Stop showing" : "View"}
                                        </Button>
                                        {v.version !== liveVersion && (
                                            <Button
                                                variant="outlined"
                                                size="small"
                                                disabled={saving || draftInProgress}
                                                title={draftInProgress
                                                    ? "Publish or discard the draft in progress first"
                                                    : undefined}
                                                onClick={() => handleMakeLive(v.version)}
                                            >
                                                Make live
                                            </Button>
                                        )}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}

            {showPreview ? (
                <FormPreview template={shown} />
            ) : (
                <div className="fb-columns">
                    {/* ---- pages ---- */}
                    <aside className="fb-panel">
                        <div className="fb-panel-header"><h3>Pages</h3></div>
                        <ul className="fb-list">
                            {shown.pages.map((p) => (
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
                                    {isEditablePage(p) && p.id === selectedPageId && !readOnly && (
                                        <div className="fb-row-actions">
                                            <button type="button" className="fb-mini" title={whyCannotMovePage(shown, p.id, -1) || "Move up"}
                                                disabled={Boolean(whyCannotMovePage(shown, p.id, -1))}
                                                onClick={() => edit((t) => movePage(t, p.id, -1))}>↑</button>
                                            <button type="button" className="fb-mini" title={whyCannotMovePage(shown, p.id, 1) || "Move down"}
                                                disabled={Boolean(whyCannotMovePage(shown, p.id, 1))}
                                                onClick={() => edit((t) => movePage(t, p.id, 1))}>↓</button>
                                            <button type="button" className="fb-mini fb-mini-danger"
                                                title={whyCannotDeletePage(shown, p.id) || "Remove page"}
                                                disabled={Boolean(whyCannotDeletePage(shown, p.id))}
                                                onClick={() => {
                                                    edit((t) => deletePage(t, p.id));
                                                    setSelectedPageId(editablePages(shown).find((x) => x.id !== p.id)?.id ?? null);
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
                                            {f.id === selectedFieldId && !readOnly && (
                                                <div className="fb-row-actions">
                                                    <button type="button" className="fb-mini"
                                                        title={whyCannotMoveField(shown, f.id, -1) || "Move up"}
                                                        disabled={Boolean(whyCannotMoveField(shown, f.id, -1))}
                                                        onClick={() => edit((t) => moveField(t, f.id, -1))}>↑</button>
                                                    <button type="button" className="fb-mini"
                                                        title={whyCannotMoveField(shown, f.id, 1) || "Move down"}
                                                        disabled={Boolean(whyCannotMoveField(shown, f.id, 1))}
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
                                        disabled={readOnly}
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
                                template={shown}
                                field={field}
                                readOnly={readOnly}
                                onChange={(patch) => edit((t) => updateField(t, field.id, patch))}
                                onSetCondition={(rule) => edit((t) => setFieldCondition(t, field.id, rule))}
                                onDelete={() => {
                                    edit((t) => deleteField(t, field.id));
                                    setSelectedFieldId(null);
                                }}
                                deleteBlockedReason={whyCannotDeleteField(shown, field.id)}
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
                        This becomes the {grantLabel(template.grantType)} form straight away, as version{" "}
                        {template.version}.
                    </p>
                    <p>
                        Applications already submitted keep the wording they were submitted under. Anyone
                        part-way through will be asked to refresh and will finish on the new version — their
                        saved answers are kept, but any question you have added will be blank and required.
                    </p>
                    <label className="fb-label" htmlFor="fb-change-note">
                        What changed? Shown in the version history.
                    </label>
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
