// Client-side mirrors of the backend's username and password rules (see backend authController)

export const USERNAME_HINT = '3–15 characters: letters, numbers and underscores';

export const isValidUsername = (username: string): boolean => /^[a-zA-Z0-9_]{3,15}$/.test(username.trim());

export interface PasswordRule {
  label: string;
  test: (password: string) => boolean;
}

export const PASSWORD_RULES: PasswordRule[] = [
  { label: 'At least 8 characters', test: (p) => p.length >= 8 },
  { label: 'An uppercase and a lowercase letter', test: (p) => /[a-z]/.test(p) && /[A-Z]/.test(p) },
  { label: 'A number', test: (p) => /\d/.test(p) },
  { label: 'A special character: ! @ # $ % ^ & *', test: (p) => /[!@#$%^&*]/.test(p) },
  { label: 'No spaces or other symbols', test: (p) => /^[A-Za-z\d!@#$%^&*]*$/.test(p) },
];

export const isValidPassword = (password: string): boolean => PASSWORD_RULES.every((rule) => rule.test(password));
