import React, { useState } from "react";
import {
  Box,
  Button,
  TextField,
  Typography,
  IconButton,
  InputAdornment,
  Checkbox,
  Alert,
  Snackbar,
} from "@mui/material";
import { Link, useNavigate } from "react-router-dom";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import { useDispatch } from "react-redux";

import { useSignupMutation, setCredentials } from "../../redux/slices/authSlice";
import { setOrgContext } from "../../redux/slices/orgSlice";
import { MODULES, ALL_MODULE_KEYS, ModuleKey } from "../../config/modules.config";
import { SIGNUP_LABELS } from "../../config/label/signupLabels";
import { SIGNUP_CONSTANTS } from "../../config/constants/signupConstants";
import { extractErrorMessage } from "../../utils/errorUtils";
import bgWhiteIcon from "../../assets/BG_White.svg";

const REQUIRED_MODULE = SIGNUP_CONSTANTS.REQUIRED_MODULE_KEY;

// Shared field styling, mirrored from LogInLeft.tsx so the inputs are pixel-identical.
const fieldSx = {
  mb: "1.5rem",
  "& .MuiInputBase-root": {
    color: "#1A212B",
    borderRadius: "0.75rem",
    height: "3.0625rem",
    "& fieldset": { borderColor: "#9AA8BC" },
    "&:hover fieldset": { borderColor: "#9AA8BC" },
    "&.Mui-focused fieldset": { borderColor: "#5C17E5", outline: "none" },
    "&.Mui-focused": { outline: "none" },
  },
  "& .MuiOutlinedInput-root": {
    "&.Mui-focused": { outline: "none" },
  },
} as const;

const fieldLabelSx = {
  fontSize: "0.75rem",
  fontWeight: 400,
  mb: "0.25rem",
  color: "#728197",
} as const;

interface FormState {
  org_name: string;
  first_name: string;
  last_name: string;
  username: string;
  email: string;
  password: string;
}

type FormErrors = Partial<Record<keyof FormState, string>>;

