import { Alert } from "ice-ds";
import { useSearchParams } from "react-router";

import { AuthLayout } from "../features/auth/components/AuthLayout";
import { AuthLink } from "../features/auth/components/AuthLink";
import { LoginForm } from "../features/auth/components/LoginForm";

export default function LoginPage() {
  const [params] = useSearchParams();
  const next = params.get("next");
  const signupHref = next ? `/signup?next=${encodeURIComponent(next)}` : "/signup";

  return (
    <AuthLayout
      title="Log in"
      footer={
        <p>
          New here? <AuthLink to={signupHref}>Create an account</AuthLink>
        </p>
      }
    >
      {params.has("verified") && (
        <Alert intent="success" title="Email confirmed">
          Log in to start checking requests.
        </Alert>
      )}
      {params.has("reset") && (
        <Alert intent="success" title="Password updated">
          Log in with your new password.
        </Alert>
      )}
      <LoginForm />
    </AuthLayout>
  );
}
