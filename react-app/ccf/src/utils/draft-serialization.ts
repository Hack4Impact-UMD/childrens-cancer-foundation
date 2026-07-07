/**
 * Prepares application form state for a Firestore draft write.
 * Firestore rejects non-plain values (File, Blob, class instances) and
 * `undefined`; the form keeps the selected PDF as a File in `formData.file`,
 * which must never be sent to Firestore.
 */
export const toDraftDocData = (formData: Record<string, any>): Record<string, any> => {
    const out: Record<string, any> = {};
    for (const [key, value] of Object.entries(formData)) {
        if (key === 'file') continue;
        if (value === undefined) continue;
        if (typeof File !== 'undefined' && value instanceof File) continue;
        if (typeof Blob !== 'undefined' && value instanceof Blob) continue;
        out[key] = value;
    }
    return out;
};
