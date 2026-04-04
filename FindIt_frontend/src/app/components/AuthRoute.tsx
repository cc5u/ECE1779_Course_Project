import { Navigate, Outlet, useLocation } from "react-router";
import { useAuth } from "../lib/auth";
import { buildAuthRedirectState, getPostAuthRedirectPath } from "../lib/auth-routing";

export function ProtectedRoute() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
        state={buildAuthRedirectState(location)}
      />
    );
  }

  return <Outlet />;
}

export function PublicOnlyRoute() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (isAuthenticated) {
    return <Navigate to={getPostAuthRedirectPath(location.state)} replace />;
  }

  return <Outlet />;
}
