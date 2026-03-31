import { createBrowserRouter } from "react-router";
import Login from "./pages/Login";
import Register from "./pages/Register";
import { Home } from "./pages/Home";
import ReportLostItem from "./pages/ReportLostItem";
import Settings from "./pages/Setting";

export const router = createBrowserRouter([
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
    {
        path: "/home",
        Component: Home,
    },
    {
        path: "/report",
        Component: ReportLostItem,
    },
    {
        path: "/settings",
        Component: Settings,
    },
]);