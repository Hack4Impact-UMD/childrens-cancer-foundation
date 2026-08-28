import { useEffect, useState } from 'react';
import { getVersion } from '../../backend/form-template-service';
import { getSeedTemplate } from '../../form-templates/seed';
import { needsSeedFallback } from '../../form-templates/viewer';
import { FormLike } from '../../form-templates/engine';
import { GrantType } from '../../types/form-template-types';

interface ApplicationLike {
    grantType?: string;
    formTemplateId?: string;
    formVersion?: number;
}

/**
 * The form an application should be displayed against.
 *
 * An application submitted after the builder existed carries the template and
 * version it was filled in under, and that exact version is fetched — so a
 * 2027 application keeps its 2027 wording however much the form changes
 * afterwards. Anything older, or anything whose version cannot be loaded,
 * falls back to the seeded form, which is what those applications were
 * actually filled in against.
 */
export function useApplicationForm(application: ApplicationLike | undefined): FormLike | null {
    const grantType = (application?.grantType as GrantType) || 'research';
    const [form, setForm] = useState<FormLike | null>(() =>
        application ? getSeedTemplate(grantType) : null
    );

    const templateId = application?.formTemplateId;
    const version = application?.formVersion;

    useEffect(() => {
        if (!application) {
            setForm(null);
            return;
        }
        if (needsSeedFallback({ formTemplateId: templateId, formVersion: version })) {
            setForm(getSeedTemplate(grantType));
            return;
        }

        let active = true;
        getVersion(templateId!, version!)
            .then((published) => {
                if (!active) return;
                // A missing version should never blank the page; the seed is a
                // closer approximation than nothing.
                setForm(published ?? getSeedTemplate(grantType));
            })
            .catch((error) => {
                console.error('Error loading the form version for this application:', error);
                if (active) setForm(getSeedTemplate(grantType));
            });

        return () => { active = false; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [templateId, version, grantType, Boolean(application)]);

    return form;
}
