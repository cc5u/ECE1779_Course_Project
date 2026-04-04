import { createBrowserRouter } from "react-router";
import { ProtectedRoute, PublicOnlyRoute } from "./components/AuthRoute";
import Login from "./pages/Login";
import Register from "./pages/Register";
import { Home } from "./pages/Home";
import LegacySettingsRedirect from "./pages/LegacySettingsRedirect";
import Messages from "./pages/Messages";
import MyReports from "./pages/MyReports";
import ReportLostItem from "./pages/ReportLostItem";

export const router = createBrowserRouter([
    {
        Component: PublicOnlyRoute,
        children: [
            {
                path: "/",
                Component: Login,
            },
            {
                path: "/login",
                Component: Login,
            },
            {
                path: "/register",
                Component: Register,
            },
        ],
    },
    {
        path: "/home",
        Component: Home,
    },
    {
        Component: ProtectedRoute,
        children: [
            {
                path: "/report",
                Component: ReportLostItem,
            },
            {
                path: "/reports",
                Component: MyReports,
            },
            {
                path: "/messages",
                Component: Messages,
            },
            {
                path: "/settings",
                Component: LegacySettingsRedirect,
            }
        ],
    },
]);
