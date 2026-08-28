import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "./FormBuilder.css";
import RoleDashboardShell from "../../components/dashboard-layout/RoleDashboardShell";
import { getSidebarbyRole } from "../../types/sidebar-types";
import { auth } from "../../index";
import {
    activateTemplate,
    listTemplates,
    seedTemplatesIfMissing,
} from "../../backend/form-template-service";
import { grantTypesWithoutActiveTemplate } from "../../form-templates/versioning";
import { FormTemplate, GrantType } from "../../types/form-template-types";

const GRANT_LABELS: Record<GrantType, string> = {
    research: "Research Grant",
    nextgen: "NextGen Award",
    nonresearch: "Non-Research Grant",
};

/**
 * The list of application forms: what each grant type currently asks, and the
 * way into editing it. Deliberately quiet — most visits are to change a couple
 * of words, not to build something new.
 */
function FormBuilderPage(): JSX.Element {
    const navigate = useNavigate();
    const sidebarItems = getSidebarbyRole("admin");

    const [templates, setTemplates] = useState<FormTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const [working, setWorking] = useState(false);

    const load = () =>
        listTemplates()
            .then(setTemplates)
            .catch((error) => {
                console.error("Error loading form templates:", error);
                toast.error("Could not load the forms.");
            })
            .finally(() => setLoading(false));

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const missing = grantTypesWithoutActiveTemplate(templates);

    const handleSeed = async () => {
        setWorking(true);
        try {
            const created = await seedTemplatesIfMissing(auth.currentUser?.email || "unknown");
            if (created.length === 0) {
                toast.info("Every grant type already has a form.");
            } else {
                toast.success(`Created forms for: ${created.map((t) => GRANT_LABELS[t]).join(", ")}.`);
            }
            await load();
        } catch (error: any) {
            console.error("Error seeding form templates:", error);
            toast.error(error?.message || "Could not create the starting forms.");
        } finally {
            setWorking(false);
        }
    };

    const handleActivate = async (template: FormTemplate) => {
        setWorking(true);
        try {
            await activateTemplate(template.id);
            toast.success(`${template.name} is now the live form.`);
            await load();
        } catch (error: any) {
            console.error("Error activating template:", error);
            toast.error(error?.message || "Could not make that form live.");
        } finally {
            setWorking(false);
        }
    };

    return (
        <RoleDashboardShell sidebarItems={sidebarItems} title="Application Forms" stackClassName="fb-page">
            <p className="fb-intro">
                These are the forms applicants fill in. Editing one creates a draft; publishing it makes it live
                for new applications. Applications already submitted keep the wording they were submitted under.
            </p>

            {missing.length > 0 && (
                <div className="fb-callout">
                    <p>
                        <strong>No live form for {missing.map((t) => GRANT_LABELS[t]).join(", ")}.</strong>{" "}
                        Applicants see the built-in version of these forms until one is published.
                    </p>
                    <button type="button" className="fb-btn" onClick={handleSeed} disabled={working}>
                        {working ? "Working…" : "Create from the current forms"}
                    </button>
                </div>
            )}

            {loading ? (
                <p className="fb-hint">Loading forms…</p>
            ) : templates.length === 0 ? (
                <p className="fb-hint">No forms yet.</p>
            ) : (
                <ul className="fb-template-list">
                    {templates.map((template) => (
                        <li key={template.id} className="fb-template-card">
                            <div className="fb-template-main">
                                <h3>{template.name}</h3>
                                <p className="fb-hint">
                                    {GRANT_LABELS[template.grantType]} · version {template.version} ·{" "}
                                    {template.pages.reduce((n, p) => n + (p.fields?.length || 0), 0)} questions
                                    {template.updatedAt && ` · edited ${new Date(template.updatedAt).toLocaleDateString()}`}
                                </p>
                            </div>
                            <div className="fb-template-state">
                                {template.isActive && template.status === "published" ? (
                                    <span className="fb-tag fb-tag-live">Live</span>
                                ) : (
                                    <span className="fb-tag">{template.status}</span>
                                )}
                            </div>
                            <div className="fb-template-actions">
                                <button
                                    type="button"
                                    className="fb-btn fb-btn-quiet"
                                    onClick={() => navigate(`/admin/form-builder/${template.id}`)}
                                >
                                    {template.status === "published" ? "View" : "Edit"}
                                </button>
                                {template.status === "published" && !template.isActive && (
                                    <button
                                        type="button"
                                        className="fb-btn"
                                        onClick={() => handleActivate(template)}
                                        disabled={working}
                                    >
                                        Make live
                                    </button>
                                )}
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </RoleDashboardShell>
    );
}

export default FormBuilderPage;
