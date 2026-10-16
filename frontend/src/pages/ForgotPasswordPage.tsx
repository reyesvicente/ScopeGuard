import { AuthLayout } from "../features/auth/components/AuthLayout";
import { AuthLink } from "../features/auth/components/AuthLink";
import { ForgotPasswordForm } from "../features/auth/components/ForgotPasswordForm";

export default function ForgotPasswordPage() {
  return (
    <AuthLayout
      title="Reset your password"
      description="We'll email you a link to choose a new one."
      footer={
        <p>
          Remembered it? <AuthLink to="/login">Log in</AuthLink>
        </p>
      }
    >
      <ForgotPasswordForm />
    </AuthLayout>
  );
}
