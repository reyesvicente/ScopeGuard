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

  return (
    <AuthLayout
      title="Create your account"
      footer={
        <p>
          Already have an account? <AuthLink to={loginHref}>Log in</AuthLink>
        </p>
      }
    >
      {sentTo ? (
        <Alert intent="success" title="Check your inbox">
          We sent a confirmation link to {sentTo}. Open it to finish setting up your account.
        </Alert>
      ) : (
        <SignupForm onVerificationSent={setSentTo} />
      )}
    </AuthLayout>
  );
}