const SignUp: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [form, setForm] = useState<FormState>({
    org_name: "",
    first_name: "",
    last_name: "",
    username: "",
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  // pharmacy is always included (locked); inpatient and future modules are opt-in.
  const [optionalModules, setOptionalModules] = useState<Set<ModuleKey>>(new Set());
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error">("error");

  const [signup, { isLoading }] = useSignupMutation();

  const setField = (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const toggleModule = (key: ModuleKey) =>
    setOptionalModules((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });

  const validate = (): boolean => {
    const { VALIDATION } = SIGNUP_LABELS;
    const next: FormErrors = {};
    if (!form.org_name.trim()) next.org_name = VALIDATION.REQUIRED(SIGNUP_LABELS.ORG_NAME_LABEL);
    if (!form.first_name.trim()) next.first_name = VALIDATION.REQUIRED(SIGNUP_LABELS.FIRST_NAME_LABEL);
    if (!form.last_name.trim()) next.last_name = VALIDATION.REQUIRED(SIGNUP_LABELS.LAST_NAME_LABEL);
    if (!form.username.trim()) next.username = VALIDATION.REQUIRED(SIGNUP_LABELS.USERNAME_LABEL);
    if (!form.email.trim()) next.email = VALIDATION.REQUIRED(SIGNUP_LABELS.EMAIL_LABEL);
    else if (!SIGNUP_CONSTANTS.EMAIL_REGEX.test(form.email.trim()))
      next.email = VALIDATION.EMAIL_INVALID;
    if (!form.password) next.password = VALIDATION.REQUIRED(SIGNUP_LABELS.PASSWORD_LABEL);
    else if (form.password.length < SIGNUP_CONSTANTS.PASSWORD_MIN_LENGTH)
      next.password = VALIDATION.PASSWORD_MIN;
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validate()) return;

    // pharmacy is always sent; optional modules are appended.
    const modules = [REQUIRED_MODULE, ...Array.from(optionalModules)];

    try {
      const response = await signup({
        org_name: form.org_name.trim(),
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        username: form.username.trim(),
        email: form.email.trim(),
        password: form.password,
        modules,
      }).unwrap();

      const { token, user, organization } = response;

      // Authenticate, then seed org context immediately so the sidebar/guards and
      // the launcher are correct without waiting for the /me round-trip.
      dispatch(setCredentials({ token, user }));
      dispatch(
        setOrgContext({
          organization,
          activeModules: modules,
          orgRole: (user.org_role as any) ?? null,
          moduleRoles: (user as any).module_roles ?? {},
          canManageRoles: (user as any).can_manage_roles ?? false,
        }),
      );

      // Land on the launcher, which routes the user to whatever area(s) they can access.
      navigate("/home");
    } catch (err) {
      setSnackbarMessage(extractErrorMessage(err, SIGNUP_LABELS.ERROR_DEFAULT));
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    }
  };

  return (
    <Box
      sx={{
        fontFamily: "'Lexend', sans-serif",
        display: "flex",
        flexDirection: "column",
        width: "100%",
        maxWidth: "100%",
        alignItems: "center",
        marginTop: "0.5rem",
      }}
    >
      {/* Branding — matches the login page */}
      <Box
        sx={{
          mb: "1.5rem",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          width: { xs: "100%", sm: "400px" },
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: "0.5rem", mb: "0.5rem" }}>
          <img src={bgWhiteIcon} alt="Logo" style={{ height: "100px", width: "auto" }} />
          <Typography
            sx={{
              fontFamily: "'Lexend', sans-serif",
              fontWeight: 700,
              fontSize: "1.7rem",
              lineHeight: "1.1",
              color: "#1A212B",
              whiteSpace: "nowrap",
            }}
          >
            Elite  Pharmacy
          </Typography>
        </Box>
        <Typography sx={{ fontWeight: 700, fontSize: "1.25rem", color: "#1A212B" }}>
          {SIGNUP_LABELS.HEADING}
        </Typography>
        <Typography sx={{ fontSize: "0.875rem", color: "#728197", mt: "0.25rem" }}>
          {SIGNUP_LABELS.SUBHEADING}
        </Typography>
      </Box>

      <Box
        component="form"
        noValidate
        onSubmit={handleSubmit}
        sx={{ display: "flex", flexDirection: "column", width: { xs: "100%", sm: "400px" } }}
      >
        {/* Organization name */}
        <Typography sx={fieldLabelSx}>{SIGNUP_LABELS.ORG_NAME_LABEL}</Typography>
        <TextField
          placeholder={SIGNUP_LABELS.ORG_NAME_PLACEHOLDER}
          type="text"
          fullWidth
          size={SIGNUP_CONSTANTS.INPUT_SIZE}
          value={form.org_name}
          onChange={setField("org_name")}
          error={!!errors.org_name}
          helperText={errors.org_name}
          autoComplete="organization"
          sx={fieldSx}
        />

        {/* First & last name */}
        <Box sx={{ display: "flex", gap: "1rem" }}>
          <Box sx={{ flex: 1 }}>
            <Typography sx={fieldLabelSx}>{SIGNUP_LABELS.FIRST_NAME_LABEL}</Typography>
            <TextField
              placeholder={SIGNUP_LABELS.FIRST_NAME_PLACEHOLDER}
              type="text"
              fullWidth
              size={SIGNUP_CONSTANTS.INPUT_SIZE}
              value={form.first_name}
              onChange={setField("first_name")}
              error={!!errors.first_name}
              helperText={errors.first_name}
              autoComplete="given-name"
              sx={fieldSx}
            />
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography sx={fieldLabelSx}>{SIGNUP_LABELS.LAST_NAME_LABEL}</Typography>
            <TextField
              placeholder={SIGNUP_LABELS.LAST_NAME_PLACEHOLDER}
              type="text"
              fullWidth
              size={SIGNUP_CONSTANTS.INPUT_SIZE}
              value={form.last_name}
              onChange={setField("last_name")}
              error={!!errors.last_name}
              helperText={errors.last_name}
              autoComplete="family-name"
              sx={fieldSx}
            />
          </Box>
        </Box>

        {/* Username */}
        <Typography sx={fieldLabelSx}>{SIGNUP_LABELS.USERNAME_LABEL}</Typography>
        <TextField
          placeholder={SIGNUP_LABELS.USERNAME_PLACEHOLDER}
          type="text"
          fullWidth
          size={SIGNUP_CONSTANTS.INPUT_SIZE}
          value={form.username}
          onChange={setField("username")}
          error={!!errors.username}
          helperText={errors.username}
          autoComplete="username"
          sx={fieldSx}
        />

        {/* Email */}
        <Typography sx={fieldLabelSx}>{SIGNUP_LABELS.EMAIL_LABEL}</Typography>
        <TextField
          placeholder={SIGNUP_LABELS.EMAIL_PLACEHOLDER}
          type="email"
          fullWidth
          size={SIGNUP_CONSTANTS.INPUT_SIZE}
          value={form.email}
          onChange={setField("email")}
          error={!!errors.email}
          helperText={errors.email}
          autoComplete="email"
          sx={fieldSx}
        />

        {/* Password */}
        <Typography sx={fieldLabelSx}>{SIGNUP_LABELS.PASSWORD_LABEL}</Typography>
        <TextField
          placeholder={SIGNUP_LABELS.PASSWORD_PLACEHOLDER}
          type={showPassword ? "text" : "password"}
          fullWidth
          size={SIGNUP_CONSTANTS.INPUT_SIZE}
          value={form.password}
          onChange={setField("password")}
          error={!!errors.password}
          helperText={errors.password}
          autoComplete="new-password"
          sx={{
            ...fieldSx,
            "& input::-ms-reveal, & input::-ms-clear": { display: "none" },
          }}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={() => setShowPassword((p) => !p)} edge="end">
                  {showPassword ? <Visibility /> : <VisibilityOff />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />

        {/* Module selection */}
        <Typography sx={{ ...fieldLabelSx, mb: "0.5rem", fontSize: "0.875rem", fontWeight: 600, color: "#1A212B" }}>
          {SIGNUP_LABELS.MODULES_LABEL}
        </Typography>
        <Typography sx={{ fontSize: "0.75rem", color: "#728197", mb: "0.75rem" }}>
          {SIGNUP_LABELS.MODULES_HINT}
        </Typography>
        <Box sx={{ display: "flex", flexDirection: "column", gap: "0.75rem", mb: "1.5rem" }}>
          {ALL_MODULE_KEYS.map((key) => {
            const mod = MODULES[key];
            const isRequired = key === REQUIRED_MODULE;
            const checked = isRequired || optionalModules.has(key);
            return (
              <Box
                key={key}
                onClick={() => !isRequired && toggleModule(key)}
                sx={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "0.5rem",
                  p: "0.75rem 1rem",
                  border: `1px solid ${checked ? "#5C17E5" : "#9AA8BC"}`,
                  borderRadius: "0.75rem",
                  cursor: isRequired ? "default" : "pointer",
                  backgroundColor: checked ? "rgba(92, 23, 229, 0.04)" : "transparent",
                  transition: "border-color 0.15s, background-color 0.15s",
                }}
              >
                <Checkbox
                  checked={checked}
                  disabled={isRequired}
                  onClick={(e) => e.stopPropagation()}
                  onChange={() => toggleModule(key)}
                  disableRipple
                  sx={{
                    p: 0,
                    color: "#9AA8BC",
                    "&.Mui-checked": { color: "#5C17E5" },
                    "&.Mui-disabled": { color: "#5C17E5" },
                  }}
                />
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <Typography sx={{ fontSize: "0.875rem", fontWeight: 600, color: "#1A212B" }}>
                      {mod.label}
                    </Typography>
                    {isRequired && (
                      <Typography
                        sx={{
                          fontSize: "0.625rem",
                          fontWeight: 600,
                          color: "#5C17E5",
                          backgroundColor: "rgba(92, 23, 229, 0.1)",
                          borderRadius: "0.5rem",
                          px: "0.5rem",
                          py: "0.125rem",
                        }}
                      >
                        {SIGNUP_LABELS.MODULE_DEFAULT_TAG}
                      </Typography>
                    )}
                  </Box>
                  <Typography sx={{ fontSize: "0.75rem", color: "#728197", mt: "0.125rem" }}>
                    {mod.description}
                  </Typography>
                </Box>
              </Box>
            );
          })}
        </Box>

        {/* Submit */}
        <Button
          type="submit"
          variant="contained"
          disabled={isLoading}
          disableRipple
          sx={{
            height: "3.5rem",
            textTransform: "none",
            bgcolor: "#5C17E5",
            borderRadius: "0.75rem",
            fontSize: "1rem",
            boxShadow: "none",
            "&:hover": { bgcolor: "#5C17E5", boxShadow: "none" },
          }}
        >
          {isLoading ? SIGNUP_LABELS.SIGNUP_BUTTON_LOADING : SIGNUP_LABELS.SIGNUP_BUTTON}
        </Button>

        {/* Back to sign in */}
        <Box sx={{ mt: "1.5rem", display: "flex", justifyContent: "center", gap: "0.375rem" }}>
          <Typography sx={{ fontSize: "0.875rem", color: "#728197" }}>
            {SIGNUP_LABELS.SIGNIN_QUESTION}
          </Typography>
          <Link to="/" style={{ textDecoration: "none" }}>
            <Typography sx={{ fontSize: "0.875rem", fontWeight: 600, color: "#5C17E5", cursor: "pointer" }}>
              {SIGNUP_LABELS.SIGNIN_LINK}
            </Typography>
          </Link>
        </Box>
      </Box>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={SIGNUP_CONSTANTS.SNACKBAR_AUTO_HIDE}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert onClose={() => setSnackbarOpen(false)} severity={snackbarSeverity}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SignUp;
