import { Navigate, useLocation } from "react-router";

export default function LegacySettingsRedirect() {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const tab = searchParams.get("tab");

  if (tab === "reports") {
    return <Navigate to="/reports" replace />;
  }

  if (tab === "messages") {
    return <Navigate to="/messages" replace />;
  }

  return <Navigate to="/home" replace />;
}
