import { LoadingOverlay } from "ice-ds";
import { lazy, Suspense, type ReactNode } from "react";
import { createBrowserRouter } from "react-router";

import { AppShell } from "../components/AppShell";
import { AuthGate } from "../components/AuthGate";

const DashboardPage = lazy(() => import("../pages/DashboardPage"));
const NewContractPage = lazy(() => import("../pages/NewContractPage"));
const ContractPage = lazy(() => import("../pages/ContractPage"));
const NotFoundPage = lazy(() => import("../pages/NotFoundPage"));

function page(element: ReactNode) {
  return <Suspense fallback={<LoadingOverlay label="Loading…" />}>{element}</Suspense>;
}

export const router = createBrowserRouter([
  {
    element: (
      <AuthGate>
        <AppShell />
      </AuthGate>
    ),
    children: [
      { path: "/", element: page(<DashboardPage />) },
      { path: "/contracts/new", element: page(<NewContractPage />) },
      { path: "/contracts/:slug", element: page(<ContractPage />) },
      { path: "*", element: page(<NotFoundPage />) },
    ],
  },
]);
