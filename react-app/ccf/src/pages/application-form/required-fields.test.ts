import { isMissing, getFieldDisplayName } from "./required-fields";
import { SIGNATURE_REQUIRED_FIELDS } from "./signature-fields";

describe("isMissing", () => {
    test("treats an unchecked attestation box as missing", () => {
        expect(isMissing(false)).toBe(true);
        expect(isMissing(true)).toBe(false);
    });

    test("treats blank and unset values as missing", () => {
        expect(isMissing("")).toBe(true);
        expect(isMissing("   ")).toBe(true);
        expect(isMissing(null)).toBe(true);
        expect(isMissing(undefined)).toBe(true);
    });

    test("accepts filled-in values", () => {
        expect(isMissing("Jane Doe")).toBe(false);
        expect(isMissing("2026-08-26")).toBe(false);
        expect(isMissing(new File(["pdf"], "proposal.pdf"))).toBe(false);
    });
});

describe("getFieldDisplayName", () => {
    test("names every signature field for the missing-fields modal", () => {
        expect(SIGNATURE_REQUIRED_FIELDS.map(getFieldDisplayName)).toEqual([
            'Signature — Principal Investigator Full Name',
            'Signature — Principal Investigator Title',
            'Signature — Principal Investigator Institution',
            'Signature — Principal Investigator Date',
            'Signature — Principal Investigator "I Agree"',
            'Signature — Department Head Full Name',
            'Signature — Department Head Title',
            'Signature — Department Head Institution',
            'Signature — Department Head Date',
            'Signature — Department Head "I Agree"',
        ]);
    });

    test("keeps the existing labels for other fields", () => {
        expect(getFieldDisplayName("file")).toBe("PDF Upload");
        expect(getFieldDisplayName("einNumber")).toBe("Ein Number");
        expect(getFieldDisplayName("typesOfCancerAddressed")).toBe("Types Of Cancer Addressed");
    });
});
