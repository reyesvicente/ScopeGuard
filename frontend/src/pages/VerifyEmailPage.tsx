import { Alert, Button } from "ice-ds";
import { useNavigate, useParams } from "react-router";

import { useVerifyEmail } from "../features/auth/api";
import { AuthLayout } from "../features/auth/components/AuthLayout";
import { AuthLink } from "../features/auth/components/AuthLink";
import { AuthError } from "../features/auth/headless";

export default function VerifyEmailPage() {
  const { key = "" } = useParams();
  const navigate = useNavigate();
  const verify = useVerifyEmail();

  // Confirm on click rather than on load, so link scanners in mail clients
  // can't use up the key.
  const confirm = () =>
    verify.mutate(key, {
      onSuccess: (signedIn) => navigate(signedIn ? "/" : "/login?verified=1", { replace: true }),
    });

  const error = verify.error;
  const badLink = error instanceof AuthError && "key" in error.fieldErrors;

  return (
    <AuthLayout title="Confirm your email" description="One click and you're in.">
      {badLink ? (
        <Alert intent="error" title="This link has expired">
          Confirmation links work once. <AuthLink to="/login">Log in</AuthLink> and we'll send a new one.
        </Alert>
      ) : (
        <>
          {error && (
            <Alert intent="error" title="Couldn't confirm your email">
              {error instanceof AuthError
                ? error.message
                : "Couldn't reach the server. Check your connection and try again."}
            </Alert>
          )}
          <Button type="button" size="lg" loading={verify.isPending} onClick={confirm}>
            Confirm my email
          </Button>
        </>
      )}
    </AuthLayout>
  );
}
