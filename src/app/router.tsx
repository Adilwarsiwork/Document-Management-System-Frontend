import { createBrowserRouter, Navigate, Outlet } from "react-router-dom";

import AppLayout from "../AppLayout";
import LoginPage from "../pages/login/LoginPage";
import DashboardPage from "../pages/dashboard/DashboardPage";
import UserCreate from "../pages/user_create/UserCreate";

function ProtectedRoute() {
  const token = sessionStorage.getItem("dms_token");

  return token ? <Outlet /> : <Navigate to="/login" replace />;
}

function MainLayout() {
  return (
    <AppLayout>
      <Outlet />
    </AppLayout>
  );
}

export const router = createBrowserRouter([
  {
    element: <MainLayout />,
    children: [
      {
        path: "/login",
        element: <LoginPage />,
      },
      {
        path: "register",
        element: <UserCreate />,
      },
      {
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
    element: <Navigate to="/login" replace />,
  },
]);
