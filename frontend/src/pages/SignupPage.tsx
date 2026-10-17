import { Alert } from "ice-ds";
import { useState } from "react";
import { useSearchParams } from "react-router";

import { AuthLayout } from "../features/auth/components/AuthLayout";
import { AuthLink } from "../features/auth/components/AuthLink";
import { SignupForm } from "../features/auth/components/SignupForm";

export default function SignupPage() {
  const [params] = useSearchParams();
  const [sentTo, setSentTo] = useState<string | null>(null);
  const next = params.get("next");
  const loginHref = next ? `/login?next=${encodeURIComponent(next)}` : "/login";

  // After signup the card becomes its own "check your inbox" step, so it doesn't
  // look like the form just reloaded.
  if (sentTo) {
    return (
      <AuthLayout
        title="Check your inbox"
        description="Your account is created. One more step to sign in."
        footer={
          <p>
            Confirmed already? <AuthLink to={loginHref}>Log in</AuthLink>
          </p>
        }
      >
        <Alert intent="success" title="Confirmation email sent">
          We sent a link to <strong>{sentTo}</strong>. Open it and click <strong>Confirm my email</strong>{" "}
          to finish setting up your account.
        </Alert>
        <p className="text-sm">
          Nothing after a few minutes? Check your spam folder, or{" "}
          <AuthLink to={loginHref}>log in</AuthLink> and we'll send a new link.
        </p>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Create your account"
      footer={
        <p>
          Already have an account? <AuthLink to={loginHref}>Log in</AuthLink>
        </p>
      }
    >
      <SignupForm onVerificationSent={setSentTo} />
    </AuthLayout>
  );
}
