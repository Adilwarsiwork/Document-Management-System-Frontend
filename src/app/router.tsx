import { createBrowserRouter } from "react-router-dom";

import LoginPage from "../pages/login/LoginPage";
import DashboardPage from "../pages/dashboard/DashboardPage";
import UserCreate from "../pages/user_create/UserCreate";
import {
  FallbackRoute,
  GuestRoute,
  MainLayout,
  ProtectedRoute,
} from "./route-elements";

export const router = createBrowserRouter([
  {
    element: <MainLayout />,
    children: [
      {
        // Login and register are reachable only while logged out.
        element: <GuestRoute />,
        children: [
          {
            path: "/login",
            element: <LoginPage />,
          },
          {
            path: "register",
            element: <UserCreate />,
          },
        ],
      },
      {
        // Everything below needs a valid session token.
        element: <ProtectedRoute />,
        children: [
          {
            path: "/dashboard",
            element: <DashboardPage />,
          },
        ],
      },
    ],
  },
  {
    path: "*",
    element: <FallbackRoute />,
  },
]);
