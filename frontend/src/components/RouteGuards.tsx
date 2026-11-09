import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../features/auth/useAuth";
import Spinner from "./Spinner";

// Pages for logged-in users only. Remembers where the user wanted to go.
export function ProtectedRoute() {
  const { user, initialized } = useAuth();
  const location = useLocation();

  // Until the first refresh attempt finishes, we don't know if there is a session
  if (!initialized) return <Spinner label="Restoring your session..." />;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  return <Outlet />;
}

// Login and register pages: logged-in users are sent away from them
export function PublicOnlyRoute() {
  const { user, initialized } = useAuth();
  const location = useLocation();

  if (!initialized) return <Spinner label="Restoring your session..." />;
  if (user) {
    const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname ?? "/";
    return <Navigate to={from} replace />;
  }
  return <Outlet />;
}
