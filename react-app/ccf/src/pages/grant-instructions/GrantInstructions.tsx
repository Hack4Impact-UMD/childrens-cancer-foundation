import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import "./GrantInstructions.css";
import logo from "../../assets/ccf-logo.png";
import MarkdownPreviewer from "../../components/markdown/Markdown";
import PrintButton from "../../components/print/PrintButton";
import { getAboutPages, getDefaultAboutPage } from "../../backend/about-handler";
import { AboutPage, ApplicationAboutType } from "../../types/aboutTypes";

// Public URL slug -> the About page it shows. Slugs match the application-form
// routes (/applicant/application-form/research, …) so the two stay recognisable
// as the same three grants.
const SLUG_TO_TYPE: Record<string, ApplicationAboutType> = {
    research: "Research",
    nextgen: "NextGen",
    nonresearch: "NonResearch",
};

const GRANT_LINKS: { slug: string; label: string }[] = [
    { slug: "research", label: "Research Grant" },
    { slug: "nextgen", label: "NextGen Award" },
    { slug: "nonresearch", label: "Non-Research Grant" },
];

/**
 * Read-only, publicly readable view of the grant instructions, so CCF can share
 * a link with applicants who do not have an account yet. Content is the same
 * Firestore-backed markdown admins edit for the in-form About Grant page.
 */
function GrantInstructions(): JSX.Element {
    const { grantType } = useParams<{ grantType: string }>();
    const type = grantType ? SLUG_TO_TYPE[grantType.toLowerCase()] : undefined;

    const [page, setPage] = useState<AboutPage | null>(null);
    const [loading, setLoading] = useState<boolean>(Boolean(type));

    useEffect(() => {
        if (!type) {
            setPage(null);
            setLoading(false);
            return;
        }

        let cancelled = false;
        setLoading(true);

        const loadAbout = async () => {
            try {
                const pages = await getAboutPages();
                const match = pages.find((p) => p.id === type);
                if (!cancelled && match) {
                    setPage(match);
                    return;
                }
            } catch (e) {
                console.error("Error loading grant instructions:", e);
            }
            // Fall back to the built-in copy so a reader always sees the
            // instructions, even if the content cannot be fetched.
            if (!cancelled) setPage(getDefaultAboutPage(type));
        };

        loadAbout().finally(() => {
            if (!cancelled) setLoading(false);
        });

        return () => {
            cancelled = true;
        };
    }, [type]);

    const otherGrants = GRANT_LINKS.filter((link) => SLUG_TO_TYPE[link.slug] !== type);

    return (
        <div className="grant-instructions-page">
            <header className="grant-instructions-header no-print">
                <Link to="/">
                    <img src={logo} alt="Children's Cancer Foundation" className="grant-instructions-logo" />
                </Link>
                <div className="grant-instructions-actions">
                    {type && <PrintButton />}
                    <Link to="/login" className="grant-instructions-login">
                        Log in to apply
                    </Link>
                </div>
            </header>

            {!type ? (
                <div className="grant-instructions-content">
                    <h1 className="grant-instructions-title">CCF Grant Opportunities</h1>
                    <p className="grant-instructions-intro">
                        Read the instructions for each grant below. An account is only needed to
                        submit an application.
                    </p>
                    <ul className="grant-instructions-list">
                        {GRANT_LINKS.map((link) => (
                            <li key={link.slug}>
                                <Link to={`/grants/${link.slug}`}>{link.label}</Link>
                            </li>
                        ))}
                    </ul>
                    {grantType && (
                        <p className="grant-instructions-intro">
                            We couldn't find instructions for "{grantType}".
                        </p>
                    )}
                </div>
            ) : loading ? (
                <div className="grant-instructions-content">
                    <p>Loading instructions…</p>
                </div>
            ) : (
                <>
                    <div className="grant-instructions-content printable-instructions">
                        <h1 className="grant-instructions-title">{page?.title || "CCF Grant Instructions"}</h1>
                        <MarkdownPreviewer _previewOnly={true} _text={page?.content ?? ""} _minRows={8} />
                    </div>

                    <footer className="grant-instructions-footer no-print">
                        <p>
                            Ready to apply? <Link to="/login">Log in</Link> or{" "}
                            <Link to="/create-account-menu">create an account</Link>.
                        </p>
                        <p>
                            Other grants:{" "}
                            {otherGrants.map((link, index) => (
                                <span key={link.slug}>
                                    {index > 0 && " · "}
                                    <Link to={`/grants/${link.slug}`}>{link.label}</Link>
                                </span>
                            ))}
                        </p>
                    </footer>
                </>
            )}
        </div>
    );
}

export default GrantInstructions;
