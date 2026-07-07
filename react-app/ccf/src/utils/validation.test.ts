import {
    validateEmail,
    checkEmailCreateAcc,
    validatePhoneNumber,
    validateNonEmptyString,
    checkPasswordRequirements,
    validatePassword,
    validateInstitution,
} from "./validation";

describe("validateEmail", () => {
    test("returns null for a valid email", () => {
        expect(validateEmail("a@b.co")).toBeNull();
    });

    test("returns an error string for a value with no @", () => {
        expect(validateEmail("not-an-email")).toBe("Invalid email format.");
    });

    test("returns an error string for an email containing whitespace", () => {
        expect(validateEmail("a b@c.com")).toBe("Invalid email format.");
    });
});

describe("checkEmailCreateAcc", () => {
    test("accepts .com addresses", () => {
        expect(checkEmailCreateAcc("x@y.com")).toBe(true);
    });

    test("accepts .edu addresses", () => {
        expect(checkEmailCreateAcc("x@y.edu")).toBe(true);
    });

    test("accepts .org addresses case-insensitively", () => {
        expect(checkEmailCreateAcc("x@Y.ORG")).toBe(true);
    });

    test("rejects .net addresses", () => {
        expect(checkEmailCreateAcc("x@y.net")).toBe(false);
    });
});

describe("validatePhoneNumber", () => {
    test("returns null for exactly ten digits", () => {
        expect(validatePhoneNumber("1234567890")).toBeNull();
    });

    test("returns an error string for a dashed number", () => {
        expect(validatePhoneNumber("123-456-7890")).toBe(
            "Invalid phone number format: Please format phone numbers as XXXXXXXXXX (without parentheses or dashes)"
        );
    });

    test("returns an error string for too few digits", () => {
        expect(validatePhoneNumber("12345")).toBe(
            "Invalid phone number format: Please format phone numbers as XXXXXXXXXX (without parentheses or dashes)"
        );
    });
});

describe("validateNonEmptyString", () => {
    test("returns null for a non-empty string", () => {
        expect(validateNonEmptyString("a")).toBeNull();
    });

    test("returns an error string for an empty string", () => {
        expect(validateNonEmptyString("")).toBe("This field cannot be empty.");
    });

    test("returns an error string for whitespace only", () => {
        expect(validateNonEmptyString("   ")).toBe("This field cannot be empty.");
    });
});

describe("checkPasswordRequirements", () => {
    test("all four flags are true for a compliant password", () => {
        expect(checkPasswordRequirements("Passw0rd!")).toEqual({
            specialChar: true,
            capitalLetter: true,
            number: true,
            minLength: true,
        });
    });

    test("minLength is false at exactly 6 characters (current behavior: length > 6)", () => {
        expect(checkPasswordRequirements("Ab1!xx").minLength).toBe(false);
    });

    test("minLength is true at 7 characters", () => {
        expect(checkPasswordRequirements("Ab1!xxx").minLength).toBe(true);
    });
});

describe("validatePassword", () => {
    test("mirrors checkPasswordRequirements flags", () => {
        expect(validatePassword("Passw0rd!")).toEqual(
            checkPasswordRequirements("Passw0rd!")
        );
    });
});

describe("validateInstitution", () => {
    test("accepts 'Other'", () => {
        expect(validateInstitution("Other")).toBe(true);
    });

    test("accepts a listed institution", () => {
        expect(validateInstitution("Johns Hopkins Medicine")).toBe(true);
    });

    test("rejects an unlisted institution", () => {
        expect(validateInstitution("Unknown U")).toBe(false);
    });
});
