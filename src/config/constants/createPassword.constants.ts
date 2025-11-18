export const CREATE_PASSWORD_CONSTANTS = {
  // Password validation: 6 chars min, uppercase, number OR special character
  // Used for both reset password and create password flows
  PASSWORD_REGEX: /^(?=.*[A-Z])(?=.*[0-9!@#$%^&*(),.?":{}|<>]).{6,}$/,
};