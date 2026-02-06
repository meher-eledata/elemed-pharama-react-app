import { NavigateFunction } from "react-router-dom";
import { AppDispatch } from "../../redux/store"; // adjust path to your store
import { setCredentials } from "../../redux/slices/authSlice";
import { LOGIN_LABELS } from "../label/loginLabels";
import { LOGIN_CONSTANTS } from "../constants/loginConstants";

interface HandleLoginEffectParams {
  isSuccess: boolean;
  isError: boolean;
  data?: any;
  error?: any;
  dispatch: AppDispatch;
  navigate: NavigateFunction;
  setSnackbarMessage: (msg: string) => void;
  setSnackbarSeverity: (severity: "success" | "error") => void;
  setSnackbarOpen: (open: boolean) => void;
}

export const handleLoginEffect = ({
  isSuccess,
  isError,
  data,
  error,
  dispatch,
  navigate,
  setSnackbarMessage,
  setSnackbarSeverity,
  setSnackbarOpen,
}: HandleLoginEffectParams) => {
  if (isSuccess && data) {
    dispatch(setCredentials(data));
    setSnackbarMessage(LOGIN_LABELS.SUCCESS_MESSAGE);
    setSnackbarSeverity("success");
    setSnackbarOpen(true);

    const userRole = data?.user?.role;
    const isAdmin =
      userRole === 0 ||
      userRole === '0' ||
      String(userRole).toLowerCase() === 'admin';

    if (isAdmin) {
      navigate("/admin");
    } else {
      navigate("/dashboard");
    }

    return;
  }

  if (isError) {
    let errorMessage = LOGIN_LABELS.ERROR_DEFAULT;

    if (error && "status" in error) {
      if (error.status === 401) {
        errorMessage = LOGIN_LABELS.ERROR_INVALID_CREDENTIALS;
      } else if (error.status === 400 && (error.data as any)?.error) {
        errorMessage = (error.data as { error?: string }).error || LOGIN_LABELS.ERROR_DEFAULT;
      } else {
        errorMessage = `Error: ${error.status}`;
      }
    } else if (error && "message" in error) {
      errorMessage = (error as { message: string }).message;
    }

    setSnackbarMessage(errorMessage);
    setSnackbarSeverity("error");
    setSnackbarOpen(true);
  }
};
