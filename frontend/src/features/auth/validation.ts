export type FieldErrors = Record<string, string>;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// These rules mirror the backend (Zod) rules, so users get instant feedback.
// The server still validates everything again.
const checkEmail = (email: string, errors: FieldErrors) => {
  if (!EMAIL.test(email.trim())) errors.email = "Enter a valid email address";
};

export function validateLogin(email: string, password: string): FieldErrors {
  const errors: FieldErrors = {};
  checkEmail(email, errors);
  if (!password) errors.password = "Password is required";
  return errors;
}

export function validateRegister(name: string, email: string, password: string): FieldErrors {
  const errors: FieldErrors = {};
  const trimmed = name.trim();
  if (trimmed.length < 2) errors.name = "Name must be at least 2 characters";
  else if (trimmed.length > 100) errors.name = "Name must be at most 100 characters";
  checkEmail(email, errors);
  if (password.length < 8) errors.password = "Password must be at least 8 characters";
  else if (password.length > 72) errors.password = "Password must be at most 72 characters";
  else if (!/^(?=.*[A-Za-z])(?=.*\d).+$/.test(password)) {
    errors.password = "Password must contain a letter and a number";
  }
  return errors;
}
