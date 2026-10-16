import { LoadingOverlay } from "ice-ds";
import { lazy, Suspense, type ReactNode } from "react";
import { createBrowserRouter } from "react-router";

import { AppShell } from "../components/AppShell";
import { AuthGate, GuestGate } from "../components/AuthGate";

const DashboardPage = lazy(() => import("../pages/DashboardPage"));
const NewContractPage = lazy(() => import("../pages/NewContractPage"));
const ContractPage = lazy(() => import("../pages/ContractPage"));
const NotFoundPage = lazy(() => import("../pages/NotFoundPage"));
const LandingPage = lazy(() => import("../pages/LandingPage"));
const LoginPage = lazy(() => import("../pages/LoginPage"));
const SignupPage = lazy(() => import("../pages/SignupPage"));
const VerifyEmailPage = lazy(() => import("../pages/VerifyEmailPage"));
const ForgotPasswordPage = lazy(() => import("../pages/ForgotPasswordPage"));
const ResetPasswordPage = lazy(() => import("../pages/ResetPasswordPage"));

function page(element: ReactNode) {
  return <Suspense fallback={<LoadingOverlay label="Loading…" />}>{element}</Suspense>;
}

function guestPage(element: ReactNode) {
  return page(<GuestGate>{element}</GuestGate>);
}

export const router = createBrowserRouter([
  // Signed-out visitors get the landing page at /, signed-in users their dashboard.
  {
    path: "/",
    element: page(
      <AuthGate signedOut={<LandingPage />}>
        <AppShell>
          <DashboardPage />
        </AppShell>
      </AuthGate>,
    ),
  },
  { path: "/login", element: guestPage(<LoginPage />) },
  { path: "/signup", element: guestPage(<SignupPage />) },
  { path: "/password/reset", element: guestPage(<ForgotPasswordPage />) },
  { path: "/password/reset/:key", element: guestPage(<ResetPasswordPage />) },
  // Not guest-only: a signed-in user may confirm an address too.
  { path: "/verify-email/:key", element: page(<VerifyEmailPage />) },
  {
    element: (
      <AuthGate>
        <AppShell />
      </AuthGate>
    ),
    children: [
      { path: "/contracts/new", element: page(<NewContractPage />) },
      { path: "/contracts/:slug", element: page(<ContractPage />) },
      { path: "*", element: page(<NotFoundPage />) },
    ],
  },
]);
