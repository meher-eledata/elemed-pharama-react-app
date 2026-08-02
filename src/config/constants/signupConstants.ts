export const SIGNUP_CONSTANTS = {
  SNACKBAR_AUTO_HIDE: 6000,
  INPUT_SIZE: "small" as const,
  PASSWORD_MIN_LENGTH: 8,
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  // pharmacy is the core app — always enabled and not removable at signup.
  REQUIRED_MODULE_KEY: "pharmacy" as const,
};
