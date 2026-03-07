import { createBrowserRouter } from "react-router";
import Login from "./pages/Login";
import Register from "./pages/Register";

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
    }
]);