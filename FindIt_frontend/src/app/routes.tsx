import { createBrowserRouter } from "react-router";
import Home from "./pages/Home";
import ReportLostItem from "./pages/ReportLostItem";
import ReportDetail from "./pages/ReportDetail";
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
    path: "/home",
    Component: Home,
  },
  {
    path: "/report",
    Component: ReportLostItem,
  },
  {
    path: "/report/:id",
    Component: ReportDetail,
  },
  {
    path: "/register",
    Component: Register,
  },
]);