import { Alert, LoadingOverlay } from "ice-ds";
import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router";

import { useCurrentUser, useNextPath } from "../features/auth/api";
import { ApiError } from "../lib/api";

function isSignedOut(error: unknown): boolean {
  return error instanceof ApiError && (error.status === 401 || error.status === 403);
}

interface AuthGateProps {
  children: ReactNode;
  /** Shown to signed-out visitors instead of redirecting them to /login. */
  signedOut?: ReactNode;
}

/** Renders children for signed-in users; sends everyone else to /login (or `signedOut`). */
export function AuthGate({ children, signedOut }: AuthGateProps) {
  const { data: user, error, isPending } = useCurrentUser();
  const { pathname, search } = useLocation();

  if (isPending) return <LoadingOverlay label="Loading…" />;

  if (isSignedOut(error)) {
    if (signedOut) return <>{signedOut}</>;
    const here = `${pathname}${search}`;
    return <Navigate to={`/login?next=${encodeURIComponent(here)}`} replace />;
  }

  if (error || !user) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20">
        <Alert intent="error" title="Can't reach the ScopeGuard API">
          Is the Django container running? ({error?.message ?? "No user returned"})
        </Alert>
      </div>
    );
  }

  return <>{children}</>;
}

/** Login/signup pages: signed-in users skip straight to where they were going. */
export function GuestGate({ children }: { children: ReactNode }) {
  const { data: user, error, isPending } = useCurrentUser();
  const next = useNextPath();

  if (isPending) return <LoadingOverlay label="Loading…" />;
  if (user && !error) return <Navigate to={next} replace />;
  return <>{children}</>;
}
