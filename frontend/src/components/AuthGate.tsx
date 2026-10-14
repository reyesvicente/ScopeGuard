import { Alert, Button, Card, CardDescription, CardTitle, LoadingOverlay } from "ice-ds";
import type { ReactNode } from "react";

import { LOGIN_URL, SIGNUP_URL, useCurrentUser } from "../features/auth/api";
import { ApiError } from "../lib/api";

export function AuthGate({ children }: { children: ReactNode }) {
  const { data: user, error, isPending } = useCurrentUser();

  if (isPending) return <LoadingOverlay label="Loading…" />;

  if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
    return (
      <div className="mx-auto flex max-w-lg flex-col gap-6 px-4 py-20">
        <h1 className="font-display text-5xl font-bold leading-none">Stop doing free work.</h1>
        <p className="text-lg">
          ScopeGuard checks client requests against your statement of work and drafts the change order
          for you — using an open-weight model.
        </p>
        <Card className="flex flex-col gap-4 p-6">
          <CardTitle>Get started</CardTitle>
          <CardDescription>Your contracts and client messages are never used for training.</CardDescription>
          <div className="flex gap-3">
            <a href={LOGIN_URL}>
              <Button type="button">Log in</Button>
            </a>
            <a href={SIGNUP_URL}>
              <Button type="button" variant="secondary">
                Sign up
              </Button>
            </a>
          </div>
        </Card>
      </div>
    );
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
