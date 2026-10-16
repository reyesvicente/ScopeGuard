import { zodResolver } from "@hookform/resolvers/zod";
import { Alert, Button, Field, Input } from "ice-ds";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router";
import { z } from "zod";

import { useResetPassword } from "../api";
import { applyAuthError } from "../formErrors";
import { AuthError } from "../headless";
import { AuthLink } from "./AuthLink";

const schema = z
  .object({
    password: z.string().min(8, "Use at least 8 characters."),
    confirm: z.string(),
  })
  .refine((values) => values.password === values.confirm, {
    path: ["confirm"],
    message: "Passwords don't match.",
  });

type FormValues = z.infer<typeof schema>;
const FIELDS = ["password"] as const;

export function ResetPasswordForm({ resetKey }: { resetKey: string }) {
  const resetPassword = useResetPassword();
  const navigate = useNavigate();
  const [banner, setBanner] = useState("");
  const [badLink, setBadLink] = useState(false);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { password: "", confirm: "" },
  });

  if (badLink) {
    return (
      <Alert intent="error" title="This link has expired">
        Reset links work once and expire after a few days.{" "}
        <AuthLink to="/password/reset">Request a new one.</AuthLink>
      </Alert>
    );
  }

  const onSubmit = handleSubmit(({ password }) => {
    setBanner("");
    resetPassword.mutate(
      { key: resetKey, password },
      {
        onSuccess: () => navigate("/login?reset=1", { replace: true }),
        onError: (error) => {
          if (error instanceof AuthError && "key" in error.fieldErrors) setBadLink(true);
          else setBanner(applyAuthError(error, FIELDS, setError));
        },
      },
    );
  });

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5" noValidate>
      <Field label="New password" htmlFor="password" required error={errors.password?.message}>
        <Input id="password" type="password" autoComplete="new-password" {...register("password")} />
      </Field>
      <Field label="Confirm password" htmlFor="confirm" required error={errors.confirm?.message}>
        <Input id="confirm" type="password" autoComplete="new-password" {...register("confirm")} />
      </Field>
      {banner && (
        <Alert intent="error" title="Couldn't reset your password">
          {banner}
        </Alert>
      )}
      <Button type="submit" size="lg" loading={resetPassword.isPending}>
        Set new password
      </Button>
    </form>
  );
}
