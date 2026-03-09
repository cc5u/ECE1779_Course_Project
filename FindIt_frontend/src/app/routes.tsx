import { createBrowserRouter } from "react-router";
import Login from "./pages/Login";
import Register from "./pages/Register";
import { Home } from "./pages/Home";

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
    }
]);