// validating email
export const validateEmail = (email: string): string | null => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return "Invalid email format.";
  }
  return null;
};

// Check email for account creation
export const checkEmailCreateAcc = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.(com|edu|org)$/i;
  return emailRegex.test(email);
};

// validating phone number
export const validatePhoneNumber = (phone: string): string | null => {
  const phoneRegex = /^\+?[1-9]\d{1,14}$/;
  if (!phoneRegex.test(phone)) {
    return "Invalid phone number format.";
  }
  return null;
};

// validating strings
export const validateNonEmptyString = (str: string): string | null => {
  if (str.trim() === "") {
    return "This field cannot be empty.";
  }
  return null;
};

// Check password requirements
export const checkPasswordRequirements = (
  password: string
): {
  specialChar: boolean;
  capitalLetter: boolean;
  number: boolean;
  length: boolean;
} => {
  return {
    specialChar: /[\W_]/.test(password), // Checks for special character
    capitalLetter: /[A-Z]/.test(password), // Checks for capital letter
    number: /[0-9]/.test(password), // Checks for number
    length: password.length >= 6, // Checks for minimum 6 characters
  };
};

// Check if user input satisfies password requirements
export const validatePassword = (
  password: string
): {
  isValid: boolean;
  requirements: {
    specialChar: boolean;
    capitalLetter: boolean;
    number: boolean;
    length: boolean;
  };
} => {
  const requirements = checkPasswordRequirements(password);
  const isValid = Object.values(requirements).every(Boolean);
  return {
    isValid,
    requirements,
  };
};
