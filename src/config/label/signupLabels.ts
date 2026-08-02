export const SIGNUP_LABELS = {
  HEADING: "Create your organization",
  SUBHEADING: "Set up your EleMed workspace and choose your modules.",

  ORG_NAME_LABEL: "Organization name",
  ORG_NAME_PLACEHOLDER: "Enter your organization name",
  FIRST_NAME_LABEL: "First name",
  FIRST_NAME_PLACEHOLDER: "Enter your first name",
  LAST_NAME_LABEL: "Last name",
  LAST_NAME_PLACEHOLDER: "Enter your last name",
  USERNAME_LABEL: "Username",
  USERNAME_PLACEHOLDER: "Choose a username",
  EMAIL_LABEL: "Email",
  EMAIL_PLACEHOLDER: "Enter your email",
  PASSWORD_LABEL: "Password",
  PASSWORD_PLACEHOLDER: "••••••••",

  MODULES_LABEL: "Modules",
  MODULES_HINT: "Pharmacy is always included. Add more modules below.",
  MODULE_DEFAULT_TAG: "Included",

  SIGNUP_BUTTON: "Create account",
  SIGNUP_BUTTON_LOADING: "Creating account...",

  SIGNIN_QUESTION: "Already have an account?",
  SIGNIN_LINK: "Back to sign in",

  SUCCESS_MESSAGE: "Account created successfully!",
  ERROR_DEFAULT: "Could not create your account. Please try again.",

  VALIDATION: {
    REQUIRED: (field: string) => `${field} is required`,
    EMAIL_INVALID: "Please enter a valid email address.",
    PASSWORD_MIN: "Password must be at least 8 characters.",
  },
};
