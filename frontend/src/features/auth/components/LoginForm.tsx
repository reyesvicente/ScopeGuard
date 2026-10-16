import { zodResolver } from "@hookform/resolvers/zod";
import { Alert, Button, Field, Input } from "ice-ds";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router";
import { z } from "zod";

import { useLogin, useNextPath } from "../api";
import { applyAuthError } from "../formErrors";
import { AuthError } from "../headless";
import { AuthLink } from "./AuthLink";

const schema = z.object({
  email: z.string().trim().email("Enter the email you signed up with."),
  password: z.string().min(1, "Enter your password."),
});

type FormValues = z.infer<typeof schema>;
const FIELDS = ["email", "password"] as const;

export function LoginForm() {
  const login = useLogin();
  const navigate = useNavigate();
  const next = useNextPath();
  const [banner, setBanner] = useState("");
  const [needsVerification, setNeedsVerification] = useState(false);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = handleSubmit((values) => {
    setBanner("");
    setNeedsVerification(false);
    login.mutate(values, {
      onSuccess: (outcome) => {
        if (outcome === "verify_email") setNeedsVerification(true);
        else navigate(next, { replace: true });
      },
      onError: (error) => {
        if (error instanceof AuthError && error.status === 409) navigate(next, { replace: true });
        else setBanner(applyAuthError(error, FIELDS, setError));
      },
    });
  });

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5" noValidate>
      <Field label="Email" htmlFor="email" required error={errors.email?.message}>
        <Input id="email" type="email" autoComplete="email" {...register("email")} />
      </Field>
      <Field label="Password" htmlFor="password" required error={errors.password?.message}>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          {...register("password")}
        />
      </Field>
      <div className="-mt-2 text-right text-sm">
        <AuthLink to="/password/reset">Forgot your password?</AuthLink>
      </div>
      {needsVerification && (
        <Alert intent="info" title="Verify your email first">
          We sent you a link when you signed up. Open it, then log in again.
        </Alert>
      )}
      {banner && (
        <Alert intent="error" title="Couldn't log you in">
          {banner}
        </Alert>
      )}
      <Button type="submit" size="lg" loading={login.isPending}>
        Log in
      </Button>
    </form>
  );
}
