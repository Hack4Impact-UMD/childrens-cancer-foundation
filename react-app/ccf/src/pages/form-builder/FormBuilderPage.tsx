import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Snackbar } from "@mui/material";
import DescriptionIcon from "@mui/icons-material/Description";
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
    const [snack, setSnack] = useState<string | null>(null);

    const load = () =>
        listTemplates()
            .then(setTemplates)
            .catch((error) => {
                console.error("Error loading form templates:", error);
                setSnack("Could not load the forms");
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
            setSnack(
                created.length === 0
                    ? "Every grant type already has a form"
                    : `Created forms for ${created.map((t) => GRANT_LABELS[t]).join(", ")}`
            );
            await load();
        } catch (error: any) {
            console.error("Error seeding form templates:", error);
            setSnack(error?.message || "Could not create the starting forms");
        } finally {
            setWorking(false);
        }
    };

    const handleActivate = async (template: FormTemplate) => {
        setWorking(true);
        try {
            await activateTemplate(template.id);
            setSnack(`${template.name} is now the live form`);
            await load();
        } catch (error: any) {
            console.error("Error activating template:", error);
            setSnack(error?.message || "Could not make that form live");
        } finally {
            setWorking(false);
        }
    };

    return (
        <>
            <RoleDashboardShell sidebarItems={sidebarItems} title="Application Forms">
                <div className="fb-shelf">
                    <div className="fb-card">
                        <div className="fb-panel">
                            <div className="fb-panel-header">
                                <DescriptionIcon />
                                <h2>The forms applicants fill in</h2>
                            </div>
                            <p className="fb-intro">
                                Editing a form creates a draft; publishing it makes it live for new applications.
                                Applications already submitted keep the wording they were submitted under.
                            </p>

                            {missing.length > 0 && (
                                <div className="fb-callout">
                                    <p>
                                        <strong>No live form for {missing.map((t) => GRANT_LABELS[t]).join(", ")}.</strong>{" "}
                                        Applicants see the built-in version until one is published.
                                    </p>
                                    <Button variant="contained" onClick={handleSeed} disabled={working}>
                                        {working ? "Working…" : "Create from the current forms"}
                                    </Button>
                                </div>
                            )}
                        </div>

                        {loading ? (
                            <p className="fb-hint">Loading forms…</p>
                        ) : templates.length === 0 ? (
                            <p className="fb-hint">No forms yet.</p>
                        ) : (
                            <ul className="fb-template-list">
                                {templates.map((template) => (
                                    <li key={template.id} className="fb-panel">
                                        <div className="fb-template-card">
                                            <div className="fb-template-main">
                                                <h3>{template.name}</h3>
                                                <p className="fb-hint">
                                                    {GRANT_LABELS[template.grantType]} · version {template.version} ·{" "}
                                                    {template.pages.reduce((n, p) => n + (p.fields?.length || 0), 0)} questions
                                                    {template.updatedAt &&
                                                        ` · edited ${new Date(template.updatedAt).toLocaleDateString()}`}
                                                </p>
                                            </div>
                                            <span className={`fb-tag${template.isActive && template.status === "published" ? " fb-tag-live" : ""}`}>
                                                {template.isActive && template.status === "published" ? "Live" : template.status}
                                            </span>
                                            <div className="fb-template-actions">
                                                <Button
                                                    variant="outlined"
                                                    onClick={() => navigate(`/admin/form-builder/${template.id}`)}
                                                >
                                                    {template.status === "published" ? "View" : "Edit"}
                                                </Button>
                                                {template.status === "published" && !template.isActive && (
                                                    <Button variant="contained" onClick={() => handleActivate(template)} disabled={working}>
                                                        Make live
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            </RoleDashboardShell>
            <Snackbar
                open={!!snack}
                autoHideDuration={3000}
                onClose={() => setSnack(null)}
                message={snack}
            />
        </>
    );
}

export default FormBuilderPage;
