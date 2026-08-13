import { getSubmitErrorToast } from "./submit-error-messages";

describe("getSubmitErrorToast", () => {
    test("applications closed", () => {
        expect(getSubmitErrorToast("Applications are currently closed")).toBe(
            "Applications are currently closed. Please check back later."
        );
    });

    test("already submitted", () => {
        expect(getSubmitErrorToast("You have already submitted an application")).toBe(
            "You have already submitted an application for this grant type."
        );
    });

    test("deadline passed", () => {
        expect(getSubmitErrorToast("Deadline for research applications has passed")).toBe(
            "The deadline for this application type has passed."
        );
    });

    test("non-PDF file", () => {
        expect(getSubmitErrorToast("Only PDF files are allowed")).toBe(
            "Please upload a PDF file."
        );
    });

    test("file too large", () => {
        expect(getSubmitErrorToast("File size exceeds 50MB limit")).toBe(
            "File size exceeds 50MB limit. Please upload a smaller file."
        );
    });

    test("invalid application data", () => {
        expect(getSubmitErrorToast("Invalid application data: Title is required")).toBe(
            "Please check your application data and try again."
        );
    });

    test("unrecognized message falls through as-is", () => {
        expect(getSubmitErrorToast("Something specific went wrong")).toBe(
            "Something specific went wrong"
        );
    });

    test("missing message uses the generic fallback", () => {
        expect(getSubmitErrorToast(undefined)).toBe(
            "Failed to submit application. Please try again."
        );
        expect(getSubmitErrorToast("")).toBe(
            "Failed to submit application. Please try again."
        );
    });
});
