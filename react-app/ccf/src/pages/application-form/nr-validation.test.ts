import {
    getNRInvalidSections,
    NR_MY_INFORMATION,
    NR_NARRATIVE,
} from "./nr-validation";

const completeForm = () => ({
    title: "Family Support Program",
    requestor: "Jane Doe",
    institution: "Johns Hopkins Medicine",
    institutionPhoneNumber: "4435464479",
    institutionEmail: "info@childrenscancerfoundation.org",
    explanation: "Why we need it",
    sources: "Other funders",
    amountRequested: "5000",
    timeframe: "Jan 2026 - Dec 2026",
    additionalInfo: "",
    file: new File(["pdf"], "proposal.pdf"),
});

describe("getNRInvalidSections", () => {
    test("no issues for a complete form", () => {
        expect(getNRInvalidSections(completeForm())).toEqual({});
    });

    test("My Information page is not blocked by Narrative fields", () => {
        const formData = { ...completeForm(), amountRequested: "", timeframe: "", file: null };
        expect(getNRInvalidSections(formData, [NR_MY_INFORMATION])).toEqual({});
    });

    test("reports only the fields rendered on the requested page", () => {
        const formData = { ...completeForm(), title: "", amountRequested: "" };
        expect(getNRInvalidSections(formData, [NR_MY_INFORMATION])).toEqual({
            [NR_MY_INFORMATION]: ["Title is required"],
        });
        expect(getNRInvalidSections(formData, [NR_NARRATIVE])).toEqual({
            [NR_NARRATIVE]: ["Amount Requested is required"],
        });
    });

    test("groups missing fields under the page that renders them", () => {
        const formData = { ...completeForm(), requestor: "", timeframe: "", file: null };
        expect(getNRInvalidSections(formData)).toEqual({
            [NR_MY_INFORMATION]: ["Principal Requestor is required"],
            [NR_NARRATIVE]: ["Timeframe is required", "File is required"],
        });
    });

    test("flags a malformed email and phone number", () => {
        const formData = {
            ...completeForm(),
            institutionEmail: "not-an-email",
            institutionPhoneNumber: "443-546-4479",
        };
        const invalid = getNRInvalidSections(formData)[NR_MY_INFORMATION];
        expect(invalid).toContain("Invalid email format");
        expect(invalid?.some((m) => m.startsWith("Invalid phone number format"))).toBe(true);
    });

    test("flags a non-positive amount requested under Narrative", () => {
        expect(getNRInvalidSections({ ...completeForm(), amountRequested: "0" })).toEqual({
            [NR_NARRATIVE]: ["Amount requested must be a valid positive number"],
        });
        expect(getNRInvalidSections({ ...completeForm(), amountRequested: "abc" })).toEqual({
            [NR_NARRATIVE]: ["Amount requested must be a valid positive number"],
        });
    });
});
