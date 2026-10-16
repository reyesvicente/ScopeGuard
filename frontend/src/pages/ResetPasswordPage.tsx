import { useParams } from "react-router";

import { AuthLayout } from "../features/auth/components/AuthLayout";
import { ResetPasswordForm } from "../features/auth/components/ResetPasswordForm";

export default function ResetPasswordPage() {
  const { key = "" } = useParams();

  return (
    <AuthLayout title="Choose a new password">
      <ResetPasswordForm resetKey={key} />
    </AuthLayout>
  );
}
